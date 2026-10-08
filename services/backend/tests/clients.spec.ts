import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getEthereumFeeHistory } from '../src/network/clients';

/**
 * A fake Ethereum chain + client for `eth_feeHistory`.
 *
 * The fake mimics the behavior described in the issue: like geth, erigon,
 * reth and Nethermind it silently caps every request at 1024 blocks, no
 * matter how many were asked for. The base fee of block `n` is `n`, so the
 * expected merged history is an exact, checkable sequence with no gaps and
 * no duplicated boundary blocks.
 */
const hoisted = vi.hoisted(() => {
  const TIP = 20000;
  const MAX_BLOCKS_PER_REQUEST = 1024;
  const calls: Array<{ blockCount: unknown; newestBlock: unknown }> = [];

  const hex = (value: number) => `0x${value.toString(16)}`;
  const feeRange = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => hex(from + i));

  const send = async (method: string, params: Array<unknown>) => {
    if (method !== 'eth_feeHistory') throw Error(`unexpected method ${method}`);
    const [rawCount, rawNewest] = params;
    calls.push({ blockCount: rawCount, newestBlock: rawNewest });
    const requested =
      typeof rawCount === 'number'
        ? rawCount
        : parseInt(rawCount as string, 16);
    const count = Math.min(requested, MAX_BLOCKS_PER_REQUEST);
    const newest =
      rawNewest === 'latest' ? TIP : parseInt(rawNewest as string, 16);
    const oldest = newest - count + 1;
    return {
      baseFeePerGas: feeRange(oldest, newest + 1),
      gasUsedRatio: Array(count).fill(0.5),
      baseFeePerBlobGas: feeRange(oldest, newest + 1),
      blobGasUsedRatio: Array(count).fill(0.5),
      oldestBlock: hex(oldest),
    };
  };

  return { TIP, MAX_BLOCKS_PER_REQUEST, calls, send, hex };
});

vi.mock('@rosen-bridge/abstract-logger', () => {
  const logger = {
    child: () => logger,
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  return { DefaultLogger: { getInstance: () => logger } };
});

vi.mock('ethers', () => ({
  JsonRpcProvider: class {
    send = hoisted.send;
    getBlockNumber = async () => hoisted.TIP;
  },
}));

vi.mock('@rosen-bridge/firo-scanner', () => ({
  ElectrumXSocket: class {
    sendRequest = async () => ({ hex: '', height: 0 });
  },
}));

vi.mock('@rosen-clients/cardano-koios', () => ({
  default: () => ({ tip: async () => [{ block_no: 0 }] }),
}));

vi.mock('@rosen-clients/ergo-explorer', () => ({
  default: () => ({ v1: {} }),
}));

vi.mock('ergo-lib-wasm-nodejs', () => ({}));

describe('getEthereumFeeHistory', () => {
  beforeEach(() => {
    hoisted.calls.length = 0;
  });

  it('covers the full configured period of 7200 blocks, not just the first capped chunk', async () => {
    const history = await getEthereumFeeHistory();

    expect(history.gasUsedRatio).toHaveLength(7200);
    expect(history.blobGasUsedRatio).toHaveLength(7200);
    // baseFeePerGas carries one extra entry: the base fee of the block
    // after the newest one, exactly as a single uncapped call would
    expect(history.baseFeePerGas).toHaveLength(7201);
    expect(history.baseFeePerBlobGas).toHaveLength(7201);
    expect(history.oldestBlock).toEqual(hoisted.hex(hoisted.TIP - 7200 + 1));
  });

  it('merges the chunks into one contiguous history with no duplicated boundary blocks', async () => {
    const history = await getEthereumFeeHistory();

    const expectedBaseFees = Array.from({ length: 7201 }, (_, i) =>
      hoisted.hex(hoisted.TIP - 7200 + 1 + i),
    );
    expect(history.baseFeePerGas).toEqual(expectedBaseFees);
    expect(history.baseFeePerBlobGas).toEqual(expectedBaseFees);
  });

  it('produces the same average as an uncapped single call over the period', async () => {
    const history = await getEthereumFeeHistory();

    // the exact computation generateNewFeeConfig performs
    const average =
      history.baseFeePerGas.reduce((acc, cur) => acc + BigInt(cur), 0n) /
      BigInt(history.baseFeePerGas.length);
    // the base fees are the block numbers 12801..20001, an arithmetic
    // sequence whose mean is its middle element
    expect(average).toEqual(16401n);
  });

  it('requests at most 1024 blocks per call and sends the count as a hex string', async () => {
    await getEthereumFeeHistory();

    expect(hoisted.calls).toHaveLength(8); // ceil(7200 / 1024)
    const counts = hoisted.calls.map((call) => {
      // a plain JSON number is rejected by strict clients (Nethermind);
      // the JSON-RPC QUANTITY encoding is a hex string
      expect(typeof call.blockCount).toEqual('string');
      return parseInt(call.blockCount as string, 16);
    });
    expect(counts).toEqual([1024, 1024, 1024, 1024, 1024, 1024, 1024, 32]);
    counts.forEach((count) =>
      expect(count).toBeLessThanOrEqual(hoisted.MAX_BLOCKS_PER_REQUEST),
    );
  });

  it('walks each following chunk backwards from the previous chunk\u2019s oldest block', async () => {
    await getEthereumFeeHistory();

    expect(hoisted.calls.length).toBeGreaterThan(1);
    expect(hoisted.calls[0].newestBlock).toEqual('latest');
    hoisted.calls.slice(1).forEach((call, i) => {
      expect(call.newestBlock).toEqual(
        hoisted.hex(hoisted.TIP - hoisted.MAX_BLOCKS_PER_REQUEST * (i + 1)),
      );
    });
  });
});
