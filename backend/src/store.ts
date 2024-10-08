import { createClient } from '@vercel/kv';

import { kvRestApiUrl, kvRestApiToken } from './configs';

import { SupportedTokenConfig } from './types';

const kv =
  kvRestApiUrl && kvRestApiToken
    ? createClient({
        url: kvRestApiUrl,
        token: kvRestApiToken,
      })
    : null;

/**
 * save tokens config into store
 */
const saveTokensConfig = async (config: SupportedTokenConfig[]) => {
  return void (await kv?.set('tokens-config', JSON.stringify(config)));
};

/**
 * save price data into store
 */
const savePrices = async (prices: Map<string, number>) => {
  return void (await kv?.hset('prices', Object.fromEntries(prices)));
};

/**
 * save tx chunks data into store
 */
const saveTx = async (tx: string) => {
  return void (await kv?.set('tx', tx));
};

/**
 * flush store, removing price and tx chunks data
 */
const flushStore = async () => {
  return void (await kv?.flushdb());
};

export { flushStore, saveTokensConfig, savePrices, saveTx };
