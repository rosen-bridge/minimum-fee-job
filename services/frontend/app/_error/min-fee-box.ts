import { AppError, AppErrorWithCause } from "./app";

export class MinimumFeeBoxInstantiationError extends AppErrorWithCause {
  constructor(cause: Error["cause"]) {
    super("Instantiating minimum fee box failed", cause);
  }
}

export class MinimumFeeBoxFetchFailedError extends AppError {
  constructor() {
    super("Fetching minimum fee box from blockchain failed");
  }
}
