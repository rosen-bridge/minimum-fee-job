import JsonBigInt from "@rosen-bridge/json-bigint";
import { differenceWith, initial, isEqual } from "lodash-es";
import { Err, Ok, Result } from "ts-results-es";

import getFeesByToken from "../_utils/get-fees-by-token";
import getUnfetchedTokenMinimumFeeBox from "../_utils/get-token-minimum-fee-box";

import { OldFeesConsistencyValidationError } from "../_error/old-configs-consistency-validation";

import { Validate } from "./types";

/**
 * Validate that all of old fees in the minimum fee update transaction exist in
 * the box on the blockchain
 * @param tokenId
 */
const validateOldFeesConsistency: Validate = async (tokenId) => {
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
    const currentFees = tokenMinimumFeeBox.getConfigs();

    const nextFees = feesByToken[tokenId];

    const unexpectedFees = differenceWith(
      initial(nextFees),
      currentFees,
      isEqual
    );

    return Ok({
      isValid: unexpectedFees.length === 0,
      reason:
        unexpectedFees.length !== 0
          ? `Unexpected fees: ${JsonBigInt.stringify(unexpectedFees)}`
          : null,
    });
  } catch (error) {
    return Err(new OldFeesConsistencyValidationError(error));
  }
};

export default validateOldFeesConsistency;
