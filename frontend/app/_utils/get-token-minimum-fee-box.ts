import { ErgoNetworkType, MinimumFeeBox } from "@rosen-bridge/minimum-fee";

import { ERGO_EXPLORER_API_URL } from "@/app/constants";

import { MinimumFeeBoxFetchFailedError } from "@/app/_error/min-fee-box";

/**
 * Get minimum fee box of a token
 * @param tokenId
 */
const getTokenMinimumFeeBox = async (tokenId: string) => {
  const tokenMinimumFeeBox = new MinimumFeeBox(
    tokenId,
    process.env.MINIMUM_FEE_CONFIG_NFT!,
    ErgoNetworkType.explorer,
    ERGO_EXPLORER_API_URL
  );

  const isFetchSuccessful = await tokenMinimumFeeBox.fetchBox();
  if (!isFetchSuccessful) {
    throw new MinimumFeeBoxFetchFailedError();
  }

  return tokenMinimumFeeBox;
};

export default getTokenMinimumFeeBox;
