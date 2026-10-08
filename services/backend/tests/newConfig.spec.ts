import { describe, expect, it, vi } from 'vitest';

import { feeConfigFromPrice } from '../src/minimum-fee/newConfig';
import { Chains, FeeParameters } from '../src/types';

const tokenId = 'test-token-id';

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

vi.mock('../src/network/clients', () => ({
  getBitcoinFeeRatio: vi.fn(),
  getDogeFeeRatio: vi.fn(),
  getEthereumFeeHistory: vi.fn(),
  getFiroFeeRatio: vi.fn(),
  getHandshakeFeeRatio: vi.fn(),
}));

vi.mock('../src/tokenMap/tokenHandler', () => ({
  TokenHandler: {
    getInstance: () => ({
      getTokenMap: () => ({
        getConfig: () => [{ ergo: { tokenId: 'test-token-id' } }],
      }),
    }),
  },
}));

const feeParameters = (feeRatioFloat: number): FeeParameters => ({
  delays: {
    ergo: 0,
    cardano: 0,
    bitcoin: 0,
    ethereum: 0,
    binance: 0,
    doge: 0,
    firo: 0,
    handshake: 0,
  },
  bridgeFeeUSD: 1,
  ergNetworkFee: 0.001,
  adaNetworkFee: 0.2,
  bitcoinConfirmation: 6,
  dogeConfirmation: 6,
  feeRatioFloat,
  rsnRatioDivisor: 1,
});

const generateFeeRatio = async (feeRatioFloat: number) => {
  const prices = new Map<string, number>([
    [tokenId, 2],
    ['erg', 3],
  ]);
  const chainHeights = new Map<Chains, number>(
    Object.values(Chains).map((chain) => [chain, 1000]),
  );
  const feeConfig = await feeConfigFromPrice(
    tokenId,
    prices,
    chainHeights,
    0.5, // rsnPrice
    9, // rsnDecimal
    9, // tokenDecimal
    feeParameters(feeRatioFloat),
    {}, // bitcoinFeeRatioMap
    1, // dogeFeeRatio
    1, // firoFeeRatio
    1, // handshakeFeeRatio
    0.01, // ethereumNetworkFeeInEther
  );
  return feeConfig.getConfig().configs[Chains.ERGO].feeRatio;
};

describe('feeConfigFromPrice fee ratio', () => {
  /**
   * fee ratios whose float product with the fee ratio divisor (10000) is
   * not an integer due to floating-point residue used to make
   * `BigInt(feeRatioFloat * feeRatioDivisor)` throw a RangeError, failing
   * the whole minimum fee job run
   */
  it.each<[number, bigint]>([
    [0.0003, 3n],
    [0.0029, 29n],
    [0.0006, 6n],
    [0.0012, 12n],
    [0.0024, 24n],
    [0.0048, 48n],
  ])(
    'should convert fee ratio %s to %s without throwing',
    async (feeRatioFloat, expectedFeeRatio) => {
      await expect(generateFeeRatio(feeRatioFloat)).resolves.toEqual(
        expectedFeeRatio,
      );
    },
  );

  /**
   * fee ratios that already converted correctly must keep their exact
   * scaled value
   */
  it.each<[number, bigint]>([
    [0.005, 50n],
    [0.0007, 7n],
    [0.15, 1500n],
    [0, 0n],
  ])(
    'should keep converting fee ratio %s to %s',
    async (feeRatioFloat, expectedFeeRatio) => {
      await expect(generateFeeRatio(feeRatioFloat)).resolves.toEqual(
        expectedFeeRatio,
      );
    },
  );
});
