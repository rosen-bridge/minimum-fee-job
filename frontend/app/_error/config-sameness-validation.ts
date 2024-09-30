import { AppErrorWithCause } from "./app";

export class ConfigSamenessValidationError extends AppErrorWithCause {
  constructor(cause: Error["cause"]) {
    super("Config sameness validation failed", cause);
  }
}
