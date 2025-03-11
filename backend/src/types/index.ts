import { MinimumFeeBox, MinimumFeeBoxBuilder } from '@rosen-bridge/minimum-fee';

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

export interface ErgTokenVolumes {
  erg: number;
  token: number;
}

export interface Registers {
  R4: Array<string>;
  R5: Array<Array<number>>;
  R6: Array<Array<string>>;
  R7: Array<Array<string>>;
  R8: Array<Array<Array<string>>>;
  R9: Array<Array<string>>;
}

export interface FeeDifferencePercents {
  bridgeFee: bigint;
  ergoNetworkFee: bigint | undefined;
  cardanoNetworkFee: bigint | undefined;
  bitcoinNetworkFee: bigint | undefined;
  ethereumNetworkFee: bigint | undefined;
  binanceNetworkFee: bigint | undefined;
  rsnRatio: bigint;
}

export interface UpdatedFeeConfig {
  current: MinimumFeeBox;
  new: MinimumFeeBoxBuilder;
}

export enum PriceBackends {
  CoinGecko = 'coingecko',
  CoinMarketCap = 'coinmarketcap',
  Spectrum = 'spectrum',
  DexHunter = 'dexhunter',
  Manual = 'manual',
  DuplicateToken = 'duplicate-token',
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

export interface DuplicateTokenParams {
  tokenId: string;
}

export interface SpectrumParams {}

export type PriceBackendParams =
  | CoinGeckoParams
  | CoinMarketCapParams
  | ManualParams
  | SpectrumParams
  | DuplicateTokenParams;

export interface HeightDelays {
  ergo: number;
  cardano: number;
  bitcoin: number;
  ethereum: number;
  binance: number;
}

export interface FeeParameters {
  delays: HeightDelays;
  bridgeFeeUSD: number;
  ergNetworkFee: number;
  adaNetworkFee: number;
  bitcoinConfirmation: number;
  feeRatioFloat: number;
  rsnRatioDivisor: number;
}

export interface SupportedTokenConfig {
  tokenId: string;
  ergoSideTokenId: string;
  name: string;
  decimals: number;
  priceBackend: string;
  priceBackendParams: PriceBackendParams;
  fee: FeeParameters;
}

export interface ConfigInterface {
  minimumFeeNFT: string;
  minimumFeeAddress: string;
  feeAddress: string;
  minBoxErg: bigint;
  txFee: bigint;
  supportedTokens: Array<SupportedTokenConfig>;
  fetchBoxRetry: number;
  rsnRatioPrecision: number;
  bitcoinTxVSize: number;
  ethereumTxFee: number;
  binanceTxFee: number;
}

interface CoinMarketCapPricePoolQuote {
  volume24h?: number;
  price: number;
}
export interface CoinMarketCapPricePool {
  quotes: Array<CoinMarketCapPricePoolQuote>;
}
