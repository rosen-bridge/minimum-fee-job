import { ErgoBox } from '@fleet-sdk/core';
import process from 'node:process';

import ergoNodeClientFactory from '@rosen-clients/ergo-node';

import { BOX_FETCHING_PAGE_SIZE } from '@/constants';

const nodeClient = ergoNodeClientFactory(process.env.ERGO_NODE_URL!);

/**
 * fetches all unspent boxes for the OCTM address that contain the OCTM NFT
 *
 * @returns promise that resolves to an array of ErgoBox objects
 */
export const getOctmBoxes = async (): Promise<ErgoBox[]> => {
  const boxes = await getAddressUnspentBoxes(process.env.OCTM_ADDRESS!);

  return boxes.filter((box) =>
    box.assets.some(
      (asset) => asset.tokenId === process.env.OCTM_NFT && asset.amount === 1n,
    ),
  );
};

/**
 * fetches unspent boxes from the node api
 *
 * @param address - the Base58-encoded Ergo address to query
 * @returns promise that resolves to an array of ErgoBox objects
 */
export const getAddressUnspentBoxes = async (
  address: string,
): Promise<ErgoBox[]> => {
  const boxes: ErgoBox[] = [];
  let currentPage = 0;

  while (true) {
    const boxesPage = await nodeClient.getBoxesByAddressUnspent(address, {
      offset: currentPage * BOX_FETCHING_PAGE_SIZE,
      limit: BOX_FETCHING_PAGE_SIZE,
      sortDirection: 'desc',
    });
    if (boxesPage.length === 0) break;

    boxes.push(
      ...boxesPage.map(
        (box) =>
          new ErgoBox({
            ...box,
            assets: box.assets ?? [],
            boxId: box.boxId ?? '',
            index: box.index ?? 0,
            transactionId: box.transactionId ?? '',
          }),
      ),
    );
    currentPage++;
  }

  return boxes;
};
