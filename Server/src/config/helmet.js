/**
 * Helmet.js Configuration
 * Secures HTTP headers for better protection against various web attacks
 */

const helmet = require('helmet');

/**
 * Helmet Middleware Configuration
 * Sets various HTTP headers to improve security
 */
const helmetConfig = helmet({
  // Content Security Policy - Prevents XSS, clickjacking, data injection
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://api.example.com',
        'https://cdn.example.com'
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },

  // Strict-Transport-Security - Enforces HTTPS
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true // Include in HSTS preload list
  },

  // X-Content-Type-Options - Prevents MIME type sniffing
  noSniff: true,

  // X-Frame-Options - Prevents clickjacking
  frameguard: {
    action: 'deny' // Prevents framing from any source
  },

  // X-XSS-Protection - Legacy XSS protection (for older browsers)
  xssFilter: true,

  // Referrer-Policy - Controls what referrer info is sent
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Permissions-Policy - Controls browser features
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"],
      vr: ["'none'"]
    }
  },

  // Remove X-Powered-By header
  hidePoweredBy: true,

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: {
    policy: 'credentialless'
  },

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin-allow-popups'
  },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  }
});

/**
 * Additional Security Headers Middleware
 * Custom security headers not covered by Helmet
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Set custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent browsers from MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Disable caching for sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
};

/**
 * Disable HTTP Methods Middleware
 * Only allow necessary HTTP methods
 */
const disableUnsafeMethods = (req, res, next) => {
  if (req.method === 'TRACE' || req.method === 'TRACK') {
    return res.status(405).json({
      success: false,
      message: `${req.method} method not allowed`,
      error: {
        code: 'METHOD_NOT_ALLOWED'
      }
    });
  }

  next();
};

/**
 * Prevent Parameter Pollution
 * Detects and prevents HTTP parameter pollution attacks
 */
const preventParameterPollution = (req, res, next) => {
  // Check for duplicate parameters
  const query = req.query;
  const params = req.params;

  for (const key in query) {
    if (Array.isArray(query[key])) {
      // Log parameter pollution attempt
      const { log } = require('../utils/logger');
      log.warn('Parameter pollution detected', {
        key,
        values: query[key],
        path: req.path,
        ip: req.ip
      });

      // Keep only the first value
      query[key] = query[key][0];
    }
  }

  next();
};

module.exports = {
  helmetConfig,
  additionalSecurityHeaders,
  disableUnsafeMethods,
  preventParameterPollution
};
