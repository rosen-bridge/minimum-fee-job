import { Err, Ok, Result } from "ts-results-es";

import { getPrices, getTokensConfig } from "../_store";
import getFeesByToken from "../_utils/get-fees-by-token";
import validateActualAgainstExpected from "../_utils/validate-actual-against-expected";

import {
  BridgeFeeValidationByTokenError,
  TokenConfigMissing,
} from "../_error/bridge-fee-validation-by-token";

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
 * Validate that bridge fee calculation by token results in the predefined
 * expected value
 * @param tokenId
 */
const validateBridgeFeeByToken: Validate = async (tokenId) => {
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

    return Ok(validateActualAgainstExpected(actual, expected));
  } catch (error) {
    return Err(new BridgeFeeValidationByTokenError(error));
  }
};

export default validateBridgeFeeByToken;
