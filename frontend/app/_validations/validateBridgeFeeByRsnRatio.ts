import { Err, Ok, Result } from "ts-results-es";

import { getPrices, getTokensConfig } from "../_store";
import calculateErrorPercent from "../_utils/calculate-error-percent";
import getFeesByToken from "../_utils/get-fees-by-token";

import {
  BridgeFeeValidationByRsnRatioError,
  RsnConfigMissing,
  TokenConfigMissing,
} from "../_error/bridge-fee-validation-by-rsn-ratio";

import { VALID_ERROR_PERCENT_THRESHOLD } from "../constants";

import { Validate } from "./types";

/**
 * Rsn ratio calculation formula
 * @param bridgeFee
 * @param rsnRatio
 * @param rsnPrice
 */
const calculateTokenRsnRatio = (
  bridgeFee: number,
  rsnRatio: number,
  rsnPrice: number,
  rsnRatioDivisor: number
) => (bridgeFee * rsnRatio * rsnPrice) / (10 ** 3 * rsnRatioDivisor);

/**
 * Validate that bridge fee calculation by rsn ratio results in the predefined
 * expected value
 * @param tokenId
 */
const validateBridgeFeeByRsnRatio: Validate = async (tokenId) => {
  const feesByTokenResult = await getFeesByToken();
  const tokensConfigResult = await getTokensConfig();
  const pricesResult = await getPrices();

  const requirementsResult = Result.all(
    feesByTokenResult,
    tokensConfigResult,
    pricesResult
  );

  if (requirementsResult.isErr()) {
    return requirementsResult;
  }

  const [feesByToken, tokensConfig, prices] = requirementsResult.value;

  try {
    const fees = feesByToken[tokenId];
    const newFeeConfigs = fees.at(-1)!.configs;
    const bridgeFee = newFeeConfigs.ergo.bridgeFee; // pick bridge fee from any chain, they should be all the same
    const rsnRatio = newFeeConfigs.ergo.rsnRatio; // pick rsn ratio from any chain, they should be all the same
    const rsnRatioDivisor = newFeeConfigs.ergo.rsnRatioDivisor; // pick rsn ratio divisor from any chain, they should be all the same

    const tokenConfig = tokensConfig.find(
      (token) => token.ergoSideTokenId === tokenId
    );
    if (!tokenConfig) {
      return Err(new TokenConfigMissing());
    }

    const rsnConfig = tokensConfig.find((token) => token.name === "RSN");
    if (!rsnConfig) {
      return Err(new RsnConfigMissing());
    }

    const actual = calculateTokenRsnRatio(
      Number(bridgeFee),
      Number(rsnRatio),
      +prices[rsnConfig?.tokenId],
      Number(rsnRatioDivisor)
    );
    const expected = tokenConfig.fee.bridgeFeeUSD;

    const errorPercent = calculateErrorPercent(actual, expected);
    const isValid = errorPercent < VALID_ERROR_PERCENT_THRESHOLD;

    return Ok({
      isValid,
      reason: `${actual}:${expected} (actual:expected) (~${+errorPercent.toFixed(
        2
      )}% error)`,
    });
  } catch (error) {
    return Err(new BridgeFeeValidationByRsnRatioError(error));
  }
};

export default validateBridgeFeeByRsnRatio;
