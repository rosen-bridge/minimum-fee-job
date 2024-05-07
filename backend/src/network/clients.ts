import cardanoKoiosClientFactory from '@rosen-clients/cardano-koios';
import ergoExplorerClientFactory from '@rosen-clients/ergo-explorer';
import {
  esploraBaseUrl,
  explorerBaseUrl,
  koiosBaseUrl,
  minimumFeeConfigs,
} from '../configs';
import { ErgoBoxProxy } from '@rosen-bridge/ergo-box-selection';
import {
  BlockHeaders,
  ErgoBox,
  ErgoStateContext,
  PreHeader,
} from 'ergo-lib-wasm-nodejs';
import JsonBigInt from '@rosen-bridge/json-bigint';
import axios from 'axios';

const explorerClient = ergoExplorerClientFactory(explorerBaseUrl);
const koiosClient = cardanoKoiosClientFactory(koiosBaseUrl);
const esploraClient = axios.create({
  baseURL: esploraBaseUrl,
});

export const getErgoHeight = async (): Promise<number> =>
  Number((await explorerClient.v1.getApiV1Networkstate()).height);

export const getCardanoHeight = async (): Promise<number> =>
  Number((await koiosClient.getTip())[0].block_no!);

export const getBitcoinHeight = async (): Promise<number> =>
  Number((await esploraClient.get<number>(`/api/blocks/tip/height`)).data);

export const getAddressBoxes = async (
  address: string
): Promise<Array<ErgoBoxProxy>> => {
  const explorerBoxes = await explorerClient.v1.getApiV1BoxesUnspentByaddressP1(
    address
  );
  const result = explorerBoxes.items?.map((box) =>
    ErgoBox.from_json(JsonBigInt.stringify(box)).to_js_eip12()
  );
  if (!result) return [];
  return result;
};

export const getMinimumFeeConfigBox = async (
  tokenId: string
): Promise<ErgoBoxProxy | undefined> => {
  const boxes = (
    await explorerClient.v1.getApiV1BoxesUnspentBytokenidP1(
      minimumFeeConfigs.minimumFeeNFT
    )
  ).items;
  if (!boxes)
    throw Error(
      `found no box for minimum-fee NFT ${minimumFeeConfigs.minimumFeeNFT}`
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
        return ergoBox.to_js_eip12();
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
    JsonBigInt.stringify(header)
  );
  const lastBlocksHeaders = BlockHeaders.from_json(lastBlocksStrings);
  const lastBlockPreHeader = PreHeader.from_block_header(
    lastBlocksHeaders.get(0)
  );

  const stateContext = new ErgoStateContext(
    lastBlockPreHeader,
    lastBlocksHeaders
  );

  return stateContext;
};

export const getBitcoinFeeRatio = async (): Promise<Record<string, number>> => {
  return (await esploraClient.get<Record<string, number>>(`/api/fee-estimates`))
    .data;
};
