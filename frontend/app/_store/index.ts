import { unstable_cache as cache } from "next/cache";
import { createClient } from "redis";

import { RedisConnectionError, RedisDataFetchingError } from "../_error/store";

/**
 * connect to the redis client
 */
const connectRedisClient = async () => {
  try {
    const client = createClient({
      url: process.env.REDIS_URL,
    });
    await client.connect();

    return Object.assign(client, {
      [Symbol.asyncDispose]: client.disconnect
    }) satisfies AsyncDisposable;
  } catch (error) {
    throw new RedisConnectionError(error);
  }
};

/**
 * get price data from the store
 */
export const getPrices = cache(async () => {
  await using client = await connectRedisClient();

  return await client.hGetAll("prices").catch((error) => {
    throw new RedisDataFetchingError(error)
  });
}, ["prices"], { revalidate: +process.env.CACHE_REVALIDATION_SECONDS!, tags: ['prices'] });

/**
 * get tx data from the store
 */
export const getTx = cache(async () => {
  await using client = await connectRedisClient();

  return await client.get("tx").catch((error) => {
    throw new RedisDataFetchingError(error)
  });
}, ["tx"], { revalidate: +process.env.CACHE_REVALIDATION_SECONDS!, tags: ['tx'] });
