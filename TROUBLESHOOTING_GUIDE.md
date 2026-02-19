# Troubleshooting Guide - General Store API

## 🔍 Common Issues & Solutions

---

## Authentication Issues

### Issue: "No token provided" Error

**Symptom:** GET/POST requests to protected routes return 401 Unauthorized

**Cause:** Missing `Authorization` header

**Solution:**
```javascript
// ❌ Wrong - Missing header
fetch('http://localhost:5000/api/cart')

// ✅ Correct - Include Authorization header
fetch('http://localhost:5000/api/cart', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

**Verification:**
```bash
# Check if token exists
echo $JWT_TOKEN

# Login to get new token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Copy accessToken from response and use it
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Issue: "Token expired" Error

**Symptom:** Valid token suddenly returns 401, token was working before

**Cause:** JWT token has expired (default: 7 days)

**Solution:**
```javascript
// Re-login to get new token
const loginResponse = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { data: { accessToken } } = await loginResponse.json();
localStorage.setItem('token', accessToken);
```

**Prevention:**
- Implement token refresh logic
- Refresh token before expiration (at 6 days)
- Store token expiration time and check before requests

---

### Issue: "Invalid token" Error

**Symptom:** Token returns `Invalid token signature` error

**Cause:**
- Token corrupted or modified
- Different JWT_SECRET than what signed the token
- Token from different environment

**Solution:**
```bash
# Verify JWT_SECRET matches across all instances
echo $JWT_SECRET

# Re-login to get valid token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use fresh token
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer <NEW_TOKEN>"
```

---

## Database Connection Issues

### Issue: "Connection timeout" Error

**Symptom:** Cannot connect to MongoDB, requests hang then fail

**Cause:**
- MongoDB service not running
- Incorrect connection string
- Firewall blocking MongoDB port (27017)
- Network connectivity issue

**Solution:**

```bash
# 1. Check if MongoDB is running
sudo systemctl status mongod
# If not running, start it
sudo systemctl start mongod

# 2. Verify MongoDB is listening on correct port
netstat -an | grep 27017
# Should show: LISTEN on 127.0.0.1:27017 or 0.0.0.0:27017

# 3. Test connection locally
mongo  # Should connect successfully

# 4. Verify MONGODB_URL in .env
cat .env | grep MONGODB_URL
# Should be: mongodb://user:password@localhost:27017/database_name

# 5. Test connection from Node.js
node -e "
const mongoose = require('mongoose');
const url = 'mongodb://user:password@localhost:27017/general_store';
mongoose.connect(url)
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Error:', err.message));
"
```

**Firewall Fix:**
```bash
# If connecting remotely, allow MongoDB port
sudo ufw allow 27017/tcp

# Check firewall rules
sudo ufw status
```

---

### Issue: "Authentication failed" Connecting to MongoDB

**Symptom:** MongoDB connection fails with authentication error

**Cause:**
- Wrong username/password
- User doesn't have permission for database
- User not created yet

**Solution:**
```bash
# 1. Connect to MongoDB as admin
mongo --username admin --password --authenticationDatabase admin

# 2. Verify user exists and has correct permissions
use general_store
db.getUser('app_user')

# 3. If user doesn't exist, create it
db.createUser({
  user: "app_user",
  pwd: "strong-password",
  roles: [
    {role: "readWrite", db: "general_store"},
    {role: "dbAdmin", db: "general_store"}
  ]
})

# 4. Update .env with correct credentials
MONGODB_URL=mongodb://app_user:password@localhost:27017/general_store

# 5. Restart application
pm2 restart general-store-api
```

---

### Issue: "Database does not exist" Error

**Symptom:** Getting error that database doesn't exist

**Cause:** Database not created yet (MongoDB creates on first write)

**Solution:**
```bash
# 1. MongoDB automatically creates database on first write
# Just perform a write operation
mongo
> use general_store
> db.products.insertOne({name: "test"})

# 2. Or initialize database with seed script
npm run seed

# 3. Verify database exists
mongo
> show databases
# Should list: general_store
```

---

## Product/Cart Issues

### Issue: "Product not found" When Adding to Cart

**Symptom:** POST /api/cart returns error: "Product not found"

**Cause:**
- Invalid product ID format
- Product ID doesn't exist in database
- Product marked as unavailable

