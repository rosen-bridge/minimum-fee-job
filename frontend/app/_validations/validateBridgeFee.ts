import calculateErrorPercent from "../_utils/calculate-error-percent";
import getFeesByToken from "../_utils/get-fees-by-token";
import getPrices from "../_utils/get-prices";
import getTokensConfig from "../_utils/get-tokens-config";

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
  if (feesByTokenResult.error) {
    return feesByTokenResult;
  }
  const feesByToken = feesByTokenResult.value;

  const tokensConfigResult = await getTokensConfig();
  if (tokensConfigResult.error) {
    return tokensConfigResult;
  }
  const tokensConfig = tokensConfigResult.value;

  const pricesResult = await getPrices();
  if (pricesResult.error) {
    return pricesResult;
  }
  const prices = pricesResult.value;

  try {
    const fees = feesByToken[tokenId];
    const newFeeConfigs = fees.at(-1)!.configs;
    const bridgeFee = newFeeConfigs.ergo.bridgeFee; // pick bridge fee from any chain, they should be all the same

    const tokenConfig = tokensConfig.find(
      (token) => token.ergoSideTokenId === tokenId
    );

    if (!tokenConfig) {
      return {
        value: null,
        error: new Error("Token was not found in backend tokens config"),
      };
    }

    const actual = calculateTokenBridgeFee(
      Number(bridgeFee),
      +prices[tokenConfig.tokenId],
      tokenConfig.decimals
    );
    const expected = tokenConfig.fee.bridgeFeeUSD;

    const errorPercent = calculateErrorPercent(actual, expected);
    const isValid = errorPercent < VALID_ERROR_PERCENT_THRESHOLD;

    return {
      error: null,
      value: {
        isValid,
        reason: `${actual}:${expected} (actual:expected) (~${+errorPercent.toFixed(
          2
        )}% error)`,
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error
          : new Error("An unknown error occurred during bridge fee validation"),
      value: null,
    };
  }
};

export default validateBridgeFee;
