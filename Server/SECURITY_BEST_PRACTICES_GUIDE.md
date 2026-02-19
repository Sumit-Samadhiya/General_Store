# 🔒 Security Best Practices Implementation Guide

## Overview

A comprehensive security layer has been implemented for the General Store API with:

- ✅ **Helmet.js** - Secure HTTP headers
- ✅ **Rate Limiting** - Prevent brute force and DoS attacks
- ✅ **Input Sanitization** - XSS prevention
- ✅ **Injection Prevention** - MongoDB and SQL injection prevention
- ✅ **CORS Security** - Enhanced CORS configuration
- ✅ **File Upload Security** - Comprehensive file validation
- ✅ **Request Validation** - Joi schema validation

---

## 📦 What Was Implemented

### 1. Helmet.js Configuration (src/config/helmet.js)

**HTTP Headers Secured:**
- Content Security Policy (CSP) - Prevents XSS, clickjacking
- Strict-Transport-Security (HSTS) - Enforces HTTPS
- X-Content-Type-Options - Prevents MIME sniffing
- X-Frame-Options - Prevents clickjacking
- X-XSS-Protection - Additional XSS protection
- Referrer-Policy - Controls referrer information
- Permissions-Policy - Restricts browser features
- Cross-Origin Policies - Resource sharing controls

### 2. Rate Limiting (src/config/rateLimmiting.js)

**Rate Limiters Configured:**

| Limiter | Window | Limit | Purpose |
|---------|--------|-------|---------|
| `apiLimiter` | 15 min | 100 req | General API requests |
| `authLimiter` | 15 min | 5 req | Auth attempts (login/register) |
| `passwordResetLimiter` | 1 hour | 3 req | Password reset abuse prevention |
| `uploadLimiter` | 1 hour | 50 req | File upload abuse prevention |
| `searchLimiter` | 1 min | 30 req | Search query abuse prevention |

### 3. Security Middleware (src/middleware/security.js)

**Security Features:**
- Input sanitization using DOMPurify
- MongoDB injection prevention
- XSS attack prevention
- Query operator injection prevention
- SQL injection pattern detection
- Path traversal attack prevention
- Parameter pollution detection
- Email and URL validation

### 4. File Upload Security (src/middleware/fileUploadSecurity.js)

**Validations:**
- File extension whitelist
- MIME type verification
- File size limits
- Dangerous file detection
- Double extension prevention
- Null byte injection prevention
- Path traversal prevention
- Suspicious filename detection

### 5. Updated Server Integration (src/server.js)

**Middleware Order (Important):**
1. Helmet - Security headers
2. Rate Limiting - Protect against abuse
3. Request Logging - Monitor traffic
4. Body Parsing - Parse requests
5. Injection Prevention - Prevent attacks
6. CORS - Cross-origin requests
7. Routes - Business logic
8. Error Handling - Error responses

---

## 🚀 Quick Start

### 1. Install Security Dependencies

```bash
cd Server
npm install
```

**New packages installed:**
- `helmet@7.0.0` - HTTP headers security
- `express-rate-limit@6.7.0` - Rate limiting
- `express-mongo-sanitize@2.2.0` - MongoDB injection prevention
- `xss-clean@0.1.1` - XSS prevention
- `isomorphic-dompurify@1.8.0` - HTML sanitization

### 2. Update Environment Variables

Copy and update `.env`:

```bash
cp .env.example .env
```

Key security variables:
```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max per window

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
MAX_FILES_PER_UPLOAD=5

# Security Headers
ENFORCE_HTTPS=false  # true in production
HSTS_MAX_AGE=31536000  # 1 year
```

### 3. Start the Server

```bash
npm start
```

Expected output:
```
===================================
🚀 Server started successfully
Port: 5000
Environment: development
API Version: v1
Security: Helmet, Rate Limiting, CORS Enabled
===================================
```

---

## 🔐 Security Features Explained

### 1. Helmet.js - HTTP Headers

**What it protects:**
- XSS attacks via Content-Security-Policy
- Clickjacking via X-Frame-Options
- MIME sniffing via X-Content-Type-Options
- Information disclosure via header removal

**Headers set:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 2. Rate Limiting - DoS & Brute Force Prevention

**Authentication Endpoint (Stricter Limits):**
```
POST /api/v1/auth/login    → 5 attempts per 15 minutes
POST /api/v1/auth/register → 5 attempts per 15 minutes
```

**General API Endpoints:**
```
All /api endpoints → 100 requests per 15 minutes
```

