import { BridgeFeeValidationByTokenError, TokenConfigMissing } from '@/error';
import {
  fetchFeesByToken,
  fetchPrices,
  fetchTokenMap,
  fetchTokensConfig,
} from '@/queries';
import { Validate } from '@/types';
import { getTokenInfo, validateActualAgainstExpected } from '@/utils';

/**
 * Bridge fee calculation formula
 * @param bridgeFee
 * @param price
 * @param decimals
 */
const calculateTokenBridgeFee = (
  bridgeFee: number,
  price: number,
  decimals: number,
) => (bridgeFee * price) / 10 ** decimals;

/**
 * Validate that bridge fee calculation by token results in the predefined
 * expected value
 * @param tokenId
 */
export const validateBridgeFeeByToken: Validate = async (tokenId) => {
  const feesByToken = await fetchFeesByToken();
  const tokenMap = await fetchTokenMap();
  const tokensConfig = await fetchTokensConfig();
  const prices = await fetchPrices();

  try {
    const fees = feesByToken[tokenId];
    const newFeeConfigs = fees.at(-1)!.configs;
    const bridgeFee = newFeeConfigs.ergo.bridgeFee; // pick bridge fee from any chain, they should be all the same

    const tokenConfig = tokensConfig.find(
      (token) => token.ergoSideTokenId === tokenId,
    );

    if (!tokenConfig) {
      throw new TokenConfigMissing();
    }

    const actual = calculateTokenBridgeFee(
      Number(bridgeFee),
      +prices[tokenConfig.tokenId],
      getTokenInfo(tokenMap, tokenId).significantDecimals,
    );

    const expected = tokenConfig.fee.bridgeFeeUSD;

    return validateActualAgainstExpected(actual, expected);
  } catch (error) {
    throw new BridgeFeeValidationByTokenError(error);
  }
};
