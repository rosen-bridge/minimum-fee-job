import { createClient } from "@vercel/kv";
import { Err, Ok, Result } from "ts-results-es";

import {
  BackendConfigParseError,
  EmptyBackendConfigError,
  EmptyTxError,
  RedisConnectionError,
  RedisDataFetchingError,
} from "@/app/_error/store";

import { PartialSupportedTokenConfig } from "../_types/token-config";

/**
 * connect to the redis client
 */
const connectRedisClient = async () => {
  try {
    const client = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    return Ok(client);
  } catch (error) {
    return Err(new RedisConnectionError(error));
  }
};

/**
 * get backend tokens config from the store
 */
export const getTokensConfig = async (): Promise<
  Result<
    PartialSupportedTokenConfig[],
    | RedisDataFetchingError
    | RedisConnectionError
    | BackendConfigParseError
    | EmptyBackendConfigError
  >
> => {
  const clientResult = await connectRedisClient();

  if (clientResult.isErr()) {
    return clientResult;
  }

  const client = clientResult.value;

  try {
    const config = await client.get<PartialSupportedTokenConfig[]>(
      "tokens-config"
    );
    if (config) {
      try {
        return Ok(config);
      } catch {
        return Err(new BackendConfigParseError());
      }
    } else {
      return Err(new EmptyBackendConfigError());
    }
  } catch (error) {
    return Err(new RedisDataFetchingError(error));
  }
};

/**
 * get price data from the store
 */
export const getPrices = async (): Promise<
  Result<Record<string, string>, RedisDataFetchingError | RedisConnectionError>
> => {
  const clientResult = await connectRedisClient();

  if (clientResult.isErr()) {
    return clientResult;
  }

  const client = clientResult.value;

  try {
    const prices = await client.hgetall<Record<string, string>>("prices");
    return Ok(prices ?? {});
  } catch (error) {
    return Err(new RedisDataFetchingError(error));
  }
};

/**
 * get tx data from the store
 */
export const getTx = async (): Promise<
  Result<string, RedisDataFetchingError | RedisConnectionError | EmptyTxError>
> => {
  const clientResult = await connectRedisClient();

  if (clientResult.isErr()) {
    return clientResult;
  }

  const client = clientResult.value;

  try {
    const tx = await client.get<Record<string, string>>("tx");

    if (!tx) {
      return Err(new EmptyTxError());
    }
    return Ok(JSON.stringify(tx));
  } catch (error) {
    return Err(new RedisDataFetchingError(error));
  }
};
