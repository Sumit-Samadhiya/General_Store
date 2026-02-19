# Comprehensive Error Handling Guide

## Overview

The General Store API now includes a complete error handling system with:

- ✅ **15+ Custom Error Classes** - Specific error types for different scenarios
- ✅ **Winston Logging** - Logging to both console and files
- ✅ **Morgan Request Logging** - HTTP request tracking
- ✅ **Consistent API Response Format** - Standard response structure for all endpoints
- ✅ **Proper HTTP Status Codes** - RESTful status codes for all scenarios
- ✅ **Async Error Handling** - Automatic error catching for async handlers

---

## Architecture Overview

```
Request
  ↓
Morgan Request Logger (logs incoming request)
  ↓
Route Handler
  ↓
Error (if occurs)
  ↓
Global Error Handler
  ↓
API Response Formatter
  ↓
Winston Logger (logs error)
  ↓
Response sent to client
```

---

## Custom Error Classes

### Available Error Classes

All custom errors extend `CustomError` and include:
- `statusCode` - HTTP status code
- `code` - Error code for identification
- `message` - Human-readable error message
- `isOperational` - Flag to distinguish operational errors from programming errors

### Error Class Reference

| Class | Status | Use Case |
|-------|--------|----------|
| `ValidationError` | 400 | Input validation fails |
| `InvalidInputError` | 400 | Invalid parameter |
| `FileUploadError` | 400 | File upload fails |
| `AuthenticationError` | 401 | Auth fails (no/invalid credentials) |
| `RequestTimeoutError` | 408 | Request timeout |
| `AuthorizationError` | 403 | User lacks permission |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Resource conflict (e.g., duplicate) |
| `RateLimitError` | 429 | Rate limit exceeded |
| `BusinessLogicError` | 422 | Request valid but business logic fails |
| `DatabaseError` | 500 | Database operation fails |
| `ServerError` | 500 | Unexpected server error |
| `ExternalServiceError` | 502 | External API fails |
| `ServiceUnavailableError` | 503 | Dependency unavailable |

---

## Using Custom Errors in Controllers

### Example 1: Validation Error

```javascript
const { ValidationError } = require('../utils/customErrors');
const ApiResponse = require('../utils/apiResponse');

exports.createProduct = async (req, res, next) => {
  try {
    const { name, price } = req.body;

    // Validation
    if (!name || !price) {
      throw new ValidationError('Name and price are required', [
        { field: 'name', message: 'Name is required' },
        { field: 'price', message: 'Price is required' }
      ]);
    }

    // Create product
    const product = await Product.create({ name, price });

    // Success response
    ApiResponse.created(res, 'Product created successfully', product);
  } catch (error) {
    next(error);
  }
};
```

### Example 2: Not Found Error

```javascript
const { NotFoundError } = require('../utils/customErrors');

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new NotFoundError('Product');
    }

    ApiResponse.success(res, 200, 'Product retrieved', product);
  } catch (error) {
    next(error);
  }
};
```

### Example 3: Authentication Error

```javascript
const { AuthenticationError } = require('../utils/customErrors');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.validatePassword(password)) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = user.generateToken();
    ApiResponse.success(res, 200, 'Login successful', { token });
  } catch (error) {
    next(error);
  }
};
```

### Example 4: Conflict Error

```javascript
const { ConflictError } = require('../utils/customErrors');

exports.registerUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    const existing = await User.findOne({ email });

    if (existing) {
      throw new ConflictError(`Email ${email} is already registered`);
    }

    const user = await User.create(req.body);
    ApiResponse.created(res, 'User registered successfully', user);
  } catch (error) {
    next(error);
  }
};
```

---

## API Response Format

### Success Response (200)

```javascript
ApiResponse.success(res, 200, 'Operation successful', { id: 1, name: 'Product' });
```

**Response body:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "name": "Product"
  },
  "timestamp": "2026-02-19T12:00:00.000Z"
}
```

### Created Response (201)

```javascript
ApiResponse.created(res, 'Resource created', { id: 1 });
```

**Response body:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Resource created",
  "data": { "id": 1 },
  "timestamp": "2026-02-19T12:00:00.000Z"
}
```

### Error Response (4xx/5xx)

```javascript
ApiResponse.error(res, 400, 'Validation failed', 'VALIDATION_ERROR', {
  errors: [{ field: 'email', message: 'Invalid email' }]
});
```

**Response body:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "errors": [
        { "field": "email", "message": "Invalid email" }
      ]
    }
  },
  "timestamp": "2026-02-19T12:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### Validation Error Response

```javascript
ApiResponse.validationError(res, 'Input validation failed', [
  { field: 'email', message: 'Email is required' },
  { field: 'password', message: 'Password must be at least 8 characters' }
]);
```

### Paginated Response

```javascript
ApiResponse.paginated(res, 200, 'Products retrieved', products, total, page, limit);
```

