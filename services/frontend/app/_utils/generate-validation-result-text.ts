import calculateErrorPercent from "./calculate-error-percent";

/**
 * Generate tooltip text based on actual and expected values
 * @param actual
 * @param expected
 */
const generateValidationResultText = (actual: number, expected: number) =>
  `actual: ${actual}\nexpected: ${expected}\nerror: ~${+calculateErrorPercent(
    actual,
    expected
  ).toFixed(2)}%`;

export default generateValidationResultText;
