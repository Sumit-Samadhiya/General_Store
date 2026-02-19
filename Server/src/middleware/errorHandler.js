/**
 * Comprehensive Error Handling Middleware
 * Handles all types of errors with proper logging and response formatting
 */

const { log } = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');
const {
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError
} = require('../utils/customErrors');

/**
 * Global Error Handler Middleware
 * This should be the last middleware in the Express app
 */
const errorHandler = (err, req, res, next) => {
  // Set default values
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let errorDetails = null;

  // Log the error
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    remoteAddr: req.ip,
    userId: req.user?.id || null,
    errorName: err.name,
    errorCode
  };

  if (statusCode >= 500) {
    log.error(`Unhandled Error: ${message}`, err, errorContext);
  } else {
    log.warn(`Client Error: ${message}`, errorContext);
  }

  // Handle specific error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorCode = err.code;
    errorDetails = err.details;
    return ApiResponse.validationError(res, message, err.details?.errors || []);
  }

  if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorCode = err.code;
    return ApiResponse.unauthorized(res, message);
  }

  if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorCode = err.code;
    return ApiResponse.forbidden(res, message);
  }

  if (err instanceof NotFoundError) {
    statusCode = 404;
    errorCode = err.code;
    return ApiResponse.notFound(res, err.resource || 'Resource');
  }

  if (err instanceof DatabaseError) {
    statusCode = 500;
    errorCode = err.code;
    message = process.env.NODE_ENV === 'development'
      ? err.message
      : 'Database operation failed';
    return ApiResponse.serverError(res, message);
  }

  // Handle MongoDB/Mongoose errors
  if (err.name === 'MongooseValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return ApiResponse.validationError(res, 'Validation failed', errors);
  }

  if (err.name === 'MongooseCastError') {
    statusCode = 400;
    errorCode = 'INVALID_INPUT';
    message = `Invalid ${err.kind}: ${err.value}`;
    return ApiResponse.error(res, statusCode, message, errorCode);
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
    return ApiResponse.conflict(res, message);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid token';
    return ApiResponse.unauthorized(res, message);
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Token has expired';
    return ApiResponse.unauthorized(res, message);
  }

  // Handle Joi validation errors
  if (err.isJoi || err.details) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const errors = (err.details || []).map(detail => ({
      field: detail.context.key,
      message: detail.message
    }));
    return ApiResponse.validationError(res, 'Validation failed', errors);
  }

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';

    switch (err.code) {
      case 'LIMIT_PART_COUNT':
        message = 'Too many fields';
        break;
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      default:
        message = 'File upload error';
    }

    return ApiResponse.error(res, statusCode, message, errorCode);
  }

  // Handle syntax errors (JSON parsing errors)
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
    return ApiResponse.error(res, statusCode, message, errorCode);
  }

  // Handle custom operational errors
  if (err.isOperational) {
    return ApiResponse.error(res, statusCode, message, errorCode, errorDetails);
  }

  // Handle unknown server errors (safety fallback)
  log.error('Unhandled Error - Fallback Handler', err, {
    method: req.method,
    url: req.originalUrl,
    errorType: err.constructor.name
  });

  const devErrorDetails = process.env.NODE_ENV === 'development'
    ? { stack: err.stack, name: err.name }
    : null;

  return ApiResponse.serverError(res, 'An unexpected error occurred', devErrorDetails);
};

/**
 * 404 Not Found Handler
 * Should be used as the last route handler
 */
const notFoundHandler = (req, res) => {
  log.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    remoteAddr: req.ip
  });

  return ApiResponse.notFound(res, `${req.method} ${req.originalUrl}`);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
