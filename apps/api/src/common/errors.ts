export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const NotFoundError = (msg = 'Not found') => new HttpError(404, msg);
export const UnauthorizedError = (msg = 'Unauthorized') => new HttpError(401, msg);
export const ForbiddenError = (msg = 'Forbidden') => new HttpError(403, msg);
export const BadRequestError = (msg = 'Bad request') => new HttpError(400, msg);
export const ConflictError = (msg = 'Conflict') => new HttpError(409, msg);
