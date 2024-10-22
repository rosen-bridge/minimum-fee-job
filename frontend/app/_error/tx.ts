import { AppErrorWithCause } from "./app";

export class TxDataExtractionError extends AppErrorWithCause {
  constructor(cause: ErrorOptions["cause"]) {
    super("Extracting data from the tx failed", cause);
  }
}

export class TxFetchingFromExplorerError extends AppErrorWithCause {
  constructor(cause: ErrorOptions["cause"]) {
    super("Fetching tx from explorer failed", cause);
  }
}
