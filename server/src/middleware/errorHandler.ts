import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(`[Error Middleware] ${err.stack || err.message || err}`);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected error occurred while processing your document.';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack })
  });
}
