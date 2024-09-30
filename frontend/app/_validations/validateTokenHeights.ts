import { difference, initial } from "lodash-es";
import { Err, Ok, Result } from "ts-results-es";

import getFeesByToken from "../_utils/get-fees-by-token";
import getUnfetchedTokenMinimumFeeBox from "../_utils/get-token-minimum-fee-box";

import { HeightValidationError } from "../_error/height-validation";

import { Validate } from "./types";

/**
 * Validate that new heights of a minimum fee config in the minimum fee
 * transaction update contains all of the previous heights
 * @param tokenId
 */
const validateTokenHeights: Validate = async (tokenId) => {
  const feesByTokenResult = await getFeesByToken();
  const tokenMinimumFeeBoxResult = await getUnfetchedTokenMinimumFeeBox(
    tokenId
  );

  const requirementsResult = Result.all(
    feesByTokenResult,
    tokenMinimumFeeBoxResult
  );

  if (requirementsResult.isErr()) {
    return requirementsResult;
  }

  const [feesByToken, tokenMinimumFeeBox] = requirementsResult.value;

  try {
    const currentHeights = tokenMinimumFeeBox
      .getConfigs()
      .map((feeConfig) => Object.values(feeConfig.heights).toString());

    const nextHeights = feesByToken[tokenId].map(
      (feeConfig) => Object.values(feeConfig.heights).toString() // convert to string to simplify comparison
    );

    const heightsDiff = difference(initial(nextHeights), currentHeights);

    return Ok({
      isValid: heightsDiff.length === 0,
      reason:
        heightsDiff.length !== 0
          ? `Missing heights: ${JSON.stringify(heightsDiff)}`
          : null,
    });
  } catch (error) {
    return Err(new HeightValidationError(error));
  }
};

export default validateTokenHeights;
