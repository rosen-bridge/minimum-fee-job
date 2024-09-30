import { Err, Ok, Result } from "ts-results-es";

import { getPrices, getTokensConfig } from "../_store";
import calculateErrorPercent from "../_utils/calculate-error-percent";
import getFeesByToken from "../_utils/get-fees-by-token";

import {
  BridgeFeeValidationError,
  TokenConfigMissing,
} from "../_error/bridge-fee-validation";

import { VALID_ERROR_PERCENT_THRESHOLD } from "../constants";

import { Validate } from "./types";

/**
 * Bridge fee calculation formula
 * @param bridgeFee
 * @param price
 * @param decimals
 */
const calculateTokenBridgeFee = (
  bridgeFee: number,
  price: number,
  decimals: number
) => (bridgeFee * price) / 10 ** decimals;

/**
 * Validate that bridgeFee, feeRatio, rsnRatio, and rsnRatioDivisor is the same
 * in the new config for all chains
 * @param tokenId
 */
const validateBridgeFee: Validate = async (tokenId) => {
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

    const tokenConfig = tokensConfig.find(
      (token) => token.ergoSideTokenId === tokenId
    );

    if (!tokenConfig) {
      return Err(new TokenConfigMissing());
    }

    const actual = calculateTokenBridgeFee(
      Number(bridgeFee),
      +prices[tokenConfig.tokenId],
      tokenConfig.decimals
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
    return Err(new BridgeFeeValidationError(error));
  }
};

export default validateBridgeFee;
