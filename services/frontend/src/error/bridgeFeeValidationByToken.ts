import { AppErrorWithCause } from './app';

export class BridgeFeeValidationByTokenError extends AppErrorWithCause {
  constructor(cause: Error['cause']) {
    super('Bridge fee validation by token failed', cause);
  }
}
