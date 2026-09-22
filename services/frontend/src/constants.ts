export const QR_TYPE = 'CSR';
export const MAX_CHUNK_SIZE = 2800;
export const MIN_CHUNK_SIZE = 200;
export const ERGO_EXPLORER_API_URL = 'https://api.ergoplatform.com';
export const VALID_ERROR_PERCENT_THRESHOLD = 1;
export const CONTRACT_NETWORKS = ['pandora', 'public-launch'] as const;
export const CONTRACT_REPO = 'rosen-bridge/contract';
export const GITHUB_API_URL = 'https://api.github.com';
export const ERGO_CHAIN = 'ergo';
export const CHAIN = {
  'binance': { key: 'binance', label: 'Binance' },
  'bitcoin': { key: 'bitcoin', label: 'Bitcoin' },
  'bitcoin-runes': { key: 'bitcoin-runes', label: 'Bitcoin Runes' },
  'cardano': { key: 'cardano', label: 'Cardano' },
  'ergo': { key: 'ergo', label: 'Ergo' },
  'ethereum': { key: 'ethereum', label: 'Ethereum' },
  'doge': { key: 'doge', label: 'Doge' },
  'firo': { key: 'firo', label: 'Firo' },
} as const;
export type CHAIN_KEY = keyof typeof CHAIN;

export const BOX_FETCHING_PAGE_SIZE = 50;
