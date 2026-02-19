# 🔒 Security Quick Reference

## Installation (2 Minutes)

```bash
cd Server
npm install
cp .env.example .env
npm start
```

---

## Key Security Features Enabled

✅ **Helmet.js** - HTTP headers hardened  
✅ **Rate Limiting** - Protected endpoints  
✅ **Input Sanitization** - XSS prevention  
✅ **Injection Prevention** - MongoDB/SQL prevention  
✅ **CORS Security** - Configuration enhanced  
✅ **File Upload Security** - Multi-layer validation  

---

## Default Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/v1/auth/login` | 5 attempts / 15 min |
| `/api/v1/auth/register` | 5 attempts / 15 min |
| `/api/upload` | 50 uploads / hour |
| All other `/api/*` | 100 requests / 15 min |

---

## Environment Variables for Security

```env
# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# File Upload
MAX_FILE_SIZE=5242880
MAX_FILES_PER_UPLOAD=5

# Production
NODE_ENV=production
ENFORCE_HTTPS=true
HSTS_PRELOAD=true
```

---

## Security Headers Set (via Helmet)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## Input Sanitization Examples

### XSS Prevention ✅

```javascript
// ❌ Before
{ name: "<img src=x onerror='alert(1)'>" }

// ✅ After sanitization
{ name: "&lt;img src=x onerror='alert(1)'&gt;" }
```

### MongoDB Injection Prevention ✅

```javascript
// ❌ Blocked
{ email: { $ne: null }, password: "anything" }

// ✅ Allowed
{ email: "user@example.com", password: "securepass" }
```

### Path Traversal Prevention ✅

```javascript
// ❌ Blocked
GET /api/files/../../etc/passwd

// ✅ Allowed
GET /api/files/document.pdf
```

---

## File Upload Restrictions

### Allowed Extensions
- **Images:** jpg, jpeg, png, gif, webp, svg
- **Documents:** pdf, doc, docx, txt, xls, xlsx
- **Video:** mp4, avi, mov, webm
- **Audio:** mp3, wav, flac, m4a

### Blocked Extensions
exe, bat, cmd, sh, zip, rar, msi, dmg, app, deb, rpm

### Size Limits (Configurable)
- Images: 5MB
- Documents: 10MB
- Video: 100MB
- Audio: 20MB

---

## Test Commands

### Test Rate Limiting
```bash
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -d '{"email":"test@test.com","password":"pass"}'
done
# 6th request: 429 Too Many Requests
```

### Test XSS Prevention
```bash
curl -X POST http://localhost:5000/api/v1/products \
  -d '{"name":"<img src=x onerror=alert(1)>"}'
# Script tags removed/sanitized
```

### Test MongoDB Injection
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -d '{"email":{"$ne":null},"password":"test"}'
# 400 error - injection blocked
```

### Check Security Headers
```bash
curl -I http://localhost:5000/
# All Helmet headers present
```

---

## Using Rate Limiting in Code

```javascript
const { authLimiter, uploadLimiter } = require('../config/rateLimmiting');

// Apply to routes
router.post('/login', authLimiter, controller.login);
router.post('/upload', uploadLimiter, controller.upload);
```

---

## Using File Validation

```javascript
const { validateSingleFile } = require('../middleware/fileUploadSecurity');

router.post('/upload',
  multerUpload.single('image'),
  validateSingleFile('image'),  // Adds validation
  controller.upload
);
```

---

## Error Response Examples

### 429 - Rate Limited
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

### 400 - Injection Detected
```json
{
  "success": false,
  "message": "Invalid request format",
  "error": {
    "code": "INVALID_QUERY_OPERATOR",
    "details": "Invalid query operator: $ne"
  }
}
```

### 400 - File Upload Failed
```json
{
  "success": false,
  "message": "File validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      "File type .exe is not allowed",
      "File size exceeds maximum of 5MB"
    ]
  }
}
```

---

## Security Checklist

**Before Deployment:**
- [ ] Install all dependencies
- [ ] Set strong JWT secrets (32+ chars)
- [ ] Update CORS_ORIGIN to actual domain
- [ ] Set NODE_ENV=production
- [ ] Set ENFORCE_HTTPS=true
- [ ] Test rate limiting
- [ ] Test XSS prevention
- [ ] Test injection prevention
- [ ] Review file upload settings
- [ ] Configure firewall rules
- [ ] Enable SSL/TLS

**After Deployment:**
- [ ] Monitor rate limit logs
- [ ] Monitor injection attempts
- [ ] Check security headers
- [ ] Monitor file uploads
- [ ] Review error logs regularly
- [ ] Keep dependencies updated

---

## Key Files

| File | Purpose |
|------|---------|
| `src/config/helmet.js` | HTTP header security |
| `src/config/rateLimmiting.js` | Rate limiting |
| `src/middleware/security.js` | Input sanitization |
| `src/middleware/fileUploadSecurity.js` | File validation |

---

## Log Monitoring

```bash
# Rate limit violations
grep "Rate limit exceeded" logs/error.log

# Injection attempts
grep "injection" logs/error.log

# CORS errors
grep "CORS" logs/error.log

# File upload errors
grep "FILE_UPLOAD" logs/error.log

# All security logs
grep -E "injection|Rate limit|CORS" logs/error.log
```

---

## Dependencies Added

```
helmet@7.0.0                    - HTTP headers
express-rate-limit@6.7.0        - Rate limiting
express-mongo-sanitize@2.2.0    - NoSQL sanitization
xss-clean@0.1.1                 - XSS prevention
isomorphic-dompurify@1.8.0      - HTML sanitization
```

---

## Common Issues

**Rate limit too strict?**  
→ Increase `RATE_LIMIT_MAX_REQUESTS` in `.env`

**CORS errors?**  
→ Add your origin to `CORS_ORIGIN` in `.env`  
→ Separate multiple with commas

**File upload failing?**  
→ Check `MAX_FILE_SIZE` and allowed extensions  
→ Review logs for validation errors

**Getting injection errors?**  
→ Ensure you're not using MongoDB operators (`$ne`, `$gt`, etc.)  
→ Use plain values instead

---

## Production Checklist

```env
# .env for production
NODE_ENV=production
ENFORCE_HTTPS=true
HSTS_PRELOAD=true
HSTS_MAX_AGE=31536000
LOG_LEVEL=warn
RATE_LIMIT_MAX_REQUESTS=50
CORS_ORIGIN=https://app.example.com
```

---

## Need Help?

1. Check **SECURITY_BEST_PRACTICES_GUIDE.md** for detailed info
2. Review logs: `tail -f logs/error.log`
3. Run test commands above
4. Check environment variables: `env | grep -i security`

---

**Status:** ✅ Production Ready  
**Last Updated:** February 19, 2026
