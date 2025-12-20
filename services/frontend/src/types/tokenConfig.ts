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
