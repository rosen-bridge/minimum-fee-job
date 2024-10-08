import { ErgoNetworkType, MinimumFeeBox } from "@rosen-bridge/minimum-fee";
import { Err, Ok, Result } from "ts-results-es";

import {
  MinimumFeeBoxFetchFailedError,
  MinimumFeeBoxInstantiationError,
} from "@/app/_error/min-fee-box";

import { ERGO_EXPLORER_API_URL } from "@/app/constants";

/**
 * A simple wrapper around MinimumFeeBox instantiation
 * @param tokenId
 */
const getUnfetchedTokenMinimumFeeBox = (tokenId: string) => {
  try {
    return Ok(
      new MinimumFeeBox(
        tokenId,
        process.env.MINIMUM_FEE_CONFIG_NFT!,
        ErgoNetworkType.explorer,
        ERGO_EXPLORER_API_URL
      )
    );
  } catch (error) {
    return Err(new MinimumFeeBoxInstantiationError(error));
  }
};

/**
 * Get minimum fee box of a token
 * @param tokenId
 */
const getTokenMinimumFeeBox = async (
  tokenId: string
): Promise<
  Result<
    MinimumFeeBox,
    MinimumFeeBoxInstantiationError | MinimumFeeBoxFetchFailedError
  >
> => {
  const tokenMinimumFeeBoxResult = getUnfetchedTokenMinimumFeeBox(tokenId);

  if (tokenMinimumFeeBoxResult.isErr()) {
    return tokenMinimumFeeBoxResult;
  }

  const tokenMinimumFeeBox = tokenMinimumFeeBoxResult.value;

  const isFetchSuccessful = await tokenMinimumFeeBox.fetchBox();
  if (!isFetchSuccessful) {
    return Err(new MinimumFeeBoxFetchFailedError());
  }

  return Ok(tokenMinimumFeeBox);
};

export default getTokenMinimumFeeBox;
