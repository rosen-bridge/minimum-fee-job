import { AppError, AppErrorWithCause } from "./app";

export class BridgeFeeValidationByTokenError extends AppErrorWithCause {
  constructor(cause: Error["cause"]) {
    super("Bridge fee validation by token failed", cause);
  }
}

export class TokenConfigMissing extends AppError {
  constructor() {
    super("Token config was not found in backend service tokens config");
  }
}
