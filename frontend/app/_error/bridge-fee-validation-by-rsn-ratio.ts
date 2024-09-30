import { AppError, AppErrorWithCause } from "./app";

export class BridgeFeeValidationByRsnRatioError extends AppErrorWithCause {
  constructor(cause: Error["cause"]) {
    super("Bridge fee validation by rsn ratio failed", cause);
  }
}

export class TokenConfigMissing extends AppError {
  constructor() {
    super("Token config was not found in backend service tokens config");
  }
}

export class RsnConfigMissing extends AppError {
  constructor() {
    super("Rsn token config was not found in backend service tokens config");
  }
}
