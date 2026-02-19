require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const customerProductRoutes = require('./routes/customerProductRoutes');
const cartRoutes = require('./routes/cartRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { log } = require('./utils/logger');
const path = require('path');

// Security middleware
const { helmetConfig, additionalSecurityHeaders, disableUnsafeMethods, preventParameterPollution } = require('./config/helmet');
const { apiLimiter, authLimiter } = require('./config/rateLimmiting');
const {
  sanitizeInput,
  preventMongoInjection,
  preventXSS,
  preventQueryOperatorInjection,
  preventSQLInjection,
  preventPathTraversal,
  getCorsOptions
} = require('./middleware/security');

const app = express();

// Connect to MongoDB
connectDB();

// ============================================================================
// SECURITY MIDDLEWARE - Apply first, before any business logic
// ============================================================================

// Helmet - Secure HTTP headers
app.use(helmetConfig);

// Additional security headers
app.use(additionalSecurityHeaders);

// Disable unsafe HTTP methods (TRACE, TRACK)
app.use(disableUnsafeMethods);

// Request logging
app.use(requestLogger);

// ============================================================================
// COMPRESSION
// ============================================================================

// Enable gzip compression for responses > 1KB
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: process.env.NODE_ENV === 'production' ? 6 : 3
}));

// Rate limiting - Global API rate limiter
app.use('/api', apiLimiter);

// ============================================================================
// BODY PARSING & ENCODING
// ============================================================================

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// INJECTION & XSS PREVENTION
// ============================================================================

// Prevent NoSQL injection
app.use(preventMongoInjection);

// Prevent XSS attacks
app.use(preventXSS);

// Sanitize all inputs
app.use(sanitizeInput);

// Prevent MongoDB query operator injection
app.use(preventQueryOperatorInjection);

// Prevent SQL injection patterns (defense in depth)
app.use(preventSQLInjection);

// Prevent path traversal attacks
app.use(preventPathTraversal);

// Prevent parameter pollution
app.use(preventParameterPollution);

// ============================================================================
// CORS - Enhanced configuration
// ============================================================================

app.use(cors(getCorsOptions()));

// Serve static files for locally uploaded images
if (process.env.STORAGE_TYPE !== 's3' && process.env.STORAGE_TYPE !== 'cloudinary') {
  app.use('/images', express.static(path.join(__dirname, '../uploads')));
}

// Health check endpoint
app.get('/health', (req, res) => {
  log.info('Health check endpoint accessed');
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to General Store API',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

const apiVersion = process.env.API_VERSION || 'v1';

// Authentication routes - with stricter rate limiting
app.use(`/api/${apiVersion}/auth`, authLimiter, authRoutes);

// Product routes
app.use(`/api/products`, customerProductRoutes);
app.use(`/api/${apiVersion}/products`, productRoutes);
app.use(`/api/${apiVersion}/admin/products`, adminProductRoutes);

// Cart routes
app.use(`/api/cart`, cartRoutes);

// Upload routes - rate limited
app.use(`/api/upload`, uploadRoutes);

// ============================================================================
// ERROR HANDLING MIDDLEWARE - Must be last
// ============================================================================

// 404 Not Found Handler
app.use(notFoundHandler);

// Global Error Handler (MUST be absolutely last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  log.info(`===================================`);
  log.info(`🚀 Server started successfully`);
  log.info(`Port: ${PORT}`);
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log.info(`API Version: ${process.env.API_VERSION || 'v1'}`);
  log.info(`Security: Helmet, Rate Limiting, CORS Enabled`);
  log.info(`===================================`);
});
