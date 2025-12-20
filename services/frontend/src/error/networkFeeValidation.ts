import { AppError, AppErrorWithCause } from './app';

export class NetworkFeeValidationError extends AppErrorWithCause {
  constructor(cause: Error['cause']) {
    super('Network fee validation failed', cause);
  }
}

export class ChainTokenConfigMissing extends AppError {
  constructor(chainTokenName: string) {
    super(
      `Chain token (${chainTokenName}) config was not found in backend service tokens config`,
    );
  }
}
