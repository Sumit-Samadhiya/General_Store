/**
 * API Response Formatter
 * Provides consistent response format for success and error cases
 */

const { log } = require('./logger');

/**
 * Standard Response Format
 * {
 *   success: boolean,
 *   statusCode: number,
 *   message: string,
 *   data: any,
 *   error: { code: string, details: any },
 *   timestamp: ISO timestamp,
 *   path: string
 * }
 */

class ApiResponse {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {any} data - Response data
   * @param {Object} meta - Additional metadata
   */
  static success(res, statusCode = 200, message = 'Success', data = null, meta = {}) {
    const response = {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...meta
    };

    log.info(`Success Response: ${message}`, {
      statusCode,
      hasData: !!data,
      requestPath: res.req?.path
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {string} errorCode - Error code for identification
   * @param {Object} errorDetails - Additional error details
   * @param {Object} meta - Additional metadata
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR', errorDetails = null, meta = {}) {
    const response = {
      success: false,
      statusCode,
      message,
      error: {
        code: errorCode,
        ...(errorDetails && { details: errorDetails })
      },
      timestamp: new Date().toISOString(),
      path: res.req?.path,
      ...meta
    };

    // Log errors at appropriate level
    const logLevel = statusCode >= 500 ? 'error' : 'warn';
    log[logLevel](`Error Response: ${message}`, {
      statusCode,
      errorCode,
      requestPath: res.req?.path,
      ...(errorDetails && { details: errorDetails })
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {string} message - Validation error message
   * @param {Array} validationErrors - Array of validation errors
   */
  static validationError(res, message = 'Validation failed', validationErrors = []) {
    const response = {
      success: false,
      statusCode: 400,
      message,
      error: {
        code: 'VALIDATION_ERROR',
        details: {
          errors: validationErrors
        }
      },
      timestamp: new Date().toISOString(),
      path: res.req?.path
    };

    log.warn(`Validation Error: ${message}`, {
      validationErrors,
      requestPath: res.req?.path
    });

    return res.status(400).json(response);
  }

  /**
   * Send pagination response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {Array} data - Paginated data
   * @param {number} total - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   */
  static paginated(res, statusCode = 200, message = 'Success', data = [], total = 0, page = 1, limit = 10) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response = {
      success: true,
      statusCode,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      timestamp: new Date().toISOString()
    };

    log.info(`Paginated Response: ${message}`, {
      statusCode,
      total,
      page,
      limit,
      totalPages
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response (201)
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {any} data - Created resource data
   */
  static created(res, message = 'Resource created successfully', data = null) {
    return this.success(res, 201, message, data);
  }

  /**
   * Send no content response (204)
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    log.info('No Content Response', { statusCode: 204 });
    return res.status(204).send();
  }

  /**
   * Send not found response (404)
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name
   */
  static notFound(res, resource = 'Resource') {
    return this.error(res, 404, `${resource} not found`, 'NOT_FOUND');
  }

  /**
   * Send unauthorized response (401)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, 401, message, 'UNAUTHORIZED');
  }

  /**
   * Send forbidden response (403)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = 'Access denied') {
    return this.error(res, 403, message, 'FORBIDDEN');
  }

  /**
   * Send conflict response (409)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {Object} details - Conflict details
   */
  static conflict(res, message = 'Resource already exists', details = null) {
    return this.error(res, 409, message, 'CONFLICT', details);
  }

  /**
   * Send rate limit response (429)
   * @param {Object} res - Express response object
   * @param {number} retryAfter - Seconds to retry after
   */
  static rateLimited(res, retryAfter = 60) {
    res.set('Retry-After', retryAfter);
    return this.error(res, 429, 'Too many requests', 'RATE_LIMIT_EXCEEDED');
  }

  /**
   * Send server error response (500)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {Object} details - Error details (dev only)
   */
  static serverError(res, message = 'Internal server error', details = null) {
    const errorDetails = process.env.NODE_ENV === 'development' ? details : null;
    return this.error(res, 500, message, 'INTERNAL_SERVER_ERROR', errorDetails);
  }

  /**
   * Send service unavailable response (503)
   * @param {Object} res - Express response object
   * @param {string} service - Service name
   */
  static serviceUnavailable(res, service = 'Service') {
    return this.error(res, 503, `${service} is temporarily unavailable`, 'SERVICE_UNAVAILABLE');
  }
}

module.exports = ApiResponse;
