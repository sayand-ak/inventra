export class AppError extends Error {
  constructor(message, statusCode, errorCode, error = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || "INTERNAL_SERVER_ERROR";
    this.isOperational = true;
    this.originalError = error;

    Error.captureStackTrace(this, this.constructor);
  }
}