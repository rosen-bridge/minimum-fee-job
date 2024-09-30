import { createClient } from "redis";
import { Err, Ok, Result } from "ts-results-es";

import { EmptyBackendConfigError, EmptyTxError, RedisConnectionError, RedisDataFetchingError, BackendConfigParseError } from '@/app/_error/store';

import { PartialSupportedTokenConfig } from "../_types/token-config";

/**
 * connect to the redis client
 */
const connectRedisClient = async () => {
  try {
    const client = createClient({
      url: process.env.REDIS_URL,
    });
    await client.connect();
    return Ok(Object.assign(client, {
      [Symbol.asyncDispose]: client.disconnect,
    }));
  } catch (error) {
    return Err(new RedisConnectionError(error));
  }
};

/**
 * get backend tokens config from the store
 */
export const getTokensConfig = async (): Promise<Result<PartialSupportedTokenConfig[], RedisDataFetchingError | RedisConnectionError | BackendConfigParseError | EmptyBackendConfigError>> => {
  const clientResult = await connectRedisClient();

  if (clientResult.isErr()) {
    return clientResult;
  }

  await using client = clientResult.value;

  try {
    const config = await client.get("tokens-config");
    if (config) {
      try {
        return Ok(JSON.parse(config));
      } catch {
        return Err(new BackendConfigParseError());
      }
    } else {
      return Err(new EmptyBackendConfigError())
    }
  } catch (error) {
    return Err(new RedisDataFetchingError(error));
  }
};

/**
 * get price data from the store
 */
export const getPrices = async (): Promise<Result<Record<string, string>, RedisDataFetchingError | RedisConnectionError>> => {
  const clientResult = await connectRedisClient();

  if (clientResult.isErr()) {
    return clientResult;
  }

  await using client = clientResult.value;

  try {
    const prices = await client.hGetAll("prices");
    return Ok(prices);
  } catch (error) {
    return Err(new RedisDataFetchingError(error))
  }
};

/**
 * get tx data from the store
 */
export const getTx = async (): Promise<Result<string, RedisDataFetchingError | RedisConnectionError | EmptyTxError>> => {
  const clientResult = await connectRedisClient();

  if (clientResult.isErr()) {
    return clientResult;
  }

  await using client = clientResult.value;

  try {
    const tx = await client.get("tx");

    if (!tx) {
      return Err(new EmptyTxError());
    }
    return Ok(tx);
  } catch (error) {
    return Err(new RedisDataFetchingError(error))
  }
};
