/**
 * Winston Logger Configuration
 * Handles logging to both console and file
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for timestamps
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    return logMessage;
  })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Console transport - always output to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),

    // Error log file - all errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),

    // Combined log file - all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

/**
 * HTTP Request Logger
 * Logs HTTP requests with method, URL, status, and response time
 */
const httpLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    })
  ]
});

/**
 * Log Functions
 */
const log = {
  /**
   * Info level - general information
   */
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  /**
   * Warning level - warning messages
   */
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  /**
   * Error level - error messages
   */
  error: (message, error = null, meta = {}) => {
    const errorMeta = {
      ...meta,
      ...(error && {
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack
      })
    };
    logger.error(message, errorMeta);
  },

  /**
   * Debug level - debug information
   */
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },

  /**
   * HTTP request logging
   */
  http: (method, url, status, duration, meta = {}) => {
    const message = `${method} ${url} - ${status} - ${duration}ms`;
    httpLogger.info(message, meta);
  },

  /**
   * Database operation logging
   */
  database: (operation, collection, duration, success = true, error = null) => {
    const level = success ? 'info' : 'error';
    const message = `Database [${collection}] - ${operation} - ${duration}ms`;
    logger[level](message, {
      operation,
      collection,
      duration,
      success,
      ...(error && { error: error.message })
    });
  },

  /**
   * Authentication logging
   */
  auth: (action, user = null, success = true, error = null) => {
    const level = success ? 'info' : 'warn';
    const message = `Auth [${action}] - ${success ? 'SUCCESS' : 'FAILED'}`;
    logger[level](message, {
      action,
      user,
      success,
      ...(error && { error: error.message })
    });
  }
};

module.exports = { logger, httpLogger, log };
