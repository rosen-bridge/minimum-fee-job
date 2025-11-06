import { ValidationResultOk } from '../_validations/types';
import { VALID_ERROR_PERCENT_THRESHOLD } from '../constants';
import calculateErrorPercent from './calculate-error-percent';
import generateValidationResultText from './generate-validation-result-text';

/**
 * Validate actual against expected, returning a validation result Ok value
 * @param actual
 * @param expected
 */
const validateActualAgainstExpected = (
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

export default validateActualAgainstExpected;
