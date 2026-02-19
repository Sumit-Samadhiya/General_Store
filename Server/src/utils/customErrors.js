/**
 * Custom Error Classes
 * Provides specific error types for different scenarios
 */

/**
 * Base Custom Error Class
 * All custom errors extend this class
 */
class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Flag for operational errors vs programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400 Bad Request
 * Used when request validation fails
 */
class ValidationError extends CustomError {
  constructor(message, details = null, code = 'VALIDATION_ERROR') {
    super(message, 400, code);
    this.name = 'ValidationError';
    this.details = details; // Additional validation details
  }
}

/**
 * Authentication Error - 401 Unauthorized
 * Used when authentication fails
 */
class AuthenticationError extends CustomError {
  constructor(message = 'Authentication failed', code = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error - 403 Forbidden
 * Used when user doesn't have permission for an action
 */
class AuthorizationError extends CustomError {
  constructor(message = 'Access denied', code = 'AUTHORIZATION_ERROR') {
    super(message, 403, code);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error - 404 Not Found
 * Used when requested resource doesn't exist
 */
class NotFoundError extends CustomError {
  constructor(resource = 'Resource', code = 'NOT_FOUND') {
    super(`${resource} not found`, 404, code);
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

/**
 * Conflict Error - 409 Conflict
 * Used when there's a resource conflict (e.g., duplicate email)
 */
class ConflictError extends CustomError {
  constructor(message = 'Resource already exists', code = 'CONFLICT') {
    super(message, 409, code);
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 * Used when client exceeds rate limit
 */
class RateLimitError extends CustomError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Business Logic Error - 422 Unprocessable Entity
 * Used when request is valid but business logic fails
 */
class BusinessLogicError extends CustomError {
  constructor(message, code = 'BUSINESS_LOGIC_ERROR') {
    super(message, 422, code);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Database Error - 500 Internal Server Error
 * Used for database connection/query issues
 */
class DatabaseError extends CustomError {
  constructor(message = 'Database operation failed', code = 'DATABASE_ERROR') {
    super(message, 500, code);
    this.name = 'DatabaseError';
  }
}

/**
 * External Service Error - 502 Bad Gateway
 * Used when external API calls fail
 */
class ExternalServiceError extends CustomError {
  constructor(service = 'External Service', message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(`${service}: ${message}`, 502, code);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * File Upload Error - 400 Bad Request
 * Used for file upload failures
 */
class FileUploadError extends CustomError {
  constructor(message = 'File upload failed', code = 'FILE_UPLOAD_ERROR') {
    super(message, 400, code);
    this.name = 'FileUploadError';
  }
}

/**
 * Invalid Input Error - 400 Bad Request
 * Used for invalid input parameters
 */
class InvalidInputError extends CustomError {
  constructor(message, parameter = null, code = 'INVALID_INPUT') {
    super(message, 400, code);
    this.name = 'InvalidInputError';
    this.parameter = parameter;
  }
}

/**
 * Request Timeout Error - 408 Request Timeout
 * Used when request times out
 */
class RequestTimeoutError extends CustomError {
  constructor(message = 'Request timeout', code = 'REQUEST_TIMEOUT') {
    super(message, 408, code);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * Server Error - 500 Internal Server Error
 * Generic server error for unexpected issues
 */
class ServerError extends CustomError {
  constructor(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, code);
    this.name = 'ServerError';
  }
}

/**
 * Bad Gateway Error - 503 Service Unavailable
 * Used when server dependencies are unavailable
 */
class ServiceUnavailableError extends CustomError {
  constructor(service = 'Service', message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(`${service}: ${message}`, 503, code);
    this.name = 'ServiceUnavailableError';
    this.service = service;
  }
}

module.exports = {
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  BusinessLogicError,
  DatabaseError,
  ExternalServiceError,
  FileUploadError,
  InvalidInputError,
  RequestTimeoutError,
  ServerError,
  ServiceUnavailableError
};
