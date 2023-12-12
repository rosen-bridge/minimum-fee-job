export interface TokenConfig {
  tokenId: string;
  name: string;
  priceBackend: string;
  priceUrl: string;
}

export interface Price {
  price: number;
  volume: number;
}

export interface Fee {
  bridgeFee: bigint;
  networkFee: bigint;
  rsnRatio: bigint;
  feeRatio: bigint;
}

export interface ChainFee {
  [height: string]: Fee;
}

export interface FeeConfig {
  [chain: string]: ChainFee;
}

export interface Registers {
  R4: Array<string>;
  R5: Array<Array<number>>;
  R6: Array<Array<bigint>>;
  R7: Array<Array<bigint>>;
  R8: Array<Array<bigint>>;
  R9: Array<Array<bigint>>;
}

export enum PriceBackends {
  CoinGecko = 'coingecko',
  CoinMarketCap = 'coinmarketcap',
  Spectrum = 'spectrum',
  Manual = 'manual',
}

export interface CoinGeckoParams {
  network: string;
}

export interface CoinMarketCapParams {
  slug: string;
}

export interface ManualParams {
  price: number;
}

export interface SpectrumParams {}

export type PriceBackendParams =
  | CoinGeckoParams
  | CoinMarketCapParams
  | ManualParams
  | SpectrumParams;

export interface SupportedTokenConfig {
  tokenId: string;
  ergoSideTokenId: string;
  name: string;
  decimals: number;
  priceBackend: string;
  priceBackendParams: PriceBackendParams;
  fee: {
    ergoHeightDelay: number;
    cardanoHeightDelay: number;
    bridgeFeeUSD: number;
    ergNetworkFee: number;
    adaNetworkFee: number;
    feeRatioFloat: number;
  };
}

export interface ConfigInterface {
  minimumFeeNFT: string;
  minimumFeeAddress: string;
  feeAddress: string;
  minBoxErg: bigint;
  txFee: bigint;
  supportedTokens: Array<SupportedTokenConfig>;
}

interface CoinMarketCapPricePoolQuote {
  volume24h?: number;
  price: number;
}
export interface CoinMarketCapPricePool {
  quotes: Array<CoinMarketCapPricePoolQuote>;
}

export interface SpectrumPool {
  baseId: string;
  quoteId: string;
  lastPrice: number;
  quoteVolume: {
    value: number;
  };
  baseVolume: {
    value: number;
  };
}
