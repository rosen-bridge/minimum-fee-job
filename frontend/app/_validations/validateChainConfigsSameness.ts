import { every, map, mapValues, omitBy, uniq } from "lodash-es";
import { Err, Ok } from "ts-results-es";

import getFeesByToken from "../_utils/get-fees-by-token";

import { ChainConfigsSamenessValidationError } from "../_error/chain-configs-sameness-validation";

import { Validate } from "./types";

/**
 * Validate that bridgeFee, feeRatio, rsnRatio, and rsnRatioDivisor is the same
 * in the new config for all chains
 * @param tokenId
 */
const validateChainConfigsSameness: Validate = async (tokenId) => {
  try {
    const feesByTokenResult = await getFeesByToken();

    if (feesByTokenResult.isErr()) {
      return feesByTokenResult;
    }

    const feesByToken = feesByTokenResult.value;

    const fees = feesByToken[tokenId];
    const newFeeConfigs = fees.at(-1)!.configs;

    const configs = {
      bridgeFees: map(newFeeConfigs, "bridgeFee"),
      feeRatios: map(newFeeConfigs, "feeRatio"),
      rsnRatios: map(newFeeConfigs, "rsnRatio"),
      rsnRatioDivisors: map(newFeeConfigs, "rsnRatioDivisor"),
    };

    const uniqConfigs = mapValues(configs, uniq);

    const isValid = every(uniqConfigs, ["length", 1]);

    return Ok({
      isValid,
      reason: !isValid
        ? Object.entries(omitBy(uniqConfigs, ["length", 1]))
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")
        : null,
    });
  } catch (error) {
    return Err(new ChainConfigsSamenessValidationError(error));
  }
};

export default validateChainConfigsSameness;
