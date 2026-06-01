/**
 * Global error handler — never leak stack in production
 */
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.statusCode || 500;
  const message = err.message || 'Server error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
