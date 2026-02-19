/**
 * Rate Limiting Configuration
 * Prevents brute force attacks, DoS attacks, and API abuse
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { log } = require('../utils/logger');

/**
 * General API Rate Limiter
 * Limits all API requests globally
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      details: 'Please try again after some time'
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  keyGenerator: (req) => {
    // Use IP address as key
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res, next, options) => {
    log.warn('Rate limit exceeded - General API', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs
    });

    res.status(429).json({
      success: false,
      message: options.message.message || 'Too many requests',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        details: 'Please try again after 15 minutes'
      }
    });
  }
});

/**
 * Strict Rate Limiter for Authentication
 * Prevents brute force login/register attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many authentication attempts',
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      details: 'Please try again after 15 minutes'
    }
  },
  keyGenerator: (req) => {
    // Use combination of IP and email for more granular control
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  },
  handler: (req, res, next, options) => {
    log.warn('Rate limit exceeded - Authentication', {
      ip: req.ip,
      email: req.body?.email,
      path: req.path,
      method: req.method,
      limit: options.max
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts',
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        details: 'Please try again after 15 minutes',
        retryAfter: 900 // 15 minutes in seconds
      }
    });
  }
});

/**
 * Password Reset Rate Limiter
 * Prevents abuse of password reset functionality
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts',
    error: {
      code: 'PASSWORD_RESET_LIMIT_EXCEEDED',
      details: 'Please try again after 1 hour'
    }
  },
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    return `pw-reset-${req.ip}-${email}`;
  },
  handler: (req, res, next, options) => {
    log.warn('Rate limit exceeded - Password Reset', {
      ip: req.ip,
      email: req.body?.email,
      limit: options.max
    });

    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts',
      error: {
        code: 'PASSWORD_RESET_LIMIT_EXCEEDED',
        details: 'Please try again after 1 hour'
      }
    });
  }
});

/**
 * File Upload Rate Limiter
 * Prevents abuse of file upload endpoint
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 uploads per hour
  message: {
    success: false,
    message: 'Too many upload requests',
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      details: 'Please try again after 1 hour'
    }
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  },
  handler: (req, res, next, options) => {
    log.warn('Rate limit exceeded - File Upload', {
      ip: req.ip,
      userId: req.user?.id,
      limit: options.max
    });

    res.status(429).json({
      success: false,
      message: 'Too many upload requests',
      error: {
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        details: 'Please try again after 1 hour'
      }
    });
  }
});

/**
 * Search/Query Rate Limiter
 * Prevents expensive queries from overwhelming the system
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    success: false,
    message: 'Too many search requests',
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      details: 'Please try again after 1 minute'
    }
  },
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res, next, options) => {
    log.warn('Rate limit exceeded - Search', {
      ip: req.ip,
      userId: req.user?.id,
      query: req.query.search?.substring(0, 50)
    });

    res.status(429).json({
      success: false,
      message: 'Too many search requests',
      error: {
        code: 'SEARCH_RATE_LIMIT_EXCEEDED',
        details: 'Please try again after 1 minute'
      }
    });
  }
});

/**
 * API Key Rate Limiter
 * For rate limiting by API key instead of IP
 */
const createApiKeyLimiter = (maxRequests, windowMs) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      return req.headers['x-api-key'] || req.ip;
    },
    handler: (req, res, next, options) => {
      log.warn('Rate limit exceeded - API Key', {
        apiKey: req.headers['x-api-key']?.substring(0, 10),
        path: req.path,
        limit: options.max
      });

      res.status(429).json({
        success: false,
        message: 'API rate limit exceeded',
        error: {
          code: 'API_RATE_LIMIT_EXCEEDED',
          details: 'Please check your API key limits'
        }
      });
    }
  });
};

/**
 * Create Custom Rate Limiter
 * For flexibility in defining custom rate limits
 */
const createCustomLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  name = 'Custom',
  keyGenerator = null
}) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: keyGenerator || ((req) => req.ip),
    handler: (req, res, next, options) => {
      log.warn(`Rate limit exceeded - ${name}`, {
        ip: req.ip,
        path: req.path,
        limit: options.max
      });

      res.status(429).json({
        success: false,
        message: `Too many ${name.toLowerCase()} requests`,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          details: `Please try again after ${Math.ceil(options.windowMs / 1000 / 60)} minutes`
        }
      });
    }
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  searchLimiter,
  createApiKeyLimiter,
  createCustomLimiter
};
