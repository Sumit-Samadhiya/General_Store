# Testing Environment Setup Guide

## Overview
This guide shows how to set up and use the Admin Product Management API for testing with different tools.

---

## Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `base_url` | API server endpoint | `http://localhost:5000/api/v1` |
| `access_token` | JWT authentication token | `eyJhbGciOiJIUzI1NiIs...` |
| `refresh_token` | Token for refreshing access | `eyJhbGciOiJIUzI1NiIs...` |
| `product_id` | Single product MongoDB ID | `60d5ec49c1234567890abcde` |
| `product_id_1` | First product for bulk ops | `60d5ec49c1234567890abcde` |
| `product_id_2` | Second product for bulk ops | `60d5ec50c1234567890abcdf` |
| `shop_id` | Shop/Store MongoDB ID | `60d5ec42c1234567890abcdc` |

---

## Setup Steps

### 1. Start the Server
```bash
cd d:\General_Store\Server
npm install
node src/server.js
# Or with nodemon:
npm run dev
```

### 2. Check Server is Running
```bash
curl http://localhost:5000/api/v1/admin/products
# Should see: "No token provided" error (expected, means server is running)
```

### 3. Register an Admin User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "Admin@123456",
    "phone": "+1234567890"
  }'
```

Save the response tokens:
- `access_token`: Use this in Authorization header
- `refresh_token`: Use this to get new access tokens

### 4. Get Tokens from Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123456"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 5. Create a Shop (if needed)
Before creating products, you may need a shop. Contact admin or create via shop endpoints.

Get shop ID from:
```bash
# Shop ID should be created first
# For testing, use any valid MongoDB ObjectId
SHOP_ID="60d5ec42c1234567890abcdc"
```

---

## Testing with cURL

### Basic Pattern
```bash
# Replace variables
TOKEN="your_access_token_here"
PRODUCT_ID="product_id_from_response"
SHOP_ID="your_shop_id_here"

# Create product
curl -X POST http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "Test description",
    "category": "test",
    "price": 1000,
    "stock": 10,
    "shopId": "'$SHOP_ID'"
  }'
```

### Extract Values
```bash
# Get token from login response
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
echo "Token: $TOKEN"

# Get product ID from create response
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Product","description":"Desc","category":"cat","price":100,"stock":5,"shopId":"..."}')

PRODUCT_ID=$(echo $CREATE_RESPONSE | jq -r '.data._id')
echo "Product ID: $PRODUCT_ID"
```

---

## Testing with Postman

### Setup Collection
1. Open Postman
2. Click **Import**
3. Select **Upload Files** and choose `postman-admin-products-collection.json`
4. Click **Import**

### Set Variables
Go to **Collections** → **Variables tab** → Set values:

| Variable | Value | Notes |
|----------|-------|-------|
| base_url | http://localhost:5000/api/v1 | Keep as is |
| access_token | [paste from login response] | Update after each login |
| refresh_token | [paste from login response] | Update after each login |
| product_id | [from create response] | Update after creating product |
| product_id_1 | [from create response] | Update before bulk operations |
| product_id_2 | [from create response] | Update before bulk operations |
| shop_id | [from shop creation] | Update before creating products |

### Run Requests
1. First: **Authentication** → **Login** - Get tokens
2. Copy `accessToken` from response
3. Set in **Variables** → `access_token`
4. Now run **Products** requests

---

## Testing with Node.js

### Create Test Script
```javascript
// test-api.js
const axios = require('axios');

const API = 'http://localhost:5000/api/v1';
let token = '';