**Example Error Response:**
```json
{
  "success": false,
  "message": "Too many requests from this IP",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "details": "Please try again after some time"
  }
}
```

### 3. Input Sanitization - XSS Prevention

**What it removes:**
- HTML tags and scripts
- JavaScript event handlers
- Malicious DOM content

**Example:**
```javascript
// Input
{ name: "<img src=x onerror='alert(1)'>" }

// After sanitization
{ name: "&lt;img src=x onerror='alert(1)'&gt;" }
```

### 4. MongoDB Injection Prevention

**Prevents:**
```javascript
// Attack: Query operator injection
{ email: { $ne: null } }

// Blocked by preventMongoInjection middleware
// Only allows sanitized values
```

**Detection & Logging:**
```
[warn]: Potential MongoDB injection attempt detected
  - key: "email"
  - path: "/api/v1/auth/login"
  - ip: "192.168.1.100"
```

### 5. SQL Injection Prevention

**Detects patterns like:**
- `SELECT * FROM users WHERE ...`
- `UNION ... OR ...`
- `DROP TABLE ...`
- `<script>alert()</script>`

**Blocks** if multiple SQL keywords detected in a single input.

### 6. Path Traversal Prevention

**Prevents:**
```
../../etc/passwd
..\..\windows\system32
```

**Detected in:**
- URL parameters
- Query strings
- Request body

### 7. CORS Security

**Enhanced Configuration:**
```javascript
{
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400  // 24 hours
}
```

**Multiple Origins Support:**
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://app.example.com
```

### 8. File Upload Security

**Multi-layer Validation:**

| Check | Details |
|-------|---------|
| Extension | Whitelist: jpg, png, gif, pdf, doc, etc. |
| MIME Type | Verify actual file type matches extension |
| File Size | 5MB default, configurable per type |
| Filename | Remove traversal, special chars |
| Dangerous Files | Block: exe, bat, sh, zip, etc. |
| Double Extensions | Prevent: file.exe.jpg |
| Null Bytes | Prevent null injection |
| Content Scan | Basic malware pattern detection |

**Example Validation:**
```javascript
const result = validateFile(file, 'image');
if (!result.valid) {
  // errors: ["File type .exe is not allowed", ...]
}
```

---

## 📝 Usage Examples

### Using Rate Limiting in Routes

```javascript
const { authLimiter, uploadLimiter } = require('../config/rateLimmiting');

// Apply to specific routes
router.post('/login', authLimiter, loginController.login);
router.post('/register', authLimiter, loginController.register);
router.post('/upload', uploadLimiter, uploadController.upload);
```

### Validating File Uploads

```javascript
const { validateSingleFile, validateMultipleFiles } = require('../middleware/fileUploadSecurity');

// Single file
router.post('/upload',
  uploadLimiter,
  multerUpload.single('image'),
  validateSingleFile('image'),
  uploadController.uploadImage
);

// Multiple files
router.post('/upload-batch',
  uploadLimiter,
  multerUpload.array('images', 5),
  validateMultipleFiles('image', 5),
  uploadController.uploadImages
);
```

### Using Custom Validators

```javascript
const { validateEmail, validateUrl } = require('../middleware/security');

// In controller
if (!validateEmail(req.body.email)) {
  throw new ValidationError('Invalid email format');
}

if (req.body.website && !validateUrl(req.body.website)) {
  throw new ValidationError('Invalid URL');
}
```

### Handling File Upload Errors

```javascript
const express = require('express');
const multer = require('multer');
const { handleRateLimitError } = require('../middleware/security');

// Multer error handling
app.post('/upload', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: { code: 'FILE_UPLOAD_ERROR' }
    });
  }
});
```

---

## 🛡️ Security Checklist

### Development Setup

- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Configure JWT secrets (at least 32 characters)
- [ ] Set `CORS_ORIGIN` to your frontend URL
- [ ] Start server: `npm start`
- [ ] Test health endpoint: `curl http://localhost:5000/health`

### Before Production

- [ ] Set `NODE_ENV=production`
- [ ] Set `ENFORCE_HTTPS=true`
- [ ] Update `CORS_ORIGIN` to actual domain
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HSTS preload: `HSTS_PRELOAD=true`
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Enable database authentication
- [ ] Configure log retention
- [ ] Set up monitoring/alerting
- [ ] Review rate limit settings
- [ ] Test CORS from actual domain
- [ ] Verify file upload restrictions
- [ ] Enable malware scanning (if needed)

### Ongoing Monitoring

