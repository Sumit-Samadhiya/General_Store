# Error Handling Quick Reference

## Installation

```bash
cd Server
npm install
```

This installs Winston and Morgan (already added to package.json).

---

## One-Line Error Summaries

### Custom Errors
```javascript
const {
  ValidationError,          // 400 - Input validation fails
  AuthenticationError,      // 401 - Auth fails
  AuthorizationError,      // 403 - No permission
  NotFoundError,           // 404 - Resource missing
  ConflictError,           // 409 - Duplicate resource
  RateLimitError,          // 429 - Too many requests
  BusinessLogicError,      // 422 - Business logic fails
  DatabaseError,           // 500 - DB operation fails
  ExternalServiceError,    // 502 - External API fails
  ServiceUnavailableError  // 503 - Service down
} = require('../utils/customErrors');
```

### API Response Methods
```javascript
const ApiResponse = require('../utils/apiResponse');

ApiResponse.success(res, 200, 'Message', data);           // ✅ Success
ApiResponse.created(res, 'Message', data);               // ✅ Created (201)
ApiResponse.paginated(res, 200, 'Msg', data, total, p, l); // ✅ Paginated
ApiResponse.validationError(res, 'Msg', errors);         // ❌ 400
ApiResponse.unauthorized(res, 'Msg');                    // ❌ 401
ApiResponse.forbidden(res, 'Msg');                       // ❌ 403
ApiResponse.notFound(res, 'Resource');                   // ❌ 404
ApiResponse.conflict(res, 'Msg');                        // ❌ 409
ApiResponse.serverError(res, 'Msg');                     // ❌ 500
```

### Logger
```javascript
const { log } = require('../utils/logger');

log.info('Message', meta);
log.warn('Warning', meta);
log.error('Error', error, meta);
log.debug('Debug', meta);
log.http('GET', '/api/users', 200, 45);
log.database('find', 'users', 30, true);
log.auth('login', 'user@email.com', true);
```

---

## Controller Template

```javascript
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError } = require('../utils/customErrors');
const ApiResponse = require('../utils/apiResponse');
const { log } = require('../utils/logger');

// ✅ Wrap with asyncHandler - automatic error catching
exports.getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Throw specific errors
  if (!id) {
    throw new ValidationError('User ID is required', [
      { field: 'id', message: 'ID must be provided' }
    ]);
  }

  const user = await User.findById(id);

  // ✅ Use appropriate error for missing resource
  if (!user) {
    throw new NotFoundError('User');
  }

  // ✅ Log operation
  log.info('User retrieved', { userId: id });

  // ✅ Use correct response method
  ApiResponse.success(res, 200, 'User retrieved successfully', user);
});
```

---

## Status Code Quick Map

| Code | Error Class | Response Method |
|------|-------------|-----------------|
| 200 | ✅ Success | `ApiResponse.success()` |
| 201 | ✅ Created | `ApiResponse.created()` |
| 204 | ✅ No Content | `ApiResponse.noContent()` |
| 400 | ValidationError | `ApiResponse.validationError()` |
| 401 | AuthenticationError | `ApiResponse.unauthorized()` |
| 403 | AuthorizationError | `ApiResponse.forbidden()` |
| 404 | NotFoundError | `ApiResponse.notFound()` |
| 409 | ConflictError | `ApiResponse.conflict()` |
| 429 | RateLimitError | `ApiResponse.rateLimited()` |
| 422 | BusinessLogicError | `ApiResponse.error()` |
| 500 | DatabaseError | `ApiResponse.serverError()` |
| 502 | ExternalServiceError | `ApiResponse.error()` |
| 503 | ServiceUnavailableError | `ApiResponse.serviceUnavailable()` |

---

## Common Patterns

### Input Validation
```javascript
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    throw new ValidationError('Missing required fields', [
      { field: 'name', message: 'Name is required' },
      { field: 'price', message: 'Price is required' }
    ]);
  }

  const product = await Product.create({ name, price });
  ApiResponse.created(res, 'Product created', product);
});
```

