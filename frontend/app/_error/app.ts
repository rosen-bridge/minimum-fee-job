export class AppError extends Error {
  constructor(
    public message: string,
    options?: ErrorOptions,
    public isFatal = false
  ) {
    super(message, options);
  }
}
