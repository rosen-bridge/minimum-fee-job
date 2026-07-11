import { MinimumFeeBox, MinimumFeeBoxBuilder } from '@rosen-bridge/minimum-fee';

export enum Chains {
  ERGO = 'ergo',
  CARDANO = 'cardano',
  BITCOIN = 'bitcoin',
  ETHEREUM = 'ethereum',
  BINANCE = 'binance',
  DOGE = 'doge',
  BITCOIN_RUNES = 'bitcoin-runes',
  FIRO = 'firo',
}
export const SUPPORTED_CHAINS = Object.values(Chains);

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

export enum Direction {
  UP = '↑',
  DOWN = '↓',
  NONE = '•',
}

export interface DifferencePercent {
  value: bigint;
  direction: Direction;
}

export interface FeeDifferencePercents {
  bridgeFee: DifferencePercent;
  networkFee: Record<Chains, DifferencePercent | undefined>;
  rsnRatio: DifferencePercent;
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
  Minswap = 'minswap',
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

/**
 * TODO: fix lint error (an empty interface declaration)
 * local:ergo/rosen-bridge/minimum-fee-job#36
 */
// eslint-disable-next-line
export interface MinswapParams {}

/**
 * TODO: fix lint error (an empty interface declaration)
 * local:ergo/rosen-bridge/minimum-fee-job#36
 */
// eslint-disable-next-line
export interface SpectrumParams {}

export type PriceBackendParams =
  | CoinGeckoParams
  | CoinMarketCapParams
  | ManualParams
  | SpectrumParams
  | DuplicateTokenParams
  | MinswapParams;

export interface HeightDelays {
  ergo: number;
  cardano: number;
  bitcoin: number;
  ethereum: number;
  binance: number;
  doge: number;
  firo: number;
}

export interface FeeParameters {
  delays: HeightDelays;
  bridgeFeeUSD: number;
  ergNetworkFee: number;
  adaNetworkFee: number;
  bitcoinConfirmation: number;
  dogeConfirmation: number;
  feeRatioFloat: number;
  rsnRatioDivisor: number;
}

export interface SupportedTokenRawConfig {
  tokenId: string;
  priceBackend: string;
  priceBackendParams: PriceBackendParams;
  fee: FeeParameters;
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
  RSNTokenId: string;
  minimumFeeNFT: string;
  minimumFeeAddress: string;
  feeAddress: string;
  minBoxErg: bigint;
  txFee: bigint;
  supportedTokens: Array<SupportedTokenRawConfig>;
  fetchBoxRetry: number;
  rsnRatioPrecision: number;
  bitcoinTxVSize: number;
  bitcoinMinUtxo: number;
  dogeTxSize: number;
  firoTxSize: number;
  bitcoinRunesTxVSize: number;
  dogeMinUtxo: number;
  firoMinUtxo: number;
  ethereumAvgGasPricePeriod: number;
  ethereumNetworkFeeMultiplier: number;
  binanceTxFee: number;
}

interface CoinMarketCapPricePoolQuote {
  volume24h?: number;
  price: number;
}
export interface CoinMarketCapPricePool {
  quotes: Array<CoinMarketCapPricePoolQuote>;
}

export enum AnsiColor {
  RED = '31',
  GREEN = '32',
  YELLOW = '33',
  BLUE = '34',
  RESET = '0',
  NONE = '-1',
}

export interface TableRecord {
  value: string;
  color: AnsiColor;
  asciiLen?: number;
}
export type TableRow = TableRecord[];
export type TableData = TableRow[];

export enum DiscordPayloadType {
  MESSAGE = 'message',
  FILE = 'file',
}

export interface PriceFetchResult {
  prices: Map<string, number>;
  fetched: boolean;
  errors: Map<string, string>;
}

export interface EvmJsonRpcFeeHistoryResponse {
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  baseFeePerBlobGas: string[];
  blobGasUsedRatio: number[];
  oldestBlock: string;
}
