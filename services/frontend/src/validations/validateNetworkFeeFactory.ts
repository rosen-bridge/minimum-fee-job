import {
  ChainTokenConfigMissing,
  NetworkFeeValidationError,
  TokenConfigMissing,
} from '@/error';
import {
  fetchFeesByToken,
  fetchPrices,
  fetchTokenMap,
  fetchTokensConfig,
} from '@/queries';
import { PartialSupportedTokenConfig } from '@/types';
import { Validate } from '@/types';
import { getTokenInfo, validateActualAgainstExpected } from '@/utils';

const chainTokensMap = {
  ergo: 'ERG',
  cardano: 'ADA',
  bitcoin: 'BTC',
  ethereum: 'ETH',
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
  chainTokenPrice: number,
) => ((networkFee / 10 ** decimals) * price) / chainTokenPrice;

/**
 * Factory for Validating that network fee calculation results in the predefined
 * expected value
 */
export const validateNetworkFeeFactory: (
  network: keyof typeof chainTokensMap,
  calculateExpected: (tokenConfig: PartialSupportedTokenConfig) => number,
) => Validate = (network, calculateExpected) => async (tokenId) => {
  const feesByToken = await fetchFeesByToken();
  const tokenMap = await fetchTokenMap();
  const tokensConfig = await fetchTokensConfig();
  const prices = await fetchPrices();

  try {
    const fees = feesByToken[tokenId];
    const newFeeConfigs = fees.at(-1)!.configs;
    const networkFee = newFeeConfigs[network].networkFee;

    const tokenConfig = tokensConfig.find(
      (token) => token.ergoSideTokenId === tokenId,
    );
    const chainTokenConfig = tokensConfig.find(
      (token) => token.name.toUpperCase() === chainTokensMap[network],
    );

    if (!tokenConfig) {
      throw new TokenConfigMissing();
    }
    if (!chainTokenConfig) {
      throw new ChainTokenConfigMissing(chainTokensMap[network]);
    }

    const actual = calculateTokenNetworkFee(
      Number(networkFee),
      +prices[tokenConfig.tokenId],
      getTokenInfo(tokenMap, tokenId).significantDecimals,
      +prices[chainTokenConfig.tokenId],
    );

    const expected = calculateExpected(tokenConfig);

    return validateActualAgainstExpected(actual, expected);
  } catch (error) {
    throw new NetworkFeeValidationError(error);
  }
};
