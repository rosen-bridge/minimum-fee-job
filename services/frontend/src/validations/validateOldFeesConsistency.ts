import { differenceWith, initial, isEqual } from 'lodash-es';

import JsonBigInt from '@rosen-bridge/json-bigint';

import { OldFeesConsistencyValidationError } from '@/error';
import { fetchFeesByToken, fetchTokenMinimumFeeBox } from '@/queries';
import { Validate } from '@/types';

/**
 * Validate that all of old fees in the minimum fee update transaction exist in
 * the box on the blockchain
 * @param tokenId
 */
export const validateOldFeesConsistency: Validate = async (tokenId) => {
  try {
    const feesByToken = await fetchFeesByToken();

    const currentFees = await fetchTokenMinimumFeeBox(tokenId);

    const nextFees = feesByToken[tokenId];

    const unexpectedFees = differenceWith(
      initial(nextFees),
      currentFees,
      isEqual,
    );

    return {
      isValid: unexpectedFees.length === 0,
      reason:
        unexpectedFees.length !== 0
          ? `Unexpected fees:\n${JsonBigInt.stringify(unexpectedFees)}`
          : null,
    };
  } catch (error) {
    throw new OldFeesConsistencyValidationError(error);
  }
};
