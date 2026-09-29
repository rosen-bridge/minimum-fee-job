import { diff } from 'json-diff-ts';

import { ChangedTokenSet, TokenSet, TokenSetDiff } from '@/types';

/**
 * Stable identity for a token set.
 * Prefers the native token; falls back to the first chain in the set.
 */
const idOf = (set: TokenSet): string => {
  const native = Object.entries(set).find(([, t]) => t.residency === 'native');
  const [chain, token] = native ?? Object.entries(set)[0];
  return `${chain}:${token.tokenId}`;
};

/**
 * Compares two arrays of token sets and classifies each set as
 * removed, added, changed, or unchanged.
 */
export const compareTokenSets = (
  oldSets: TokenSet[],
  newSets: TokenSet[],
): TokenSetDiff => {
  const oldMap = new Map(oldSets.map((s) => [idOf(s), s]));
  const newMap = new Map(newSets.map((s) => [idOf(s), s]));

  const removed = [...oldMap]
    .filter(([id]) => !newMap.has(id))
    .map(([, s]) => s);

  const added = [...newMap].filter(([id]) => !oldMap.has(id)).map(([, s]) => s);

  const changed: ChangedTokenSet[] = [];
  const unchanged: TokenSet[] = [];

  for (const [id, oldSet] of oldMap) {
    const newSet = newMap.get(id);
    if (!newSet) continue;

    const diffs = diff(oldSet, newSet);
    if (diffs.length > 0) {
      changed.push({ id, oldSet, newSet, diffs });
    } else {
      unchanged.push(oldSet);
    }
  }

  return { removed, added, changed, unchanged };
};
