'use server';

import process from 'node:process';

import { ErgoNetworkType, Fee, MinimumFeeBox } from '@rosen-bridge/minimum-fee';

import { ERGO_EXPLORER_API_URL } from '@/constants';
import {
  MinimumFeeBoxFetchFailedError,
  MinimumFeeBoxInstantiationError,
} from '@/error';
import { wrap } from '@/safeServerAction';

/**
 * A simple wrapper around MinimumFeeBox instantiation
 * @param tokenId
 */
const getUnfetchedTokenMinimumFeeBox = (tokenId: string) => {
  try {
    return new MinimumFeeBox(
      tokenId,
      process.env.MINIMUM_FEE_CONFIG_NFT!,
      ErgoNetworkType.explorer,
      ERGO_EXPLORER_API_URL,
    );
  } catch (error) {
    throw new MinimumFeeBoxInstantiationError(error);
  }
};

/**
 * Get minimum fee box of a token
 * @param tokenId
 */
export const getTokenMinimumFeeBox = async (
  tokenId: string,
): Promise<Fee[]> => {
  const tokenMinimumFeeBox = getUnfetchedTokenMinimumFeeBox(tokenId);

  const isFetchSuccessful = await tokenMinimumFeeBox.fetchBox();
  if (!isFetchSuccessful) {
    throw new MinimumFeeBoxFetchFailedError();
  }

  return tokenMinimumFeeBox.getConfigs();
};

export const getTokenMinimumFeeBoxSafe = wrap(getTokenMinimumFeeBox);
