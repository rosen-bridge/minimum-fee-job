import { AppErrorWithCause } from "./app";

export class TxDataExtractionError extends AppErrorWithCause {
  constructor(cause: ErrorOptions["cause"]) {
    super("Extracting data from the tx failed", cause);
  }
}
