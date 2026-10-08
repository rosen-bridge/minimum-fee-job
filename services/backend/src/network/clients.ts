import axios from 'axios';
import {
  BlockHeaders,
  ErgoBox,
  ErgoStateContext,
  PreHeader,
} from 'ergo-lib-wasm-nodejs';
import { JsonRpcProvider } from 'ethers';

import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { ElectrumXSocket } from '@rosen-bridge/firo-scanner';
import JsonBigInt from '@rosen-bridge/json-bigint';
import cardanoKoiosClientFactory from '@rosen-clients/cardano-koios';
import ergoExplorerClientFactory from '@rosen-clients/ergo-explorer';

import { auth, minimumFeeConfigs, urls } from '../configs';
import { EvmJsonRpcFeeHistoryResponse } from '../types';
import { HandshakeRpcClient } from './handshakeRpcClient';

const logger = DefaultLogger.getInstance().child(import.meta.url);

const explorerClient = ergoExplorerClientFactory(urls.ergoExplorer);
const koiosClient = cardanoKoiosClientFactory(urls.cardanoKoios, auth.koios);
const esploraClient = axios.create({
  baseURL: urls.bitcoinEsplora,
});
const dogeBlockcypherClient = axios.create({
  baseURL: urls.dogeBlockcypher,
});
const ethereumRpcClient = new JsonRpcProvider(urls.ethereumRpc);
const binanceRpcClient = new JsonRpcProvider(urls.binanceRpc);
export const firoClient = new ElectrumXSocket(
  urls.firoElectrumX.host,
  urls.firoElectrumX.port,
  urls.firoElectrumX.reconnectDelay,
  undefined,
  logger.child('electrumXSocket'),
);

const handshakeClient = new HandshakeRpcClient(
  urls.handshakeRpc,
  logger.child('handshakeRpcClient'),
);

export const getErgoHeight = async (): Promise<number> =>
  Number((await explorerClient.v1.getApiV1Networkstate()).height);

export const getCardanoHeight = async (): Promise<number> =>
  Number((await koiosClient.tip())[0].block_no!);

export const getBitcoinHeight = async (): Promise<number> =>
  Number((await esploraClient.get<number>(`/api/blocks/tip/height`)).data);

export const getDogeHeight = async (): Promise<number> =>
  Number((await dogeBlockcypherClient.get(`v1/doge/main`)).data.height);

export const getEthereumHeight = async (): Promise<number> =>
  await ethereumRpcClient.getBlockNumber();

export const getBinanceHeight = async (): Promise<number> =>
  await binanceRpcClient.getBlockNumber();

export const getFiroHeight = async (): Promise<number> => {
  const result = await firoClient.sendRequest<{ hex: string; height: number }>(
    'blockchain.headers.subscribe',
    [],
  );
  return result.height;
};

export const getHandshakeHeight = async (): Promise<number> =>
  await handshakeClient.getHeight();

export const getAddressBoxes = async (
  address: string,
): Promise<Array<ErgoBox>> => {
  const explorerBoxes =
    await explorerClient.v1.getApiV1BoxesUnspentByaddressP1(address);
  const result = explorerBoxes.items?.map((box) =>
    ErgoBox.from_json(JsonBigInt.stringify(box)),
  );
  if (!result) return [];
  return result;
};

export const getMinimumFeeConfigBox = async (
  tokenId: string,
): Promise<ErgoBox | undefined> => {
  const boxes = (
    await explorerClient.v1.getApiV1BoxesUnspentBytokenidP1(
      minimumFeeConfigs.minimumFeeNFT,
    )
  ).items;
  if (!boxes)
    throw Error(
      `found no box for minimum-fee NFT ${minimumFeeConfigs.minimumFeeNFT}`,
    );
  const targetBoxes = boxes
    .map((box) => {
      const ergoBox = ErgoBox.from_json(JsonBigInt.stringify(box));
      if (
        ((ergoBox.tokens().len() === 1 && tokenId === 'erg') ||
          (ergoBox.tokens().len() === 2 &&
            tokenId === ergoBox.tokens().get(1).id().to_str())) &&
        ergoBox.tokens().get(0).amount().as_i64().to_str() == '1'
      )
        return ergoBox;
      else return undefined;
    })
    .filter((val) => val !== undefined);
  if (targetBoxes.length === 0) return undefined;
  return targetBoxes[0];
};

export const getStateContext = async (): Promise<ErgoStateContext> => {
  const { items: lastBlocks } = await explorerClient.v1.getApiV1BlocksHeaders({
    offset: 0,
    limit: 10,
  });

  const lastBlocksStrings = lastBlocks!.map((header) =>
    JsonBigInt.stringify(header),
  );
  const lastBlocksHeaders = BlockHeaders.from_json(lastBlocksStrings);
  const lastBlockPreHeader = PreHeader.from_block_header(
    lastBlocksHeaders.get(0),
  );

  const stateContext = new ErgoStateContext(
    lastBlockPreHeader,
    lastBlocksHeaders,
  );

  return stateContext;
};

