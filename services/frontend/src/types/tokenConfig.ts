import { CHAIN_KEY } from '@/constants';

/**
 * Partial version of SupportedTokenConfig from backend service, suitable for
 * frontend needs
 */
export interface PartialSupportedTokenConfig {
  tokenId: string;
  ergoSideTokenId: string;
  name: string;
  decimals: number;
  fee: {
    bridgeFeeUSD: number;
    ergNetworkFee: number;
    adaNetworkFee: number;
    feeRatioFloat: number;
    rsnRatioDivisor: number;
  };
}

export type Residency = 'native' | 'wrapped';

export type RosenToken = {
  chain: CHAIN_KEY;
  tokenId: string;
  name: string;
  decimals: number;
  type: string;
  residency: Residency;
  extra: Record<string, string | number | boolean>;
};
export type TokenSet = RosenToken[];
export type TokenMap = TokenSet[];

export type IdentifiableRosenToken = RosenToken & {
  ergoTokenId: string;
};

export interface TokenMapFile {
  version: string;
  tokens: TokenMap;
}
