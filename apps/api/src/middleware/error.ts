import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('❌ Error:', err.message || err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
