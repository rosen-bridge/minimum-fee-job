import type { RosenChainToken } from '@rosen-bridge/extended-tokens';

import type { TokenSet } from '@/types';

export const token = (
  overrides: Partial<RosenChainToken> = {},
): RosenChainToken => ({
  tokenId: 'token-id',
  name: 'name',
  decimals: 9,
  type: 'native',
  residency: 'native',
  extra: {},
  ...overrides,
});

/**
 * ergo-native set: `ergo:erg` is the identity.
 */
export const ergoSet: TokenSet = {
  ergo: token({ tokenId: 'erg', name: 'ERG' }),
};

/**
 * a wrapped set: `ethereum:0xeth` is the native token.
 */
export const ethSet: TokenSet = {
  ethereum: token({
    tokenId: '0xeth',
    name: 'ETH',
    residency: 'native',
  }),
  ergo: token({
    tokenId: 'wrapped-eth',
    name: 'rsETH',
    residency: 'wrapped',
    type: 'EIP-004',
  }),
};

/**
 * another wrapped set on binance.
 */
export const bscSet: TokenSet = {
  binance: token({
    tokenId: 'bnb',
    name: 'BNB',
    residency: 'native',
  }),
  ergo: token({
    tokenId: 'wrapped-bnb',
    name: 'rsBNB',
    residency: 'wrapped',
    type: 'EIP-004',
  }),
};