**Response body:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved",
  "data": [
    { "id": 1, "name": "Product 1" },
    { "id": 2, "name": "Product 2" }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2026-02-19T12:00:00.000Z"
}
```

---

## API Response Methods Reference

### Success Responses

| Method | Status | Use Case |
|--------|--------|----------|
| `ApiResponse.success()` | 200 | Generic success |
| `ApiResponse.created()` | 201 | Resource created |
| `ApiResponse.noContent()` | 204 | No content response |
| `ApiResponse.paginated()` | 200 | Paginated data |

### Error Responses

| Method | Status | Use Case |
|--------|--------|----------|
| `ApiResponse.validationError()` | 400 | Validation fails |
| `ApiResponse.error()` | Custom | Any error with details |
| `ApiResponse.notFound()` | 404 | Resource not found |
| `ApiResponse.unauthorized()` | 401 | Authentication fails |
| `ApiResponse.forbidden()` | 403 | Authorization fails |
| `ApiResponse.conflict()` | 409 | Resource conflict |
| `ApiResponse.rateLimited()` | 429 | Rate limit exceeded |
| `ApiResponse.serverError()` | 500 | Server error |
| `ApiResponse.serviceUnavailable()` | 503 | Service unavailable |

---

## Request Logging

### Morgan Logger

Logs all HTTP requests with:
- Method (GET, POST, etc.)
- URL path
- HTTP status code
- Response time in milliseconds
- User agent
- Remote IP address

**Log file:** `logs/http.log`

**Example log:**
```
192.168.1.100 - [19/Feb/2026:12:00:00 +0000] "POST /api/v1/auth/login HTTP/1.1" 200 234 "-" "Mozilla/5.0..." 45 ms
```

### Using the Logger

```javascript
const { log } = require('../utils/logger');

// Info log
log.info('User logged in', { userId: user.id, email: user.email });

// Warning log
log.warn('Resource not found', { resourceId: id });

// Error log
log.error('Database query failed', error, { collection: 'users' });

// Debug log
log.debug('Processing request', { requestId: req.id });

// Database operation log
log.database('find', 'products', 45, true);

// Authentication log
log.auth('login', user.email, true);
```

### Log Files

| File | Purpose |
|------|---------|
| `logs/combined.log` | All logs (errors + info) |
| `logs/error.log` | Error logs only |
| `logs/http.log` | HTTP request logs |

---

## Error Handler Middleware

### Features

The error handler automatically handles:

1. **Custom Errors** - ValidationError, NotFoundError, etc.
2. **MongoDB Errors**
   - Validation errors
   - Cast errors (invalid ObjectId)
   - Duplicate key errors (409 Conflict)
3. **JWT Errors**
   - Invalid token (401 Unauthorized)
   - Expired token (401 Unauthorized)
4. **Multer Upload Errors**
   - File too large
   - Too many files
   - Field validation errors
5. **JSON Parsing Errors** - Invalid JSON in request body
6. **Unknown Errors** - Fallback for uncaught errors

### Error Handler Flow

```javascript
app.use((err, req, res, next) => {
  // 1. Check error type
  // 2. Map to appropriate error class
  // 3. Extract relevant details
  // 4. Log error with context
  // 5. Send formatted response
  // 6. Hide sensitive info in production
});
```

---

## Using AsyncHandler Wrapper

Wrap async handlers to automatically catch errors:

```javascript
const { asyncHandler } = require('../middleware/errorHandler');

// Without asyncHandler (not recommended)
router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new NotFoundError('Product');
    ApiResponse.success(res, 200, 'Product found', product);
  } catch (error) {
    next(error); // Must explicitly pass errors
  }
});

// With asyncHandler (recommended)
router.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new NotFoundError('Product');
  ApiResponse.success(res, 200, 'Product found', product);
}));
```

---

## Best Practices

### 1. Use Specific Error Classes

```javascript
// ❌ Bad
throw new Error('User not found');

// ✅ Good
throw new NotFoundError('User');
```

### 2. Always Use AsyncHandler

```javascript
// ❌ Bad - requires try/catch in every handler
router.get('/users/:id', async (req, res, next) => {
  try {
    // ...
  } catch (error) {
    next(error);
  }
});

// ✅ Good - automatic error catching
router.get('/users/:id', asyncHandler(async (req, res) => {
  // ...
}));
```

### 3. Use Appropriate Response Methods

```javascript
// ❌ Bad
res.json({ success: true, data: user });

// ✅ Good
ApiResponse.success(res, 200, 'User retrieved', user);
```

### 4. Log Contextual Information

```javascript
// ❌ Bad
log.error('Error occurred', error);

// ✅ Good
log.error('User registration failed', error, {
  email: req.body.email,
  userId: user?.id
});
```

### 5. Include Validation Details

```javascript
// ❌ Bad
throw new ValidationError('Validation failed');

// ✅ Good
throw new ValidationError('User validation failed', [
  { field: 'email', message: 'Invalid email format' },
  { field: 'password', message: 'Must be at least 8 characters' }
]);
```

### 6. Handle errors at the right level

```javascript
// ❌ Bad - generic error message
throw new ServerError('Something went wrong');

