import { AppError, AppErrorWithCause } from "./app";

export class BridgeFeeValidationError extends AppErrorWithCause {
  constructor(cause: Error["cause"]) {
    super("Bridge fee validation failed", cause);
  }
}

export class TokenConfigMissing extends AppError {
  constructor() {
    super("Token config was not found in backend service tokens config");
  }
}
