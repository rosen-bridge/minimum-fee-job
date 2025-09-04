import { Err, Ok, Result } from "ts-results-es";

import { getPrices, getTokensConfig } from "../_store";
import getFeesByToken from "../_utils/get-fees-by-token";
import validateActualAgainstExpected from "../_utils/validate-actual-against-expected";

import {
  ChainTokenConfigMissing,
  NetworkFeeValidationError,
  TokenConfigMissing,
} from "../_error/network-fee-validation";

import { PartialSupportedTokenConfig } from "../_types/token-config";
import { Validate } from "./types";

const chainTokensMap = {
  ergo: "ERG",
  cardano: "ADA",
  bitcoin: "BTC",
  ethereum: "ETH",
} as const;

/**
 * Network fee calculation formula
 * @param networkFee
 * @param price
 * @param decimals
 * @param chainTokenPrice
 */
const calculateTokenNetworkFee = (
  networkFee: number,
  price: number,
  decimals: number,
  chainTokenPrice: number
) => ((networkFee / 10 ** decimals) * price) / chainTokenPrice;

/**
 * Factory for Validating that network fee calculation results in the predefined
 * expected value
 */
const validateNetworkFeeFactory: (
  network: keyof typeof chainTokensMap,
  calculateExpected: (tokenConfig: PartialSupportedTokenConfig) => number
) => Validate = (network, calculateExpected) => async (tokenId) => {
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
    const networkFee = newFeeConfigs[network].networkFee;

    const tokenConfig = tokensConfig.find(
      (token) => token.ergoSideTokenId === tokenId
    );
    const chainTokenConfig = tokensConfig.find(
      (token) => token.name.toUpperCase() === chainTokensMap[network]
    );

    if (!tokenConfig) {
      return Err(new TokenConfigMissing());
    }
    if (!chainTokenConfig) {
      return Err(new ChainTokenConfigMissing(chainTokensMap[network]));
    }

    const actual = calculateTokenNetworkFee(
      Number(networkFee),
      +prices[tokenConfig.tokenId],
      tokenConfig.decimals,
      +prices[chainTokenConfig.tokenId]
    );
    const expected = calculateExpected(tokenConfig);

    return Ok(validateActualAgainstExpected(actual, expected));
  } catch (error) {
    return Err(new NetworkFeeValidationError(error));
  }
};

export default validateNetworkFeeFactory;
