import { AppErrorWithCause } from "./app";

export class ChainConfigsSamenessValidationError extends AppErrorWithCause {
  constructor(cause: Error["cause"]) {
    super("Chain configs sameness validation failed", cause);
  }
}
