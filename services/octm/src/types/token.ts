import type { IChange } from 'json-diff-ts';

import type { RosenChainToken } from '@rosen-bridge/extended-tokens';

export type TokenSet = Record<string, RosenChainToken>;

export type ChangedTokenSet = {
  id: string;
  oldSet: TokenSet;
  newSet: TokenSet;
  diffs: IChange[];
};

export type TokenSetDiff = {
  removed: TokenSet[];
  added: TokenSet[];
  changed: ChangedTokenSet[];
  unchanged: TokenSet[];
};
