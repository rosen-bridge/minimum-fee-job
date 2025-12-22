import { every, map, mapValues, omitBy, uniq } from 'lodash-es';

import { ChainConfigsSamenessValidationError } from '@/error';
import { fetchFeesByToken } from '@/queries';
import { Validate } from '@/types';

/**
 * Validate that bridgeFee, feeRatio, rsnRatio, and rsnRatioDivisor is the same
 * in the new config for all chains
 * @param tokenId
 */
export const validateChainConfigsSameness: Validate = async (tokenId) => {
  try {
    const feesByToken = await fetchFeesByToken();

    const fees = feesByToken[tokenId];
    const newFeeConfigs = fees.at(-1)!.configs;

    const configs = {
      bridgeFees: map(newFeeConfigs, 'bridgeFee'),
      feeRatios: map(newFeeConfigs, 'feeRatio'),
      rsnRatios: map(newFeeConfigs, 'rsnRatio'),
      rsnRatioDivisors: map(newFeeConfigs, 'rsnRatioDivisor'),
    };

    const uniqConfigs = mapValues(configs, uniq);

    const isValid = every(uniqConfigs, ['length', 1]);

    return {
      isValid,
      reason: !isValid
        ? Object.entries(omitBy(uniqConfigs, ['length', 1]))
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')
        : null,
    };
  } catch (error) {
    throw new ChainConfigsSamenessValidationError(error);
  }
};
