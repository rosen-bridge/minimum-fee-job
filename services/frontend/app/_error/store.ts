import { AppError, AppErrorWithCause } from "./app";

export class RedisConnectionError extends AppErrorWithCause {
  constructor(cause: ErrorOptions["cause"]) {
    super("Connection to Redis server failed", cause);
  }
}

export class RedisDataFetchingError extends AppErrorWithCause {
  constructor(cause: ErrorOptions["cause"]) {
    super("Fetching data from Redis server failed", cause);
  }
}

export class BackendConfigParseError extends AppError {
  constructor() {
    super("Parsing tokens config of backend service failed");
  }
}

export class EmptyBackendConfigError extends AppError {
  constructor() {
    super("Backend config is empty");
  }
}

export class EmptyTxError extends AppError {
  constructor() {
    super("Tx is empty");
  }
}
