import { AppError } from "./app";

export class RedisConnectionError extends AppError {
  constructor(cause: ErrorOptions["cause"]) {
    super("Cannot connect to Redis server", { cause });
  }
}

export class RedisDataFetchingError extends AppError {
  constructor(cause: ErrorOptions["cause"]) {
    super("Cannot fetch data from Redis server", { cause });
  }
}
