import { createClient } from 'redis';
import { redisUrl } from './configs';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const client = createClient({
  url: redisUrl,
});
if (redisUrl) await client.connect();
else logger.warn(`Skipping redis connection: no url is specified`);

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

export { flushStore, savePrices, saveTx };
