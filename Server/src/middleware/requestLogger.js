/**
 * Request Logger Middleware
 * Uses Morgan for HTTP request logging
 */

const morgan = require('morgan');
const { httpLogger, log } = require('../utils/logger');

/**
 * Custom Morgan format for detailed logging
 */
const customFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

/**
 * Create Morgan stream for Winston logger
 */
const stream = {
  write: (message) => {
    // Extract relevant info and log via httpLogger
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      httpLogger.info(trimmedMessage);
    }
  }
};

/**
 * Morgan middleware configuration
 */
const requestLogger = morgan(customFormat, {
  stream,
  skip: (req, res) => {
    // Skip logging for health check and 404s (optional)
    const skipPaths = ['/health', '/favicon.ico'];
    return skipPaths.includes(req.path);
  }
});

/**
 * Alternative: Manual request logging middleware
 * More control over what gets logged
 */
const manualRequestLogger = (req, res, next) => {
  // Record start time
  const start = Date.now();

  // Store original send function
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function (data) {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    const userAgent = req.get('user-agent') || 'unknown';
    const remoteAddr = req.ip || req.connection.remoteAddress;

    // Build log metadata
    const meta = {
      method,
      url,
      status,
      duration,
      remoteAddr,
      userAgent,
      userId: req.user?.id || null,
      contentLength: Buffer.byteLength(data)
    };

    // Log based on status code
    if (status >= 500) {
      log.error(`HTTP ${status} - ${method} ${url}`, null, meta);
    } else if (status >= 400) {
      log.warn(`HTTP ${status} - ${method} ${url}`, meta);
    } else {
      log.info(`HTTP ${status} - ${method} ${url}`, meta);
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Enhanced Error Logging Middleware
 * Logs errors that occur during request processing
 */
const errorLoggingMiddleware = (err, req, res, next) => {
  const meta = {
    method: req.method,
    url: req.originalUrl,
    remoteAddr: req.ip,
    userId: req.user?.id || null,
    errorName: err.name,
    errorCode: err.code
  };

  log.error(`Request Error: ${err.message}`, err, meta);

  // Continue to next error handler
  next(err);
};

module.exports = {
  requestLogger,
  manualRequestLogger,
  errorLoggingMiddleware,
  morgan,
  stream
};
