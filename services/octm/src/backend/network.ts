import { ErgoBox } from '@fleet-sdk/core';

import ergoNodeClientFactory from '@rosen-clients/ergo-node';

import { BOX_FETCHING_PAGE_SIZE } from '@/constants';

let nodeClient: ReturnType<typeof ergoNodeClientFactory> | null = null;

/**
 * initializes the shared ergo node client with the given URL
 *
 * @param url - ergo node base URL
 * @returns the shared ergo node client
 */
export const initNodeClient = (url: string) => {
  if (!url) throw new Error('node URL is required');
  if (!nodeClient) {
    nodeClient = ergoNodeClientFactory(url);
  }
  return nodeClient;
};

/**
 * returns the shared ergo node client
 *
 * @throws if {@link initNodeClient} has not been called yet
 * @returns the shared ergo node client
 */
export const getNodeClient = () => {
  if (!nodeClient) {
    throw new Error(
      'node client not initialized; call initNodeClient(url) first',
    );
  }
  return nodeClient;
};

/**
 * fetches all unspent boxes for the OCTM address that contain the OCTM NFT
 *
 * @param octmAddress - the Base58-encoded OCTM address to query
 * @param octmNft - the token id of the OCTM NFT
 * @returns promise that resolves to an array of ErgoBox objects
 */
export const getOctmBoxes = async (
  octmAddress: string,
  octmNft: string,
): Promise<ErgoBox[]> => {
  const boxes = await getAddressUnspentBoxes(octmAddress);

  return boxes.filter((box) =>
    box.assets.some(
      (asset) => asset.tokenId === octmNft && asset.amount === 1n,
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
    const boxesPage = await getNodeClient().getBoxesByAddressUnspent(address, {
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
