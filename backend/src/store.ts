import { createClient } from 'redis';
import { redisUrl } from './configs';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { SupportedTokenConfig } from './types';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const client = createClient({
  url: redisUrl,
});
if (redisUrl) await client.connect();
else logger.warn(`Skipping redis connection: no url is specified`);

/**
 * save tokens config into store
 */
const saveTokensConfig = async (config: SupportedTokenConfig[]) => {
  return void (await client.set('tokens-config', JSON.stringify(config)));
};

/**
 * save price data into store
 */
const savePrices = async (prices: Map<string, number>) => {
  return void (await client.hSet('prices', prices));
};

/**
 * save tx chunks data into store
 */
const saveTx = async (tx: string) => {
  return void (await client.set('tx', tx));
};

/**
 * flush store, removing price and tx chunks data
 */
const flushStore = async () => {
  return void (await client.flushDb());
};

export { flushStore, saveTokensConfig, savePrices, saveTx };
