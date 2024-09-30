import { AppError } from "./app";

export class MinimumFeeBoxFetchFailedError extends AppError {
  constructor() {
    super("fetching minimum fee box failed for some reason");
  }
}
