# Authentication System Setup & Usage Guide

## Quick Start

### 1. Environment Setup

Create a `.env` file in the Server directory using `.env.example` as template:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/general_store

# JWT Configuration (generate secure random strings)
JWT_SECRET=your_super_secure_jwt_secret_key_min_32_chars_change_this
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_min_32_chars_change_this
JWT_REFRESH_EXPIRE=30d

# Frontend
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 2. Install Dependencies

```bash
cd Server
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# Windows (if installed)
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

Server will be available at: `http://localhost:5000`

---

## API Usage Examples

### Using cURL

#### 1. Register a User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone": "9876543210",
    "role": "customer"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439013",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

#### 3. Access Protected Route

```bash
# Replace with your actual access token
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 4. Refresh Token

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

### Using JavaScript/Fetch API

#### Complete Authentication Flow

```javascript
const API_URL = 'http://localhost:5000/api/v1';

// 1. Register
async function register() {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '9876543210',
      role: 'customer'
    })
  });
  const data = await response.json();
  return data;
}

// 2. Login
async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  if (data.success) {
    // Store tokens (securely in production)
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }
  return data;
}

// 3. Make Authenticated Request
async function getProfile() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// 4. Refresh Token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
  }
  return data;
}

// 5. Logout
async function logout() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Clear tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  return await response.json();
}
```

---

## Using Authentication in Routes

### Example Controller with Authentication

```javascript
// src/controllers/productController.js
const { Product } = require('../models');

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('shopId');
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createProduct = async (req, res) => {
  try {
    // req.user contains decoded token info { userId, role }
    const shopId = req.body.shopId;
    
    // Check if user is shop owner (optional)
    // const shop = await Shop.findById(shopId);
    // if (shop.ownerId !== req.user.userId) {
    //   return res.status(403).json({ success: false });
    // }
    
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getAllProducts, createProduct };
```

### Example Routes with Protection

```javascript
// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const productController = require('../controllers/productController');

// Public route
router.get('/products', productController.getAllProducts);

// Protected route (authenticated users only)
router.post(
  '/products',
  verifyToken,
  productController.createProduct
);

// Admin only route
router.delete(
  '/products/:id',
  verifyToken,
  authorize('admin'),
  productController.deleteProduct
);

// Multiple roles
router.put(
  '/products/:id',
  verifyToken,
  authorize('admin', 'customer'),
  productController.updateProduct
);

module.exports = router;
```

---

## Common Scenarios

### Scenario 1: New User Registration & First Login

```javascript
// Step 1: Register
const registerResult = await register();
// Returns: { accessToken, refreshToken, userId }

// Step 2: Store tokens
localStorage.setItem('accessToken', registerResult.data.accessToken);
localStorage.setItem('refreshToken', registerResult.data.refreshToken);

// Step 3: Access protected routes
const profile = await getProfile(); // Already logged in
```

### Scenario 2: Token Expiration Handling

```javascript
async function makeAuthenticatedRequest(url) {
  let token = localStorage.getItem('accessToken');
  
  let response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // If token expired (401)
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed.success) {
      token = refreshed.data.accessToken;
      // Retry request with new token
      response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  }
  
  return response.json();
}
```

### Scenario 3: Role-Based Operations

```javascript
// Admin creating another admin
async function createAdmin() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      phone: '9876543210',
      role: 'admin'
    })
  });
  return await response.json();
}
```

---

## Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `postman-collection.json`
4. Collection will have all endpoints pre-configured

### Set Environment Variables

1. Create new environment
2. Add variables:
   - `base_url`: `http://localhost:5000/api/v1`
   - `accessToken`: (auto-populated by tests)
   - `refreshToken`: (auto-populated by tests)

### Run Tests

1. Login endpoint (auto-saves tokens)
2. Use other endpoints with auto-populated tokens

---

## Security Considerations

### Do's ✅

- Store tokens securely (httpOnly cookies in production)
- Use HTTPS in production
- Rotate refresh tokens periodically
- Validate all input server-side
- Keep JWT_SECRET secure
- Set appropriate token expiry times
- Log security events

### Don'ts ❌

- Don't expose JWT_SECRET in client code
- Don't store sensitive data in token payload
- Don't send tokens in URLs
- Don't ignore token validation errors
- Don't use weak passwords
- Don't store tokens in localStorage for sensitive apps

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Invalid token" | Ensure Bearer prefix, token not expired |
| "Token not found" | Include Authorization header |
| "Email already registered" | Use unique email or login |
| "Invalid credentials" | Check email/password, ensure account active |
| "Access denied" | Verify user has required role |
| "MongoDB connection failed" | Ensure MongoDB is running |
| "CORS error" | Check CORS_ORIGIN in .env |

---

## Next Steps

1. ✅ Authentication system ready
2. Create product routes and controllers
3. Create shop management endpoints
4. Create order management endpoints
5. Implement order processing logic
6. Add comprehensive error handling
7. Set up API documentation (Swagger/OpenAPI)
8. Implement logging and monitoring
9. Set up rate limiting
10. Deploy to production

---

## Production Checklist

- [ ] Change JWT_SECRET to secure random value
- [ ] Change JWT_REFRESH_SECRET to secure random value
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Use httpOnly, Secure cookies for tokens
- [ ] Enable rate limiting
- [ ] Set up logging service
- [ ] Configure email service for password reset
- [ ] Enable request validation
- [ ] Set up monitoring and alerts
