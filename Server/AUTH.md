# JWT Authentication System Documentation

## Overview

This document outlines the JWT-based authentication system implemented for the General Store backend API.

---

## Features

✅ **User Registration** - Register new users with email, password, and profile information
✅ **User Login** - Authenticate users and issue JWT tokens
✅ **JWT Access Tokens** - Short-lived tokens for API authentication
✅ **Refresh Tokens** - Long-lived tokens for obtaining new access tokens
✅ **Password Reset** - Secure password reset mechanism with email verification
✅ **Role-Based Access Control** - Admin and customer role support
✅ **Token Verification** - Middleware to verify JWT tokens
✅ **Logout** - Clear user sessions and refresh tokens

---

## Token Types

### Access Token
- **Lifetime**: 7 days (configurable via `JWT_EXPIRE`)
- **Secret**: `JWT_SECRET`
- **Usage**: Include in Authorization header for API requests
- **Claims**: `userId`, `role`, `exp`

### Refresh Token
- **Lifetime**: 30 days (configurable via `JWT_REFRESH_EXPIRE`)
- **Secret**: `JWT_REFRESH_SECRET`
- **Usage**: Exchange for new access token
- **Claims**: `userId`, `exp`
- **Storage**: Stored in database for token rotation

### Reset Token
- **Lifetime**: 1 hour
- **Secret**: `JWT_SECRET`
- **Usage**: Reset password functionality
- **Claims**: `email`, `exp`

---

## API Endpoints

### 1. Register User
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "customer"  // optional, defaults to "customer"
}

Response (201 Created):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439013",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Login User
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "507f1f77bcf86cd799439013",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Refresh Access Token
```
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response (200 OK):
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

### 4. Request Password Reset
```
POST /api/v1/auth/request-password-reset
Content-Type: application/json

{
  "email": "john@example.com"
}

Response (200 OK):
{
  "success": true,
  "message": "If email exists, password reset link will be sent"
}
```

### 5. Reset Password
```
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "eyJhbGc...",
  "newPassword": "newpassword123"
}

Response (200 OK):
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 6. Logout
```
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGc...

Response (200 OK):
{
  "success": true,
  "message": "Logout successful"
}
```

### 7. Get Current User Profile
```
GET /api/v1/auth/me
Authorization: Bearer eyJhbGc...

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "User profile retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "phone": "9876543210",
    "isActive": true,
    "createdAt": "2026-02-19T10:00:00Z",
    "updatedAt": "2026-02-19T10:00:00Z"
  }
}
```

---

## Middleware Usage

### JWT Token Verification
```javascript
const verifyToken = require('../middleware/auth');

router.get('/protected-route', verifyToken, controller);
```

### Role-Based Access Control
```javascript
const verifyToken = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.post('/admin-only', verifyToken, authorize('admin'), controller);

// Multiple roles
router.get('/data', verifyToken, authorize('admin', 'customer'), controller);
```

---

## Token Usage in Requests

### Include Authorization Header
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:5000/api/v1/auth/me
```

### Token Format
```
Authorization: Bearer <access_token>
```

---

## Error Responses

### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Expired Token (401)
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Access Denied (403)
```json
{
  "success": false,
  "message": "Access denied. Required role(s): admin"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Error",
  "errors": ["Email is required", "Password must be at least 6 characters"]
}
```

---

## Security Best Practices

1. **Environment Variables**: Store `JWT_SECRET` and `JWT_REFRESH_SECRET` securely
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Storage**: Store tokens securely on client side
4. **Password Hashing**: Passwords are automatically hashed with bcryptjs
5. **Token Rotation**: Refresh tokens are stored and validated
6. **Short Token Lifetime**: Access tokens expire after 7 days
7. **Reset Token Expiry**: Password reset tokens expire after 1 hour

---

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_min_32_chars
JWT_REFRESH_EXPIRE=30d

# Frontend URL for password reset links
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@generalstore.com
```

---

## User Schema Fields (Auth-Related)

- `refreshToken` - Stores current refresh token
- `passwordResetToken` - Temporary token for password reset
- `passwordResetExpires` - Expiry time for reset token
- `lastLogin` - Track when user last logged in
- `isActive` - Account status

---

## Implementation Details

### Password Hashing
- Uses bcryptjs with salt rounds of 10
- Passwords are hashed before saving to database
- Comparison method available: `user.comparePassword(passwordInput)`

### Token Generation
- Uses symmetric encryption (HS256)
- Tokens are signed with secret keys
- Payload includes `userId` and `role`

### Database Integration
- User schema extended with token fields
- Refresh tokens stored in database for validation
- Password reset tokens tracked with expiry

---

## Example Usage Flow

1. **User Registration**
   ```
   POST /register → Get accessToken & refreshToken
   ```

2. **Access Protected Route**
   ```
   GET /protected → Header: Authorization: Bearer accessToken
   ```

3. **Token Expired**
   ```
   POST /refresh-token → Get new accessToken
   ```

4. **Password Reset Flow**
   ```
   POST /request-password-reset → Email sent with reset link
   Click link → POST /reset-password with token → Password updated
   ```

5. **Logout**
   ```
   POST /logout → Refresh token cleared
   ```

---

## Email Integration

The system includes support for sending password reset emails. Currently, it logs to console. To enable email sending:

1. Install nodemailer: `npm install nodemailer`
2. Configure email service in `.env`
3. Uncomment email sending code in `src/utils/emailService.js`

Supported services: Gmail, SendGrid, AWS SES, etc.

---

## Testing the Authentication

### Using cURL
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123","phone":"9876543210"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'

# Get Profile (replace token)
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman
1. Import the API collection
2. Set variables for tokens
3. Use Bearer token in Authorization tab
4. Test endpoints sequentially

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid token" | Ensure token is not expired, include Bearer prefix |
| "Token verification failed" | Check JWT_SECRET matches, token not tampered |
| "Email already registered" | Use unique email or login instead |
| "Access denied" | Verify user has required role |
| "Invalid credentials" | Check email and password, ensure account is active |

---

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Session management dashboard
- [ ] Device tracking for logins
- [ ] Suspicious activity alerts
- [ ] Password complexity validation
- [ ] Account lockout after failed attempts
- [ ] Email verification on registration
