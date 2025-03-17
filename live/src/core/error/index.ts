export class APIError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "APIError";
    // Ensures proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}