// ✅ Good - specific error
throw new DatabaseError('Failed to fetch user profile');
```

---

## Error Response Status Codes

### 4xx Client Errors

| Status | Meaning | Use Case |
|--------|---------|----------|
| 400 | Bad Request | Invalid input, missing fields |
| 401 | Unauthorized | No/invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permission |
| 404 | Not Found | Resource doesn't exist |
| 408 | Request Timeout | Request takes too long |
| 409 | Conflict | Resource already exists (duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |

### 5xx Server Errors

| Status | Meaning | Use Case |
|--------|---------|----------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | External service error |
| 503 | Service Unavailable | Server dependency down |

---

## Configuration

### Environment Variables

```env
# Logging
LOG_LEVEL=info  # Options: error, warn, info, debug
NODE_ENV=development  # Options: development, production

# Server
PORT=5000
API_VERSION=v1

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Log Levels

| Level | When to Use |
|-------|------------|
| `error` | Errors that need immediate attention |
| `warn` | Warnings and validation failures |
| `info` | Successful operations and important events |
| `debug` | Detailed debugging information |

---

## Common Error Scenarios

### Scenario 1: User Not Found

```javascript
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new NotFoundError('User');
  }

  ApiResponse.success(res, 200, 'User retrieved', user);
});

// Response:
// 404 {
//   "success": false,
//   "statusCode": 404,
//   "message": "User not found",
//   "error": { "code": "NOT_FOUND" }
// }
```

### Scenario 2: Invalid Input

```javascript
exports.updateUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    throw new ValidationError('Invalid email format', [
      { field: 'email', message: 'Must be a valid email address' }
    ]);
  }

  const user = await User.findByIdAndUpdate(req.params.id, { email }, { new: true });
  ApiResponse.success(res, 200, 'User updated', user);
});

// Response:
// 400 {
//   "success": false,
//   "statusCode": 400,
//   "message": "Invalid email format",
//   "error": {
//     "code": "VALIDATION_ERROR",
//     "details": {
//       "errors": [{ "field": "email", "message": "Must be a valid email address" }]
//     }
//   }
// }
```

### Scenario 3: Duplicate Email

```javascript
exports.registerUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ConflictError(`Email ${email} is already registered`);
  }

  const user = await User.create(req.body);
  ApiResponse.created(res, 'User registered successfully', user);
});

// Response:
// 409 {
//   "success": false,
//   "statusCode": 409,
//   "message": "Email example@test.com is already registered",
//   "error": { "code": "CONFLICT" }
// }
```

### Scenario 4: Unauthorized Access

```javascript
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    throw new AuthorizationError('You can only delete your own account');
  }

  await User.findByIdAndDelete(req.params.id);
  ApiResponse.noContent(res);
});

// Response:
// 403 {
//   "success": false,
//   "statusCode": 403,
//   "message": "You can only delete your own account",
//   "error": { "code": "AUTHORIZATION_ERROR" }
// }
```

---

## Troubleshooting

### Issue: Errors not being logged

**Solution:** Ensure error handler is the last middleware:
```javascript
// Add all routes first
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler MUST be last
app.use(errorHandler);
```

### Issue: Winston logs not appearing

**Solution:** Ensure logs directory exists and has write permissions:
```bash
mkdir -p logs
chmod 755 logs
```

### Issue: Morgan requests not logged

**Solution:** Add Morgan before routes:
```javascript
// Must be early middleware
app.use(requestLogger);

app.use('/api', routes);
```

### Issue: Stack traces leaking in production

**Solution:** Use proper environment variables:
```env
NODE_ENV=production
LOG_LEVEL=warn
```

---

## Performance Tips

1. **Set appropriate log level:**
   - Production: `warn` or `error`
   - Development: `info` or `debug`

2. **Rotate log files:**
   - Winston automatically rotates at 10MB
   - Max 10 files per log type

3. **Use conditional logging:**
   ```javascript
   if (process.env.NODE_ENV === 'development') {
     log.debug('Detailed debugging info', data);
   }
   ```

---

## File Locations

- **Custom Errors:** `src/utils/customErrors.js`
- **Logger:** `src/utils/logger.js`
- **API Response:** `src/utils/apiResponse.js`
- **Error Middleware:** `src/middleware/errorHandler.js`
- **Request Logger:** `src/middleware/requestLogger.js`
- **Logs:** `logs/` directory

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Verify logs directory is created: `mkdir -p logs`
3. ✅ Update controllers to use new error classes and response formatters
4. ✅ Test error scenarios with curl or Postman
5. ✅ Monitor logs during development: `tail -f logs/combined.log`

---

## Support

For issues or questions:
1. Check log files in `logs/` directory
2. Review this guide's troubleshooting section
3. Verify Winston is installed: `npm list winston`
4. Check Morgan is installed: `npm list morgan`
