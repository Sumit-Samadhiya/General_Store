# General Store Backend API - Production Deployment Guide

## 📋 Project Overview

The General Store Backend API is a comprehensive Node.js/Express.js REST API built with production-grade security, error handling, and deployment configurations. It provides complete e-commerce functionality including authentication, product management, shopping cart, and image uploads.

**Technologies:**
- Node.js/Express.js
- MongoDB with Mongoose ORM
- JWT Authentication
- Helmet.js Security
- Winston Logging
- Multer File Uploads

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- npm/yarn
- MongoDB 4.4+
- Git

### Local Development (5 minutes)

```bash
# 1. Clone and setup
git clone <repo>
cd Server
npm install

# 2. Create environment file
cp .env.example .env

# 3. Start development server with hot reload
npm run dev

# Server runs on http://localhost:5000
```

### Verify Installation
```bash
# Check health endpoint
curl http://localhost:5000/health

# Check API root
curl http://localhost:5000/api/v1
```

---

## 📦 Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

**Key Dependencies:**
- `express` (4.18.2) - Web framework
- `mongoose` (7.0.0) - MongoDB ODM
- `jsonwebtoken` (9.0.0) - JWT authentication
- `helmet` (7.0.0) - Security headers
- `express-rate-limit` (6.7.0) - Rate limiting
- `multer` (1.4.5) - File uploads
- `winston` (3.8.2) - Logging
- `morgan` (1.10.0) - Request logging

### Step 2: Environment Configuration

```bash
cp .env.example .env
```

#### Essential Variables

**Server:**
```env
PORT=5000
NODE_ENV=development              # or production/staging
API_VERSION=v1
```

**Database:**
```env
MONGODB_URI=mongodb://localhost:27017/general_store
```

**JWT Secrets (Generate 32+ char random strings):**
```env
JWT_SECRET=your_32_char_secret_key_minimum
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_32_char_refresh_secret_key
JWT_REFRESH_EXPIRE=30d
```

**CORS:**
```env
CORS_ORIGIN=http://localhost:3000,https://app.example.com
CORS_CREDENTIALS=true
```

**File Uploads:**
```env
STORAGE_TYPE=local                # local, s3, or cloudinary
MAX_FILE_SIZE=5242880             # 5MB
MAX_FILES_PER_UPLOAD=5
```

**For AWS S3:**
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
```

**For Cloudinary:**
```env
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### Step 3: Initialize Database

```bash
# Ensure MongoDB is running
mongod

# Connection test
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✓ Connected')).catch(e => console.error('✗ Connection failed:', e.message))"
```

---

## 🏃 Running the Application

### Development Mode (with hot reload)
```bash
# Requires nodemon
npm run dev

# Logs:
# ✓ Server running on http://localhost:5000
# ✓ MongoDB connected
```

### Production Mode
```bash
# Set environment variable
export NODE_ENV=production

# Start server
npm start

# Or use PM2 for process management
pm2 start src/server.js --name "general-store-api"
```

### Docker (Production Recommended)
```bash
# Build image
docker build -t general-store-api:1.0 .

# Run container
docker run -d \
  --name general-store-api \
  -p 5000:5000 \
  --env-file .env.production \
  general-store-api:1.0

# View logs
docker logs -f general-store-api
```

---

## 📚 API Documentation

### Health & Status

**Health Check:**
```bash
GET /health

Response: 200 OK
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2026-02-19T10:00:00Z"
}
```

**API Info:**
```bash
GET /api/v1

Response: 200 OK
{
  "message": "Welcome to General Store API",
  "version": "v1",
  "environment": "production",
  "timestamp": "2026-02-19T10:00:00Z"
}
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login with credentials | Public |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | Public |
| POST | `/api/v1/auth/request-password-reset` | Request password reset | Public |
| POST | `/api/v1/auth/reset-password` | Reset with token | Public |
| POST | `/api/v1/auth/logout` | Logout user | JWT |
| GET | `/api/v1/auth/me` | Get current user | JWT |

**Example: Login**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

Response: 200 OK
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

### Product Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/products` | Get all products | Public |
| GET | `/api/v1/products/:id` | Get product by ID | Public |
| GET | `/api/v1/products/category/:category` | Get by category | Public |
| GET | `/api/v1/products/shop/:shopId` | Get by shop | Public |
| POST | `/api/v1/products` | Create product | Admin |
| PUT | `/api/v1/products/:id` | Update product | Admin |
| DELETE | `/api/v1/products/:id` | Delete product | Admin |

**Pagination:**
```bash
GET /api/v1/products?page=1&limit=20&sort=-createdAt

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- sort: Sort field (prefix with - for descending)
```

