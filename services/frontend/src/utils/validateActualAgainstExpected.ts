import { VALID_ERROR_PERCENT_THRESHOLD } from '@/constants';
import { ValidationResultOk } from '@/types';

import { calculateErrorPercent } from './calculateErrorPercent';
import { generateValidationResultText } from './generateValidationResultText';

/**
 * Validate actual against expected, returning a validation result Ok value
 * @param actual
 * @param expected
 */
export const validateActualAgainstExpected = (
  actual: number,
  expected: number,
): ValidationResultOk => {
  const errorPercent = calculateErrorPercent(actual, expected);
  const isValid = errorPercent < VALID_ERROR_PERCENT_THRESHOLD;

  return {
    isValid,
    reason: generateValidationResultText(actual, expected),
  };
};