export const getBitcoinFeeRatio = async (): Promise<Record<string, number>> => {
  return (await esploraClient.get<Record<string, number>>(`/api/fee-estimates`))
    .data;
};

export const getDogeFeeRatio = async (): Promise<number> => {
  const response = await dogeBlockcypherClient.get(`v1/doge/main`);
  return response.data.medium_fee_per_kb / 1000;
};

export const getFiroFeeRatio = async (): Promise<number> => {
  const feeRate = await firoClient.sendRequest<number>(
    'blockchain.estimatefee',
    [6],
  );
  if (feeRate <= 0) {
    logger.warn(
      `ElectrumX estimatefee returned ${feeRate}, ` +
        `using fallback 10 sat/byte`,
    );
    return 10;
  }
  const feeSatoshis = Math.ceil(feeRate * 100000000);
  const feePerByte = Math.ceil(feeSatoshis / 1000);
  return feePerByte;
};

export const getHandshakeFeeRatio = async (): Promise<number> =>
  await handshakeClient.getFeeRatio();

/**
 * the maximum number of blocks most Ethereum clients return for a single
 * `eth_feeHistory` call: geth, erigon, reth and Nethermind silently cap the
 * request at this many blocks, and Besu rejects larger counts outright
 */
export const ETHEREUM_FEE_HISTORY_MAX_BLOCKS = 1024;

export const getEthereumFeeHistory =
  async (): Promise<EvmJsonRpcFeeHistoryResponse> => {
    // a single call cannot cover the configured period (7200 blocks by
    // default): most clients silently return at most 1024 blocks, so the
    // average would cover only ~3.4 hours instead of a day. Fetch the
    // period in chunks, walking backwards from the latest block, and merge
    // the chunks into the same shape one uncapped call would return.
    const chunks: Array<EvmJsonRpcFeeHistoryResponse> = [];
    let remaining = minimumFeeConfigs.ethereumAvgGasPricePeriod;
    let newestBlock = 'latest';
    while (remaining > 0) {
      const blockCount = Math.min(remaining, ETHEREUM_FEE_HISTORY_MAX_BLOCKS);
      const chunk: EvmJsonRpcFeeHistoryResponse = await ethereumRpcClient.send(
        'eth_feeHistory',
        [
          // the block count is a JSON-RPC QUANTITY and must be sent as a
          // hex string; strict clients (e.g. Nethermind) reject plain
          // JSON numbers here
          `0x${blockCount.toString(16)}`,
          newestBlock,
          [0, 100],
        ],
      );
      chunks.push(chunk);
      // a client may return fewer blocks than requested (a lower cap of
      // its own, or the start of the chain); the response itself says how
      // many blocks actually came back
      const fetchedBlocks = chunk.gasUsedRatio.length;
      if (fetchedBlocks === 0) break;
      remaining -= fetchedBlocks;
      const oldestBlock = Number(BigInt(chunk.oldestBlock));
      if (oldestBlock === 0) break;
      newestBlock = `0x${(oldestBlock - 1).toString(16)}`;
    }

    // merge the chunks oldest-first. Each chunk's baseFeePerGas (and
    // baseFeePerBlobGas) holds one extra entry — the fee of the block
    // after its newest block — which is the first entry of the next
    // chunk, so it is dropped from every chunk except the newest one to
    // avoid counting the boundary block twice.
    const chronological = [...chunks].reverse();
    const merged: EvmJsonRpcFeeHistoryResponse = {
      baseFeePerGas: [],
      gasUsedRatio: [],
      baseFeePerBlobGas: [],
      blobGasUsedRatio: [],
      oldestBlock: chronological[0]?.oldestBlock ?? '0x0',
    };
    chronological.forEach((chunk, index) => {
      const isNewestChunk = index === chronological.length - 1;
      merged.baseFeePerGas.push(
        ...(isNewestChunk
          ? chunk.baseFeePerGas
          : chunk.baseFeePerGas.slice(0, -1)),
      );
      merged.gasUsedRatio.push(...chunk.gasUsedRatio);
      const blobFees = chunk.baseFeePerBlobGas ?? [];
      merged.baseFeePerBlobGas.push(
        ...(isNewestChunk ? blobFees : blobFees.slice(0, -1)),
      );
      merged.blobGasUsedRatio.push(...(chunk.blobGasUsedRatio ?? []));
    });
    return merged;
  };
