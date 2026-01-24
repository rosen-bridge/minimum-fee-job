import { calculateErrorPercent } from './calculateErrorPercent';

/**
 * Generate tooltip text based on actual and expected values
 * @param actual
 * @param expected
 */
export const generateValidationResultText = (
  actual: number,
  expected: number,
) =>
  `actual: ${actual}\nexpected: ${expected}\nerror: ~${+calculateErrorPercent(
    actual,
    expected,
  ).toFixed(2)}%`;
