import { createClient } from 'redis';
import { redisUrl } from './configs';

const client = createClient({
  url: redisUrl,
});
await client.connect();

/**
 * save price data into store
 */
const savePrices = async (prices: Map<string, number>) => {
  return void client.hSet('prices', prices);
};

/**
 * save tx chunks data into store
 */
const saveTx = async (chunks: string[]) => {
  return void client.hSet('tx.chunks', chunks);
};

/**
 * flush store, removing price and tx chunks data
 */
const flushStore = async () => {
  return void client.flushDb();
};

export { flushStore, savePrices, saveTx };
