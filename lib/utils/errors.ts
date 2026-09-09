export class AppError extends Error {
  public readonly statusCode: number;
  public readonly publicMessage: string;
  public readonly code: string;
  public details?: unknown;

  constructor(code: string, publicMessage: string, statusCode = 400, details?: unknown) {
    super(publicMessage);
    this.code = code;
    this.publicMessage = publicMessage;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(publicMessage = "Recurso no encontrado.") {
    super("NOT_FOUND", publicMessage, 404);
  }
}

export class ValidationAppError extends AppError {
  constructor(publicMessage: string, details?: unknown) {
    super("VALIDATION_ERROR", publicMessage, 422, details);
  }
}
