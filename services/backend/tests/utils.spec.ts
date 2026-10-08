import { describe, expect, it, vi } from 'vitest';

import { Fee } from '@rosen-bridge/minimum-fee';

import { Direction } from '../src/types';
import { getConfigDifferencePercent } from '../src/utils/utils';

vi.mock('../src/tokenMap/tokenHandler', () => ({
  TokenHandler: {
    getInstance: () => ({
      getSupportedTokens: () => [],
    }),
  },
}));

const feeConfig = (rsnRatio: bigint, rsnRatioDivisor: bigint): Fee => ({
  heights: { ergo: 1000 },
  configs: {
    ergo: {
      bridgeFee: 100n,
      networkFee: 100n,
      rsnRatio,
      rsnRatioDivisor,
      feeRatio: 10n,
    },
  },
});

const rsnRatioDifference = (current: Fee, updated: Fee) =>
  getConfigDifferencePercent(current, updated).rsnRatio;

describe('getConfigDifferencePercent rsn ratio', () => {
  /**
   * the new divisor is recomputed from the ratio's magnitude, so it grows
   * whenever the ratio drops past a power-of-ten boundary; scaling only the
   * new ratio by `currentDivisor / newDivisor` made that quotient 0n and
   * reported a spurious 100% drop for a tiny real change
   */
  it('should report the real change when the new divisor is larger (9.51 to 9.49)', () => {
    const difference = rsnRatioDifference(
      feeConfig(95100n, 10000n),
      feeConfig(949000n, 100000n),
    );
    expect(difference.value).toEqual(0n);
    expect(difference.direction).toEqual(Direction.NONE);
  });

  it('should report a 50% drop when the new divisor is larger (2 to 1)', () => {
    const difference = rsnRatioDifference(
      feeConfig(20000n, 10000n),
      feeConfig(100000n, 100000n),
    );
    expect(difference.value).toEqual(50n);
    expect(difference.direction).toEqual(Direction.DOWN);
  });

  it('should report no change for equal ratios expressed with different divisors', () => {
    const difference = rsnRatioDifference(
      feeConfig(50000n, 10000n),
      feeConfig(500000n, 100000n),
    );
    expect(difference.value).toEqual(0n);
    expect(difference.direction).toEqual(Direction.NONE);
  });

  /**
   * ratios compared with a smaller new divisor already worked and must
   * keep their exact result
   */
  it('should report a 100% rise when the new divisor is smaller (1 to 2)', () => {
    const difference = rsnRatioDifference(
      feeConfig(100000n, 100000n),
      feeConfig(20000n, 10000n),
    );
    expect(difference.value).toEqual(100n);
    expect(difference.direction).toEqual(Direction.UP);
  });

  it('should report a 200% rise when the new divisor is smaller (1 to 3)', () => {
    const difference = rsnRatioDifference(
      feeConfig(100000n, 100000n),
      feeConfig(30000n, 10000n),
    );
    expect(difference.value).toEqual(200n);
    expect(difference.direction).toEqual(Direction.UP);
  });

  /**
   * equal divisors must behave exactly as before
   */
  it('should report no change for identical ratios with equal divisors', () => {
    const difference = rsnRatioDifference(
      feeConfig(12345n, 10000n),
      feeConfig(12345n, 10000n),
    );
    expect(difference.value).toEqual(0n);
    expect(difference.direction).toEqual(Direction.NONE);
  });

  it('should report a 100% rise for a doubled ratio with equal divisors', () => {
    const difference = rsnRatioDifference(
      feeConfig(12345n, 10000n),
      feeConfig(24690n, 10000n),
    );
    expect(difference.value).toEqual(100n);
    expect(difference.direction).toEqual(Direction.UP);
  });
});
