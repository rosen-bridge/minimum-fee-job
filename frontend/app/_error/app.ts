export class AppError extends Error {
  constructor(public message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class AppErrorWithCause extends AppError {
  constructor(message: string, cause: Error["cause"]) {
    if (cause instanceof Error) {
      super(`${message} (reason: ${cause.message})`);
    }
    try {
      super(`${message} (reason: ${JSON.stringify(cause)})`);
    } catch {
      super(`${message} (reason cannot be logged)`);
    }
  }
}