### Check Resource Exists
```javascript
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new NotFoundError('Product');
  }

  const updated = await product.updateOne(req.body);
  ApiResponse.success(res, 200, 'Product updated', updated);
});
```

### Check Duplicate
```javascript
exports.registerUser = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });

  if (existing) {
    throw new ConflictError(`Email already in use`);
  }

  const user = await User.create(req.body);
  ApiResponse.created(res, 'User registered', user);
});
```

### Check Permission
```javascript
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    throw new AuthorizationError('Cannot delete other users');
  }

  await User.findByIdAndDelete(req.params.id);
  ApiResponse.noContent(res);
});
```

### Paginated List
```javascript
exports.listProducts = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  const products = await Product.find()
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments();

  ApiResponse.paginated(res, 200, 'Products retrieved', products, total, page, limit);
});
```

---

## Log Files

All logs saved to `logs/` directory:

```bash
# View error logs
tail -f logs/error.log

# View all logs
tail -f logs/combined.log

# View request logs
tail -f logs/http.log

# Search for specific error
grep "ValidationError" logs/error.log
```

---

## Error Response Examples

### 400 Validation Error
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Missing required fields",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "errors": [
        { "field": "email", "message": "Email is required" },
        { "field": "password", "message": "Password must be 8+ characters" }
      ]
    }
  },
  "timestamp": "2026-02-19T12:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "error": {
    "code": "NOT_FOUND"
  },
  "timestamp": "2026-02-19T12:00:00.000Z",
  "path": "/api/v1/users/123"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": {
    "code": "AUTHENTICATION_ERROR"
  },
  "timestamp": "2026-02-19T12:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

### 500 Server Error
```json
{
  "success": false,
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": {
    "code": "INTERNAL_SERVER_ERROR"
  },
  "timestamp": "2026-02-19T12:00:00.000Z",
  "path": "/api/v1/products"
}
```

---

## Testing Errors with curl

### Test validation error
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{}' # Missing required fields
```

### Test not found
```bash
curl http://localhost:5000/api/v1/users/invalid-id
```

### Test unauthorized
```bash
curl http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer invalid-token"
```

---

## Environment Variables

```env
# Logging
LOG_LEVEL=info              # error, warn, info, debug
NODE_ENV=development        # development, production

# Server
PORT=5000
API_VERSION=v1
```

---

## Checklist: Update Your Controllers

- [ ] Import `asyncHandler` from error middleware
- [ ] Import error classes from `customErrors`
- [ ] Import `ApiResponse` from utils
- [ ] Wrap handler with `asyncHandler(...)`
- [ ] Replace `throw new Error()` with specific error classes
- [ ] Replace `res.json()` with `ApiResponse.*()`
- [ ] Add logging with `log.info()`, `log.error()`, etc.
- [ ] Test error scenarios

---

## Common Mistakes to Avoid

❌ **Wrong: Using generic Error**
```javascript
throw new Error('Something went wrong');
```

✅ **Right: Using specific error class**
```javascript
throw new NotFoundError('Product');
```

---

❌ **Wrong: Not wrapping with asyncHandler**
```javascript
exports.getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id); // Error not caught!
};
```

✅ **Right: Using asyncHandler**
```javascript
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id); // Errors automatically caught
});
```

---

❌ **Wrong: Generic response**
```javascript
res.json({ data: user });
```

✅ **Right: Structured response**
```javascript
ApiResponse.success(res, 200, 'User retrieved', user);
```

---

## All Imports Reference

```javascript
// From customErrors
const {
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
} = require('../utils/customErrors');

// From apiResponse
const ApiResponse = require('../utils/apiResponse');

// From logger
const { log, logger, httpLogger } = require('../utils/logger');

// From errorHandler
const { errorHandler, notFoundHandler, asyncHandler } = require('../middleware/errorHandler');

// From requestLogger
const { requestLogger, morgan } = require('../middleware/requestLogger');
```

---

## Questions?

1. Read [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) for detailed documentation
2. Check logs in `logs/` directory
3. Review example implementations in existing controllers
4. Test with curl/Postman before deployment