async function test() {
  try {
    // 1. Login
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin@123456'
    });
    token = loginRes.data.data.accessToken;
    console.log('✅ Login successful');

    // 2. Create product
    const prodRes = await axios.post(`${API}/admin/products`, {
      name: 'Test Product',
      description: 'Test',
      category: 'test',
      price: 1000,
      stock: 50,
      shopId: 'SHOP_ID'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Product created:', prodRes.data.data._id);

    // 3. Get products
    const listRes = await axios.get(`${API}/admin/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Products retrieved:', listRes.data.data.length);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
```

Run:
```bash
node test-api.js
```

---

## Testing Workflow

### Scenario 1: Basic CRUD
```
1. Register/Login → Get token
2. Create product → Get product_id
3. Get products → View all
4. Get single product → View details
5. Update product → Modify details
6. Delete product → Soft delete
```

### Scenario 2: Search & Filter
```
1. Create 5+ products (different categories/prices)
2. Search by name: ?search=keyword
3. Filter by category: ?category=electronics
4. Filter by price: ?minPrice=1000&maxPrice=5000
5. Combine: ?search=laptop&category=electronics&minPrice=50000
```

### Scenario 3: Stock Management
```
1. Create product with stock=100
2. Update stock to 50: PATCH /admin/products/{id}/stock
3. Verify: GET /admin/products/{id}
4. Update to 0 (out of stock)
5. Check isAvailable becomes false
```

### Scenario 4: Bulk Operations
```
1. Create 3 products → Save IDs
2. Bulk update prices: PATCH /admin/products/bulk/update
3. Verify each product: GET /admin/products/{id}
4. Get stats: GET /admin/products/stats/overview
```

### Scenario 5: Analytics
```
1. Create products in different categories
2. Get stats: GET /admin/products/stats/overview
3. Check: totalCount, avgPrice, byCategory breakdown
4. Verify aggregations match manual calculations
```

---

## Troubleshooting

### "No token provided"
```bash
✗ Problem: Authorization header missing
✓ Fix: Add -H "Authorization: Bearer TOKEN"
```

### "Invalid token"
```bash
✗ Problem: Token expired or corrupted
✓ Fix: Login again to get fresh token
```

### "Product not found"
```bash
✗ Problem: Wrong product ID
✓ Fix: Create product first, copy ID from response
```

### "Validation failed"
```bash
✗ Problem: Missing/invalid fields
✓ Fix: Check field types and required fields
   Example: price must be number, stock must be >= 0
```

### "Not authorized for this operation"
```bash
✗ Problem: User is not admin/owner
✓ Fix: Use admin account or shop owner account
```

### "Database connection failed"
```bash
✗ Problem: MongoDB not running
✓ Fix: Start MongoDB and check MONGODB_URI in .env
```

---

## Token Management

### Access Token Expired?
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh-token \
  -H "Authorization: Bearer OLD_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "REFRESH_TOKEN"}'
```

### Refresh Token Expired?
Login again to get new tokens.

### Tokens in Response
Always look for:
```json
{
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## Performance Testing

### Test Pagination
```bash
# Get first page
curl "$API/admin/products?page=1&limit=20"

# Get second page
curl "$API/admin/products?page=2&limit=20"

# Get with large limit
curl "$API/admin/products?page=1&limit=100"
```

### Test Search Performance
```bash
# Single word search
curl "$API/admin/products?search=laptop"

# Multi-word search
curl "$API/admin/products?search=high%20performance"

# Case insensitive
curl "$API/admin/products?search=LAPTOP"
```

### Test Bulk Operations
```bash
# 10 products at once
curl -X PATCH "$API/admin/products/bulk/update" \
  -d '{"productIds":["id1",...,"id10"],"updates":{"price":5000}}'

# 100 products at once (measure time)
time curl -X PATCH "$API/admin/products/bulk/update" ...
```

---

## Quick Reference Commands

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123456"}'
```

### List Products (Page 1)
```bash
curl -X GET "http://localhost:5000/api/v1/admin/products?page=1&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"P1","description":"D1","category":"cat","price":100,"stock":10,"shopId":"SHOP_ID"}'
```

### Get Statistics
```bash
curl -X GET http://localhost:5000/api/v1/admin/products/stats/overview \
  -H "Authorization: Bearer TOKEN"
```

---

## Best Practices

✅ Save tokens properly after login  
✅ Use variables to avoid copy-paste errors  
✅ Test pagination with different limit values  
✅ Create test data before running filters  
✅ Verify response status codes (200, 201, 400, 401, 403, 404)  
✅ Check error messages for debugging  
✅ Use jq for JSON parsing in bash  
✅ Keep .env file with correct MongoDB URI  
✅ Monitor console logs while testing  
✅ Clean up test data when done  

---

## Tools

- **Postman:** Full collection included (`postman-admin-products-collection.json`)
- **cURL:** Built-in, great for scripting
- **Insomnia:** Similar to Postman, import JSON
- **Thunder Client:** VS Code extension
- **REST Client:** VS Code extension
- **Node.js Axios:** Programmatic testing

---

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Happy Testing! 🚀**
