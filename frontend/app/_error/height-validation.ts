import { AppErrorWithCause } from "./app";

export class HeightValidationError extends AppErrorWithCause {
  constructor(cause: Error["cause"]) {
    super("Height validation failed", cause);
  }
}
