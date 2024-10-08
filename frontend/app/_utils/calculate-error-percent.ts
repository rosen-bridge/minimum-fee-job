/**
 * Calculate error percent for two actual and expected values
 * @param actual
 * @param expected
 */
const calculateErrorPercent = (actual: number, expected: number) =>
  (Math.abs(actual - expected) / expected) * 100;

export default calculateErrorPercent;
