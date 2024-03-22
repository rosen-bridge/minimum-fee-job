import { createClient } from "redis";

/**
 * connect to the redis client
 */
const connectRedisClient = async () => {
  const client = createClient({
    url: process.env.REDIS_URL,
  });
  await client.connect();

  return client;
};

/**
 * get price data from the store
 */
export const getPrices = async () => {
  const client = await connectRedisClient();
  return await client.hGetAll("prices");
};

/**
 * get tx data from the store
 */
export const getTx = async () => {
  const client = await connectRedisClient();
  return await client.get("tx");
};
