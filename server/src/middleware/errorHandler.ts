import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const route = req.originalUrl || req.url || 'unknown route';
  console.error(`[Error Middleware] Route: ${route} | Error: ${err.message || err}`);
  if (err.stack) {
    console.error(`[Error Middleware Stack]`, err.stack);
  }

  const statusCode = err.statusCode || err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = err.message || 'An unexpected error occurred while processing your document.';

  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    });
  }
}
