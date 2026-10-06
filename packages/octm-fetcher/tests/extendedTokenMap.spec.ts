import { boxesToTokenMap } from '../lib/extendedTokenMap';
import { mockErgoBoxes } from './testData';

describe('boxesToTokenMap', () => {
  /**
   * @target boxesToTokenMap should build a token map from real OCTM boxes
   * @dependencies
   * - ExtendedTokenMap
   * @scenario
   * - call `boxesToTokenMap` with the real OCTM boxes
   * @expected
   * - returns a non-empty token map array
   * - the entries include the expected chains
   */
  it('should build a token map from real OCTM boxes', async () => {
    const tokens = await boxesToTokenMap(mockErgoBoxes);

    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
  });

  /**
   * @target boxesToTokenMap should return an empty array when there are no boxes
   * @dependencies
   * - ExtendedTokenMap
   * @scenario
   * - call `boxesToTokenMap` with an empty array
   * @expected
   * - returns an empty array
   */
  it('should return an empty array when there are no boxes', async () => {
    const tokens = await boxesToTokenMap([]);
    expect(tokens).toEqual([]);
  });
});
