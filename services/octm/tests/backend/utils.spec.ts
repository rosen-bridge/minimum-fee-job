import { describe, expect, it } from 'vitest';

import { compareTokenSets } from '@/backend';
import type { TokenSet } from '@/types';

import { bscSet, ergoSet, ethSet, token } from './testData';

describe('compareTokenSets', () => {
  describe('identity', () => {
    /**
     * @target compareTokenSets should treat a set as unchanged when its native token matches
     * @dependencies
     * @scenario
     * - pass the same ethSet twice
     * @expected
     * - unchanged contains the set
     * - added, removed, and changed are empty
     */
    it('should treat identical sets as unchanged', () => {
      const result = compareTokenSets([ethSet], [ethSet]);

      expect(result.unchanged).toEqual([ethSet]);
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
      expect(result.changed).toEqual([]);
    });

    /**
     * @target compareTokenSets should identify sets by native token
     * @dependencies
     * @scenario
     * - old has ethSet with native ethereum token 0xeth
     * - new has the same native token but a changed extra field
     * @expected
     * - the set is classified as changed, not added+removed
     */
    it('should identify sets by their native token', () => {
      const updated: TokenSet = {
        ...ethSet,
        ergo: { ...ethSet.ergo, name: 'rsETH-v2' },
      };

      const result = compareTokenSets([ethSet], [updated]);

      expect(result.changed).toHaveLength(1);
      expect(result.changed[0].id).toBe('ethereum:0xeth');
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
    });
  });

  describe('removed', () => {
    /**
     * @target compareTokenSets should list a set as removed when it is only in old
     * @dependencies
     * @scenario
     * - old has ethSet and bscSet
     * - new has ethSet only
     * @expected
     * - removed contains bscSet
     */
    it('should list sets only in old as removed', () => {
      const result = compareTokenSets([ethSet, bscSet], [ethSet]);

      expect(result.removed).toEqual([bscSet]);
      expect(result.added).toEqual([]);
      expect(result.unchanged).toEqual([ethSet]);
      expect(result.changed).toEqual([]);
    });
  });

  describe('added', () => {
    /**
     * @target compareTokenSets should list a set as added when it is only in new
     * @dependencies
     * @scenario
     * - old has ethSet
     * - new has ethSet and bscSet
     * @expected
     * - added contains bscSet
     */
    it('should list sets only in new as added', () => {
      const result = compareTokenSets([ethSet], [ethSet, bscSet]);

      expect(result.added).toEqual([bscSet]);
      expect(result.removed).toEqual([]);
      expect(result.unchanged).toEqual([ethSet]);
      expect(result.changed).toEqual([]);
    });
  });

  describe('changed', () => {
    /**
     * @target compareTokenSets should populate `diffs` for changed sets
     * @dependencies
     * - json-diff-ts
     * @scenario
     * - old has ergoSet with name ERG
     * - new has ergoSet with name ERG-v2
     * @expected
     * - changed contains a single entry with id "ergo:erg" and a non-empty diffs array
     */
    it('should populate diffs for changed sets', () => {
      const updatedErgo: TokenSet = {
        ergo: { ...ergoSet.ergo, name: 'ERG-v2' },
      };

      const result = compareTokenSets([ergoSet], [updatedErgo]);

      expect(result.changed).toHaveLength(1);
      const change = result.changed[0];
      expect(change.id).toBe('ergo:erg');
      expect(change.oldSet).toEqual(ergoSet);
      expect(change.newSet).toEqual(updatedErgo);
      expect(change.diffs.length).toBeGreaterThan(0);
    });

    /**
     * @target compareTokenSets should include each changed set only once
     * @dependencies
     * - json-diff-ts
     * @scenario
     * - old has ergoSet
     * - new has ergoSet with a changed decimals field
     * @expected
     * - exactly one entry in changed
     */
    it('should include each changed set only once', () => {
      const updated: TokenSet = {
        ergo: { ...ergoSet.ergo, decimals: 8 },
      };

      const result = compareTokenSets([ergoSet], [updated]);

      expect(result.changed).toHaveLength(1);
    });
  });

  describe('mixed', () => {
    /**
     * @target compareTokenSets should classify a mixed input correctly
     * @dependencies
     * - json-diff-ts
     * @scenario
     * - old = [ergoSet, ethSet, bscSet]
     * - new = [ergoSet (unchanged), ethSet with a modified name (changed), newSet (added)]
     * @expected
     * - unchanged = [ergoSet]
     * - changed contains ethSet with id "ethereum:0xeth"
     * - removed contains bscSet
     * - added contains newSet
     */
    it('should classify a mixed input correctly', () => {
      const changedEth: TokenSet = {
        ...ethSet,
        ergo: { ...ethSet.ergo, name: 'rsETH-v2' },
      };
      const newSet: TokenSet = {
        bitcoin: token({ tokenId: 'btc', name: 'BTC', residency: 'native' }),
        ergo: token({
          tokenId: 'wrapped-btc',
          name: 'rsBTC',
          residency: 'wrapped',
          type: 'EIP-004',
        }),
      };

      const result = compareTokenSets(
        [ergoSet, ethSet, bscSet],
        [ergoSet, changedEth, newSet],
      );

      expect(result.unchanged).toEqual([ergoSet]);
      expect(result.changed).toHaveLength(1);
      expect(result.changed[0].id).toBe('ethereum:0xeth');
      expect(result.removed).toEqual([bscSet]);
      expect(result.added).toEqual([newSet]);
    });
  });

  describe('empty inputs', () => {
    /**
     * @target compareTokenSets should handle two empty arrays
     * @dependencies
     * @scenario
     * - pass two empty arrays
     * @expected
     * - all four buckets are empty
     */
    it('should return empty buckets when both inputs are empty', () => {
      const result = compareTokenSets([], []);

      expect(result).toEqual({
        removed: [],
        added: [],
        changed: [],
        unchanged: [],
      });
    });

    /**
     * @target compareTokenSets should list everything as added when old is empty
     * @dependencies
     * @scenario
     * - old is empty, new has one set
     * @expected
     * - added contains the set, everything else empty
     */
    it('should list everything as added when old is empty', () => {
      const result = compareTokenSets([], [ergoSet]);

      expect(result.added).toEqual([ergoSet]);
      expect(result.removed).toEqual([]);
      expect(result.changed).toEqual([]);
      expect(result.unchanged).toEqual([]);
    });

    /**
     * @target compareTokenSets should list everything as removed when new is empty
     * @dependencies
     * @scenario
     * - old has one set, new is empty
     * @expected
     * - removed contains the set, everything else empty
     */
    it('should list everything as removed when new is empty', () => {
      const result = compareTokenSets([ergoSet], []);

      expect(result.removed).toEqual([ergoSet]);
      expect(result.added).toEqual([]);
      expect(result.changed).toEqual([]);
      expect(result.unchanged).toEqual([]);
    });
  });
});