- [ ] Monitor rate limit violations: `grep "Rate limit exceeded" logs/error.log`
- [ ] Monitor injection attempts: `grep "injection" logs/error.log`
- [ ] Monitor CORS errors: `grep "CORS" logs/error.log`
- [ ] Monitor file upload errors: `grep "FILE_UPLOAD" logs/error.log`
- [ ] Regular security updates: `npm audit`

---

## 🧪 Testing Security

### Test Rate Limiting

```bash
# Make 6 quick requests (limit is 5)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"pass"}'
done

# 6th request should return 429 (Too Many Requests)
```

### Test XSS Prevention

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"name":"<img src=x onerror=\"alert(1)\">"}'

# Should sanitize and remove script
```

### Test MongoDB Injection

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":"anything"}'

# Should block with 400 error
```

### Test Path Traversal

```bash
curl http://localhost:5000/api/v1/files/../../etc/passwd

# Should return 400 error
```

### Test File Upload Security

```bash
# Try to upload .exe file
curl -X POST http://localhost:5000/api/upload \
  -F "image=@malicious.exe"

# Should block with error message
```

### Test CORS

```bash
curl -X OPTIONS http://localhost:5000/api/v1/products \
  -H "Origin: http://unauthorized.com" \
  -H "Access-Control-Request-Method: GET"

# Should reject from unauthorized origin
```

---

## 📊 Security Headers Verification

Check your security headers:

```bash
# Using curl
curl -I http://localhost:5000/

# Check Strict-Transport-Security
curl -I http://localhost:5000/ | grep "Strict-Transport-Security"

# Check X-Frame-Options
curl -I http://localhost:5000/ | grep "X-Frame-Options"

# Check CSP
curl -I http://localhost:5000/ | grep "Content-Security-Policy"
```

**Expected headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 📋 Rate Limit Configuration

### Default Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 req | 15 min |
| Authentication | 5 req | 15 min |
| Password Reset | 3 req | 1 hour |
| File Upload | 50 req | 1 hour |
| Search | 30 req | 1 min |

### Customize Limits

In `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_UPLOAD_MAX=50
```

Or in code:
```javascript
const { createCustomLimiter } = require('../config/rateLimmiting');

const customLimiter = createCustomLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 20,              // 20 requests
  name: 'Custom'
});

router.get('/custom', customLimiter, handler);
```

---

## 🐛 Troubleshooting

### Issue: Rate limit too strict

**Solution:**
Adjust `RATE_LIMIT_MAX_REQUESTS` in `.env` or increase `RATE_LIMIT_WINDOW_MS`.

### Issue: CORS errors

**Solution:**
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

Verify origin is in the list. Check browser console for actual origin being sent.

### Issue: File upload always fails

**Solution:**
Check logs for validation errors:
```bash
grep "File validation failed" logs/error.log
```

Ensure file is:
- Correct type (jpg, png, etc.)
- Under size limit (5MB default)
- Not a dangerous file type

### Issue: Getting injection prevention errors

**Solution:**
Check you're not using MongoDB operators in user input:

```javascript
// ❌ Wrong
{ email: { $ne: null } }

// ✅ Right
{ email: "user@example.com" }
```

---

## 📚 File Locations

| File | Purpose |
|------|---------|
| `src/config/helmet.js` | Helmet configuration |
| `src/config/rateLimmiting.js` | Rate limiting setup |
| `src/middleware/security.js` | Security middleware |
| `src/middleware/fileUploadSecurity.js` | File upload validation |
| `src/server.js` | Server with security integration |
| `.env.example` | Security configuration template |

---

## 🔗 External Resources

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limiting](https://github.com/nfriedly/express-rate-limit)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [MongoDB Injection Prevention](https://owasp.org/www-community/attacks/NoSQL_Injection)

---

## ✅ Security Best Practices Applied

1. **Defense in Depth** - Multiple layers of security
2. **White-listing** - Only allow known-good file types
3. **Input Validation** - Validate all user input
4. **Output Encoding** - Sanitize output
5. **Least Privilege** - Minimal CORS, specific auth limits
6. **Logging & Monitoring** - All security events logged
7. **Fail Secure** - Errors don't reveal information
8. **Regular Updates** - Keep dependencies updated

---

## 📞 Support

For security issues:
1. Check logs: `tail -f logs/error.log`
2. Review relevant middleware
3. Test with curl commands provided
4. Check environment configuration

---

**Status:** ✅ Production Ready  
**Last Updated:** February 19, 2026
