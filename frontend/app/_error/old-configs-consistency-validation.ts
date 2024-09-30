import { AppErrorWithCause } from "./app";

export class OldFeesConsistencyValidationError extends AppErrorWithCause {
  constructor(cause: Error["cause"]) {
    super("Old fees consistency validation failed", cause);
  }
}