**Solution:**

```bash
# 1. Get valid product ID
curl http://localhost:5000/api/products?limit=1 | jq '.data[0]._id'
# Example output: "60d5ec49c1234567890abcde"

# 2. Verify product exists and is available
curl http://localhost:5000/api/products/60d5ec49c1234567890abcde

# 3. Check product has stock > 0
curl http://localhost:5000/api/products/60d5ec49c1234567890abcde | jq '.data.stock'

# 4. If no products exist, create one from admin panel
# Or use seed data
npm run seed
```

**JavaScript Verification:**
```javascript
// Verify product ID is valid ObjectId format
const mongoose = require('mongoose');
const productId = '60d5ec49c1234567890abcde';

console.log(mongoose.Types.ObjectId.isValid(productId)); // Should be true
// If false, format is incorrect 24-character hex string required
```

---

### Issue: "Only X items available" When Adding to Cart

**Symptom:** Cannot add requested quantity, error about stock

**Cause:** Requested quantity exceeds available stock

**Solution:**

```bash
# 1. Check available stock
curl http://localhost:5000/api/products/PRODUCT_ID | jq '.data.stock'

# 2. Try with valid quantity
PRODUCT_ID="60d5ec49c1234567890abcde"
TOKEN="your-jwt-token"

curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"'$PRODUCT_ID'","quantity":1}'

# 3. Or update product stock from admin panel
npm run test:admin  # Uses admin endpoints to add stock
```

---

### Issue: "Cart is empty" When Items Were Added

**Symptom:** Added items to cart but cart is empty when retrieved

**Cause:**
- Cart expired (TTL: 30 days)
- Different user session
- Browser cookies cleared

**Solution:**

```javascript
// Check if logged in as same user
const user = JSON.parse(localStorage.getItem('user'));
console.log('Current user:', user);

// Check token is still valid
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires at:', new Date(payload.exp * 1000));

// If expired, login again
if (new Date(payload.exp * 1000) < new Date()) {
  // Token expired, need to login
}
```

---

### Issue: "Invalid quantity" Error

**Symptom:** Cannot update cart item quantity, error about invalid quantity

**Cause:**
- Quantity is not a positive integer
- Quantity is 0 or negative
- Quantity exceeds stock

**Solution:**

```bash
# ❌ Wrong quantities
{"quantity": 0}      # Must be >= 1
{"quantity": -5}     # Cannot be negative
{"quantity": 2.5}    # Must be integer
{"quantity": "5"}    # Must be number, not string

# ✅ Correct quantities
{"quantity": 1}
{"quantity": 5}
{"quantity": 10}

# Make correct request
curl -X PUT http://localhost:5000/api/cart/ITEM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":5}'
```

---

## API Request Issues

### Issue: CORS Error in Frontend

**Symptom:** Browser console shows CORS error, `Access-Control-Allow-Origin` header missing

**Cause:** Frontend and backend on different domains/ports

**Solution:**

**Server-Side (.env):**
```bash
# Configure CORS origin
CORS_ORIGIN=http://localhost:3000  # For development
# Or for production
CORS_ORIGIN=https://yourdomain.com
```

