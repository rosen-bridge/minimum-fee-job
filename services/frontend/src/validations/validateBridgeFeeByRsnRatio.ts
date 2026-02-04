import {
  BridgeFeeValidationByRsnRatioError,
  RsnConfigMissing,
  TokenConfigMissing,
} from '@/error';
import { fetchFeesByToken, fetchPrices, fetchTokensConfig } from '@/queries';
import { Validate } from '@/types';
import { validateActualAgainstExpected } from '@/utils';

import { fetchRsnTokenId } from '../queries/rsnTokenId';

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
  rsnRatioDivisor: number,
) => (bridgeFee * rsnRatio * rsnPrice) / (10 ** 3 * rsnRatioDivisor);

/**
 * Validate that bridge fee calculation by rsn ratio results in the predefined
 * expected value
 * @param tokenId
 */
export const validateBridgeFeeByRsnRatio: Validate = async (tokenId) => {
  const feesByToken = await fetchFeesByToken();
  const tokensConfig = await fetchTokensConfig();
  const prices = await fetchPrices();
  const rsnTokenId = await fetchRsnTokenId();

  try {
    const fees = feesByToken[tokenId];
    const newFeeConfigs = fees.at(-1)!.configs;
    const bridgeFee = newFeeConfigs.ergo.bridgeFee; // pick bridge fee from any chain, they should be all the same
    const rsnRatio = newFeeConfigs.ergo.rsnRatio; // pick rsn ratio from any chain, they should be all the same
    const rsnRatioDivisor = newFeeConfigs.ergo.rsnRatioDivisor; // pick rsn ratio divisor from any chain, they should be all the same

    const tokenConfig = tokensConfig.find(
      (token) => token.ergoSideTokenId === tokenId,
    );
    if (!tokenConfig) {
      throw new TokenConfigMissing();
    }

    const rsnConfig = tokensConfig.find(
      (token) => token.tokenId === rsnTokenId,
    );
    if (!rsnConfig) {
      throw new RsnConfigMissing();
    }

    const actual = calculateTokenRsnRatio(
      Number(bridgeFee),
      Number(rsnRatio),
      +prices[rsnConfig?.tokenId],
      Number(rsnRatioDivisor),
    );
    const expected = tokenConfig.fee.bridgeFeeUSD;

    return validateActualAgainstExpected(actual, expected);
  } catch (error) {
    throw new BridgeFeeValidationByRsnRatioError(error);
  }
};
