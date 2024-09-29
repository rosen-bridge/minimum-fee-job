import { difference, initial } from "lodash-es";

import getFeesByToken from "../_utils/get-fees-by-token";
import getTokenMinimumFeeBox from "../_utils/get-token-minimum-fee-box";

import { Validate } from "./types";

/**
 * Validate that new heights of a minimum fee config in the minimum fee
 * transaction update contains all of the previous heights
 * @param tokenId
 */
const validateTokenHeights: Validate = async (tokenId) => {
  const feesByTokenResult = await getFeesByToken();

  if (feesByTokenResult.error) {
    return feesByTokenResult;
  }

  const feesByToken = feesByTokenResult.value;

  try {
    const tokenMinimumFeeBox = await getTokenMinimumFeeBox(tokenId);

    const currentHeights = tokenMinimumFeeBox
      .getConfigs()
      .map((feeConfig) => Object.values(feeConfig.heights).toString());

    const nextHeights = feesByToken[tokenId].map(
      (feeConfig) => Object.values(feeConfig.heights).toString() // convert to string to simplify comparison
    );

    const heightsDiff = difference(initial(nextHeights), currentHeights);

    return {
      error: null,
      value: {
        isValid: heightsDiff.length === 0,
        reason:
          heightsDiff.length !== 0
            ? `Missing heights: ${JSON.stringify(heightsDiff)}`
            : null,
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error
          : new Error(
              typeof error === "string"
                ? error
                : "An unknown error occurred during height validation"
            ),
      value: null,
    };
  }
};

export default validateTokenHeights;
