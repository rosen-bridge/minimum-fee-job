export class AppError extends Error {
  constructor(
    public message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class AppErrorWithCause extends AppError {
  constructor(message: string, cause?: unknown) {
    let reason: string;

    if (cause instanceof Error) {
      reason = cause.message;
    } else {
      try {
        reason = JSON.stringify(cause);
      } catch {
        reason = 'reason cannot be logged';
      }
    }
    super(`${message} (reason: ${reason})`, { cause });
  }
}
