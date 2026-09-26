import env from '../config/env.js';

/**
 * Centralized error handling middleware.
 * Formats errors consistently, handles specific Mongoose/JWT error codes, and suppresses stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, _req, res, _next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // 1. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // 2. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors.join(', ') || 'Validation error';
  }

  // 3. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authorization token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authorization token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export default errorMiddleware;