### Cart Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Get user's cart | JWT |
| GET | `/api/cart/summary` | Get cart summary | JWT |
| POST | `/api/cart` | Add item to cart | JWT |
| PUT | `/api/cart/:itemId` | Update cart item | JWT |
| DELETE | `/api/cart/:itemId` | Remove item | JWT |
| DELETE | `/api/cart` | Clear cart | JWT |

### File Upload Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Upload single image | JWT |
| POST | `/api/upload/multiple` | Upload multiple images | JWT |
| GET | `/api/upload/:filename` | Get uploaded image | Public |
| DELETE | `/api/upload/:filename` | Delete uploaded image | JWT |

---

## 🔐 Security Features

### Enabled Protections

✅ **HTTP Headers** - Helmet.js secures headers (CSP, HSTS, X-Frame-Options, etc.)
✅ **Rate Limiting** - Prevents brute force and DoS attacks
✅ **Input Sanitization** - XSS prevention using DOMPurify
✅ **Injection Prevention** - MongoDB and SQL injection blocking
✅ **CORS** - Origin whitelisting
✅ **HTTPS** - Enforce in production
✅ **JWT** - Stateless authentication

### Rate Limits (Configurable)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/auth/*` | 5 | 15 min |
| `/api/upload/*` | 50 | 1 hour |
| `/api/v1/products/search` | 30 | 1 minute |
| General `/api/*` | 100 | 15 min |

### Production Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ chars, random)
- [ ] Enable HTTPS (`ENFORCE_HTTPS=true`)
- [ ] Update `CORS_ORIGIN` to actual domain
- [ ] Set up MongoDB authentication
- [ ] Configure file upload storage (S3/Cloudinary)
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging
- [ ] Configure backups
- [ ] Use environment-specific secrets

---

## 📊 Environment Variables Reference

### Development
```env
NODE_ENV=development
PORT=5000
DEBUG=*
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
ENFORCE_HTTPS=false
```

### Staging
```env
NODE_ENV=staging
PORT=5000
LOG_LEVEL=info
CORS_ORIGIN=https://staging.example.com
ENFORCE_HTTPS=true
```

### Production
```env
NODE_ENV=production
PORT=5000
LOG_LEVEL=warn
CORS_ORIGIN=https://app.example.com
ENFORCE_HTTPS=true
RATE_LIMIT_MAX_REQUESTS=50
```

---

## 📦 Docker Deployment

### Dockerfile
The project includes a production-optimized Dockerfile. Build and run:

```bash
# Build
docker build -t general-store-api:1.0 .

# Run locally
docker run -d -p 5000:5000 --env-file .env.development general-store-api:1.0

# Run in production
docker run -d \
  --name general-store-api \
  -p 5000:5000 \
  --restart always \
  --env-file .env.production \
  -e NODE_ENV=production \
  general-store-api:1.0
```

### Docker Compose
For local development with MongoDB:

```bash
docker-compose up -d

# Services:
# - api: http://localhost:5000
# - mongodb: mongodb://mongodb:27017
```

### Kubernetes Deployment
Resources available in `/k8s` directory:
- Deployment
- Service
- ConfigMap
- Secrets

---

## 🚀 Deployment Strategies

### Strategy 1: Manual with PM2 (Recommended for small/medium)

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Clone repo and install
git clone <repo>
cd Server
npm install --production

# 3. Create production env file
nano .env.production

# 4. Install PM2 globally
npm install -g pm2

# 5. Start with PM2
pm2 start src/server.js --name "general-store-api" --env .env.production
pm2 startup
pm2 save

# 6. Monitor
pm2 logs general-store-api
pm2 monit
```

### Strategy 2: Docker on VPS

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Clone repo
git clone <repo>
cd Server

# 4. Build and run
docker build -t api:latest .
docker run -d --name api -p 5000:5000 --env-file .env.production api:latest

# 5. Set up Nginx reverse proxy
# ... (see Nginx config below)
```

### Strategy 3: Heroku

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
heroku create general-store-api

# 4. Add MongoDB addon
heroku addons:create mongolab:sandbox

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs --tail
```

### Strategy 4: AWS/DigitalOcean/Linode (App Platform)

1. Connect GitHub repository
2. Auto-deploy on push
3. Configure build command: `npm install`
4. Configure start command: `npm start`
5. Add environment variables
6. Deploy!

---

## 🔧 Nginx Reverse Proxy Configuration

For production, use Nginx as reverse proxy:

```nginx
upstream general_store_api {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;  # For load balancing
}