**Server-Side (server.js):**
```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,  // Allow cookies
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

**Client-Side (frontend):**
```javascript
// Include credentials for cookie-based auth
fetch('http://localhost:5000/api/cart', {
  method: 'GET',
  credentials: 'include',  // Include cookies
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

### Issue: "Bad Request" with Invalid Field

**Symptom:** POST/PUT request returns 400 Bad Request with validation error

**Cause:** Invalid or missing required field

**Solution:**

**Check Required Fields:**
```bash
# Add to Cart - Required fields
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "60d5ec49c1234567890abcde",  # Required
    "quantity": 1                              # Required
  }'

# Validation error examples:
# - productId must be valid ObjectId
# - quantity must be positive integer
# - Missing productId or quantity
```

**Check Validation Schemas:**
```javascript
// In cartController.js
const { error, value } = addToCartSchema.validate(req.body);
if (error) {
  return res.status(400).json({ 
    success: false, 
    message: error.details[0].message  // Shows what's wrong
  });
}
```

---

### Issue: "Method Not Allowed" (405 Error)

**Symptom:** Request returns 405 Method Not Allowed

**Cause:** Wrong HTTP method for endpoint

**Solution:**

```bash
# ❌ Wrong methods
DELETE /api/products/ID       # Not allowed (product can't be deleted by customer)
POST /api/cart/search         # POST not allowed on search
GET /api/cart (with JSON body) # Don't send body in GET

# ✅ Correct methods
GET /api/products             # Browse products
POST /api/cart                # Add to cart
PUT /api/cart/:itemId         # Update quantity
DELETE /api/cart/:itemId      # Remove item
GET /api/products/:id         # Get product details
```

**Reference:**
```
GET    /api/products                 Get all
GET    /api/products/:id             Get one
POST   /api/cart                     Add item
GET    /api/cart                     Get cart
PUT    /api/cart/:itemId             Update item
DELETE /api/cart/:itemId             Remove item
DELETE /api/cart                     Clear cart
```

---

## Server & Performance Issues

### Issue: "Connection refused" on localhost:5000

**Symptom:** Cannot connect to `http://localhost:5000`, connection refused

**Cause:**
- Server not running
- Server running on different port
- Port already in use

**Solution:**

```bash
# 1. Check if server is running
ps aux | grep node
# Should show process like: node src/server.js

# 2. If not running, start it
npm start

# 3. Check what's using port 5000
sudo lsof -i :5000
# Shows process using the port

# 4. Kill process on port 5000
kill -9 <PID>

# 5. Change port in .env if needed
PORT=5001

# 6. Restart server
npm start

# 7. Verify server is running
curl http://localhost:5000/health
# Should return: {"status": "OK"}
```

---

### Issue: Slow Response Times

**Symptom:** API requests take > 2 seconds to respond

**Cause:**
- Unoptimized database queries
- Missing indexes
- Too large result sets
- Network latency

**Solution:**

**Check Database Indexes:**
```bash
mongo
> use general_store
> db.products.getIndexes()
# Should show indexes on: category, price, shopId

# If missing, create them
> db.products.createIndex({category: 1})
> db.products.createIndex({price: 1})
> db.products.createIndex({shopId: 1})
```

**Optimize Queries:**
```javascript
// ❌ Slow - fetches all fields
const products = await Product.find({});

// ✅ Fast - fetch only needed fields
const products = await Product.find({}, 'name price category');

// ✅ Faster - use lean() for read-only
const products = await Product.find({}).lean();

// ✅ Paginate large result sets
const products = await Product.find({})
  .skip((page - 1) * limit)
  .limit(limit);
```

**Monitor Performance:**
```bash
# Enable slow query logging in MongoDB
mongo
> db.setProfilingLevel(1, {slowms: 100})  # Log queries > 100ms
> db.system.profile.find().sort({ts:-1}).limit(5).pretty()
```

---

### Issue: High Memory Usage

**Symptom:** Node.js process uses high memory (> 500MB)

**Cause:**
- Memory leak
- Too many connections
- Large result sets in memory

**Solution:**

```bash
# 1. Check current memory usage
top  # Look for Node.js process
pm2 monit  # If using PM2

# 2. Restart application
pm2 restart general-store-api

# 3. Check logs for memory leaks
tail -f logs/error.log

# 4. Increase max memory if needed
node --max-old-space-size=2048 src/server.js

# 5. Use heapdump for analysis (development only)
npm install heapdump
# Trigger: kill -USR2 <PID>
```

---

## Development Issues

### Issue: "Module not found" Error

**Symptom:** Cannot find module X, error when starting server

**Cause:** Package not installed or wrong import path

**Solution:**

```bash
# 1. Check if package is in package.json
cat package.json | grep "package-name"

# 2. If missing, install it
npm install package-name
npm install --save express
npm install --save-dev nodemon

# 3. Check node_modules exists
ls node_modules | grep package-name

# 4. Verify import syntax is correct
// ✅ Correct
const express = require('express');
const { User } = require('./models');

// ❌ Wrong
const { express } = require('express');  // express is default export
require('./models/nonexistent');
```

---

### Issue: "Cannot find post validation schema" Error

**Symptom:** Schema validation middleware fails to find schema

**Cause:** Schema not exported or requires not correct

**Solution:**

```javascript
// ✅ Export schemas from validation middleware
module.exports = {
  validate,
  addToCartSchema,
  updateCartItemSchema,
  loginSchema
};

// ✅ Import correctly
const { validate, addToCartSchema } = require('../middleware/validation');

// Use in routes
router.post('/cart', validate(addToCartSchema), cartController.addToCart);
```

---

### Issue: ".env file not found"

**Symptom:** Cannot find environment variables, application crashes

**Cause:** `.env` file not created in server root

**Solution:**

```bash
# 1. Create .env file in Server directory
cd Server
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
MONGODB_URL=mongodb://localhost:27017/general_store
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3000
EOF

# 2. Or copy from template
cp .env.example .env

# 3. Edit with your values
nano .env

# 4. Verify file exists and is readable
cat .env
ls -la .env  # Should show readable permissions

# 5. Restart server
npm start
```

---

## Testing Issues

### Issue: Tests Failing

**Symptom:** `npm test` shows failing test cases

**Cause:**
- Database not running
- Test data not seeded
- API server not running (for E2E tests)
- Environment variables wrong

**Solution:**

```bash
# 1. Ensure MongoDB is running
sudo systemctl start mongod

# 2. Ensure test database exists
mongo
> use general_store_test

# 3. Seed test data
npm run seed:test

# 4. For E2E tests, start server first
npm start &

# 5. Run tests with specific options
npm test -- --testPathPattern="cart"  # Run specific test file
npm test -- --verbose                 # Show detailed output

# 6. Check test configuration
cat jest.config.js  # Verify correct database URL for tests
```

---

## Git & Deployment Issues

### Issue: "Git pull" Fails with Conflicts

**Symptom:** Cannot pull latest code, merge conflicts

**Cause:** Local changes conflict with remote changes

**Solution:**

```bash
# 1. Stash local changes
git stash

# 2. Pull latest
git pull origin main

# 3. Apply stashed changes (may have conflicts)
git stash pop

# 4. Resolve conflicts manually
# Edit conflicted files, remove <<<<, ===>, >>>>
git add .
git commit -m "Resolve merge conflicts"
git push
```

---

### Issue: Deployment Stuck or Hanging

**Symptom:** Deployment command hangs and doesn't complete

**Cause:**
- NPM install hanging
- Database migration stuck
- Application not starting

**Solution:**

```bash
# 1. Check running processes
ps aux | grep npm
ps aux | grep node

# 2. Kill stuck process
kill -9 <PID>

# 3. Clear npm cache
npm cache clean --force

# 4. Try deployment again
npm install --no-save
npm start

# 5. If still stuck, check logs
tail -f logs/error.log
tail -f logs/out.log
```

---

## 💡 Debug Mode

### Enable Debug Logging

```javascript
// In server.js
const debug = require('debug')('general-store:*');

// In environment
export DEBUG=general-store:*
npm start
```

### Log Important Information

```javascript
// Before database operations
console.log('Query params:', {
  category: category,
  minPrice: minPrice,
  maxPrice: maxPrice,
  page: page,
  limit: limit
});

// Check middleware execution
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});
```

### Use Node Inspector

```bash
# Start with debugger
node --inspect src/server.js

# Open in Chrome: chrome://inspect
# Then set breakpoints and debug
```

---

## 🆘 Getting Help

### Check These First

1. ✅ Server is running: `curl http://localhost:5000/health`
2. ✅ MongoDB is running: `mongo --eval "db.adminCommand('ping')"`
3. ✅ Environment variables set: `echo $MONGODB_URL`
4. ✅ Port is not in use: `sudo lsof -i :5000`
5. ✅ Dependencies installed: `npm list | head`

### Useful Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs general-store-api

# Monitor resources
pm2 monit

# Show server info
npm run info

# Run health check
curl http://localhost:5000/health

# Test database
mongo general_store --eval "db.products.count()"

# Test token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### Provide These When Asking for Help

1. Error message (full text)
2. Endpoint being called
3. Request body (sanitized)
4. Server logs (last 50 lines)
5. Environment (development/production)
6. Node/npm versions
7. Steps to reproduce

---

## 📞 Support

For issues not covered here:
- Check [API Documentation](./CUSTOMER_API_DOCUMENTATION.md)
- Check [System Overview](./SYSTEM_OVERVIEW.md)
- Contact: `support@general-store.com`

---

**Last Updated:** February 19, 2026  
**Version:** 1.0