server {
    listen 80;
    server_name api.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL certificates (get from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript;

    # Proxy settings
    location / {
        proxy_pass http://general_store_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitoring & Logging

### logs/ Directory Structure
```
logs/
├── error.log          # Error events
├── combined.log       # All requests
├── security.log       # Security events
└── mongodb.log        # Database events
```

### View Logs in Real-time
```bash
# All logs
tail -f logs/combined.log

# Errors only
tail -f logs/error.log | grep -i error

# Security events
grep "injection attempt\|rate limit\|CORS" logs/security.log
```

### Log Levels
- `error` - Errors and critical issues
- `warn` - Warnings
- `info` - General information
- `debug` - Detailed debugging (development only)

### Monitoring Tools
- **PM2 Monitor** - `pm2 monitor`
- **New Relic** - APM integration available
- **Datadog** - Log aggregation
- **ELK Stack** - Self-hosted logging

---

## 🧪 Testing Before Deployment

### Health Checks
```bash
# Basic health
curl http://localhost:5000/health

# With verbose output
curl -v http://localhost:5000/health
```

### Authentication Test
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Rate Limiting Test
```bash
# Try 6 auth requests (limit is 5 per 15 min)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# 6th request returns 429 Too Many Requests
```

### Security Headers Verification
```bash
curl -I http://localhost:5000/health

# Should show:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=...
# Content-Security-Policy: default-src 'self'
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"
```bash
# Check MongoDB is running
mongod --version

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/general_store

# Test connection
node -e "const m=require('mongoose'); m.connect(process.env.MONGODB_URI).then(()=>console.log('✓')).catch(e=>console.log('✗', e.message))"
```

### Issue: "Port already in use"
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

### Issue: "CORS errors"
```bash
# Check CORS configuration in .env
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Verify headers are set
curl -H "Origin: http://localhost:3000" -I http://localhost:5000/api/v1/products
```

### Issue: "Rate limit exceeded"
```bash
# Adjust limits in .env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Or increase specific limits
RATE_LIMIT_AUTH_MAX=10
```

### Issue: "File upload failing"
```bash
# Check storage configuration
STORAGE_TYPE=local              # or s3, cloudinary
MAX_FILE_SIZE=5242880          # 5MB

# Ensure upload directory exists
mkdir -p uploads

# Check permissions
chmod 755 uploads
```

---

## 📈 Performance Optimization

### Compression
```bash
# Enabled in production (see server.js)
# Compresses responses > 1KB
# Default: gzip, deflate
```

### Caching Headers
```bash
# Client-side caching
Cache-Control: max-age=3600    # 1 hour for images
Cache-Control: no-cache        # Dynamic content
```

### Database Optimization
```bash
# Create indexes for frequently queried fields
db.products.createIndex({ "category": 1 })
db.products.createIndex({ "shop": 1 })
db.products.createIndex({ "name": "text" })
```

### Connection Pooling
```env
# MongoDB connection pool
MONGODB_POOL_SIZE=10
```

---

## 📋 Deployment Checklist

**Before Deployment:**
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] SSL certificates obtained
- [ ] Monitoring set up
- [ ] Rollback plan created

**During Deployment:**
- [ ] Maintain database backups
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify all endpoints
- [ ] Monitor rate limiting

**After Deployment:**
- [ ] Health checks passing
- [ ] Load testing results good
- [ ] Logs monitored for errors
- [ ] Alerts configured
- [ ] Documentation updated

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          ssh user@server.com 'cd /app && git pull && npm install && pm2 restart api'
```

---

## 📞 Support & Resources

### Documentation Files
- [SECURITY_BEST_PRACTICES_GUIDE.md](./SECURITY_BEST_PRACTICES_GUIDE.md) - Security details
- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - Error handling patterns
- [ADMIN_PRODUCT_API.md](./ADMIN_PRODUCT_API.md) - Admin endpoints
- [CUSTOMER_API_DOCUMENTATION.md](./CUSTOMER_API_DOCUMENTATION.md) - Customer endpoints

### Postman Collections
- [postman-collection.json](./postman-collection.json) - Complete API
- [postman-admin-products-collection.json](./postman-admin-products-collection.json) - Admin
- [postman-customer-api-collection.json](./postman-customer-api-collection.json) - Customer

### External Resources
- [Express.js Docs](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Introduction](https://jwt.io/)

---

## 📞 Getting Help

1. Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
2. Review logs: `tail -f logs/error.log`
3. Search existing documentation
4. Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Log excerpts

---

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Status:** ✅ Production Ready

---

## License

ISC

Enjoy deploying! 🚀
