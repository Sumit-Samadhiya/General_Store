# General Store E-Commerce API - System Overview

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vue/Angular)                 │
│                                                                   │
│  - Product Browsing  - Shopping Cart  - User Authentication       │
│  - Search & Filter   - Order Checkout - Account Management       │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │  Authentication      │    │  REST API Server     │
        │  (JWT Tokens)        │    │  (Node.js/Express)   │
        │                      │    │                      │
        │ - Login/Register     │    │ - Product Routes     │
        │ - Token Validation   │    │ - Cart Routes        │
        │ - Token Refresh      │    │ - Order Routes       │
        │ - Password Reset     │    │ - Admin Routes       │
        └──────────────────────┘    └──────────┬───────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │   MongoDB Database   │    │  File Storage        │
        │                      │    │  (Images, Docs)      │
        │ - Users              │    │                      │
        │ - Products           │    │ - Product Images     │
        │ - Carts              │    │ - Invoice PDFs       │
        │ - Orders             │    │ - User Documents     │
        │ - Reviews            │    │                      │
        │ - Shops              │    │                      │
        └──────────────────────┘    └──────────────────────┘
```

---

## 📊 Data Models

```
┌────────────────────────────────────────────────────────────────┐
│                         USER MODEL                              │
├────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                   │
│ firstName: String                                               │
│ lastName: String                                                │
│ email: String (unique)                                          │
│ password: String (hashed with bcrypt)                           │
│ phone: String                                                   │
│ address: {                                                      │
│   street: String                                                │
│   city: String                                                  │
│   state: String                                                 │
│   zipCode: String                                               │
│   country: String                                               │
│ }                                                               │
│ role: 'customer' | 'admin' | 'seller'                            │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
│ isActive: Boolean                                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                       PRODUCT MODEL                             │
├────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                   │
│ name: String (unique, required)                                 │
│ description: String                                             │
│ category: String                                                │
│ price: Number (required, > 0)                                   │
│ discountedPrice: Number (< price)                               │
│ discount: Number (calculated percentage)                        │
│ stock: Number (>= 0)                                            │
│ images: [String] (URLs to image files)                          │
│ shopId: ObjectId (ref: Shop)                                    │
│ rating: Number (0-5, calculated from reviews)                   │
│ reviewCount: Integer (number of reviews)                        │
│ tags: [String]                                                  │
│ isAvailable: Boolean (calculated: stock > 0 && isActive)        │
│ isActive: Boolean                                               │
│ specs: Object (product-specific specifications)                 │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                        SHOP MODEL                               │
├────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                   │
│ name: String (unique, required)                                 │
│ description: String                                             │
│ owner: ObjectId (ref: User)                                     │
│ email: String                                                   │
│ phone: String                                                   │
│ address: String                                                 │
│ logo: String (URL)                                              │
│ banner: String (URL)                                            │
│ rating: Number (0-5, calculated from reviews)                   │
│ reviewCount: Integer                                            │
│ productCount: Integer (number of products)                      │
│ isActive: Boolean                                               │
│ verificationStatus: String                                      │
│ commission: Number (percentage)                                 │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                        CART MODEL                               │
├────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                   │
│ userId: ObjectId (ref: User, unique)                            │
│ items: [{                                                       │
│   _id: ObjectId                                                 │
│   productId: ObjectId (ref: Product)                            │
│   quantity: Number (>= 1)                                       │
│   price: Number (price at time of add)                          │
│   addedAt: Date                                                 │
│ }]                                                              │
│ lastUpdated: Date                                               │
│ expiresAt: Date (TTL: 30 days for cleanup)                      │
│ Total: Number (calculated: sum of item.price * quantity)       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                        ORDER MODEL                              │
├────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                   │
│ userId: ObjectId (ref: User)                                    │
│ items: [{                                                       │
│   productId: ObjectId                                           │
│   quantity: Number                                              │
│   price: Number (price at time of order)                        │
│   subtotal: Number (price * quantity)                           │
│ }]                                                              │
│ totalAmount: Number                                             │
│ shippingAddress: {                                              │
│   street: String                                                │
│   city: String                                                  │
│   state: String                                                 │
│   zipCode: String                                               │
│   country: String                                               │
│ }                                                               │
│ paymentMethod: String                                           │
│ paymentStatus: 'pending' | 'completed' | 'failed'              │
│ shippingStatus: 'processing' | 'shipped' | 'delivered'         │
│ orderStatus: 'pending' | 'confirmed' | 'shipped' | 'completed' │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
│ notes: String                                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
1. USER REGISTRATION/LOGIN
   ┌─────────────────────────────────────────────────┐
   │ POST /api/v1/auth/register                      │
   │ {email, password, firstName, lastName}          │
   │                                                   │
   │ POST /api/v1/auth/login                         │
   │ {email, password}                                │
   └────────────────────┬────────────────────────────┘
                        │
                        ▼
   ┌─────────────────────────────────────────────────┐
   │ Server: Hash password (bcrypt) or Validate      │
   │ Database: Create User or Find User              │
   └────────────────────┬────────────────────────────┘
                        │
                        ▼
   ┌─────────────────────────────────────────────────┐
   │ Generate JWT Token                               │
   │ {                                                │
   │   "userId": "60d5ec49c1234...",                  │
   │   "email": "user@example.com",                   │
   │   "role": "customer",                            │
   │   "iat": 1645012800,                             │
   │   "exp": 1645617600  (7 days)                    │
   │ }                                                 │
   └────────────────────┬────────────────────────────┘
                        │
                        ▼
   ┌─────────────────────────────────────────────────┐
   │ Response:                                         │
   │ {                                                │
   │   "success": true,                               │
   │   "data": {                                      │
   │     "accessToken": "eyJhbGc...",                 │
   │     "user": {id, email, role, ...}              │
   │   }                                              │
   │ }                                                 │
   └─────────────────────────────────────────────────┘

2. AUTHENTICATED REQUESTS
   ┌─────────────────────────────────────────────────┐
   │ Client stores token in localStorage              │
   │ Every subsequent request includes:              │
   │ Header: Authorization: Bearer <TOKEN>            │
   └────────────────────┬────────────────────────────┘
                        │
                        ▼
   ┌─────────────────────────────────────────────────┐
   │ Server Middleware: verifyToken()                │
   │ - Extract token from Authorization header       │
   │ - Verify token signature                        │
   │ - Decode token payload                          │
   │ - Check expiration                              │
   │ - Get userId from payload                       │
   └────────────────────┬────────────────────────────┘
                        │
                    ┌───┴───┐
                    │       │
                   ✓       ✗
                    │       │
                    ▼       ▼
            ┌──────────┐  ┌──────────────────┐
            │ Continue │  │ Return 401       │
            │ Request  │  │ Unauthorized     │
            └──────────┘  └──────────────────┘
```

---

## 🛍️ Shopping Flow

```
1. PRODUCT BROWSING
   ┌─────────────────────────────────────────────┐
   │ GET /api/products                            │
   │ GET /api/products?category=electronics        │
   │ GET /api/products/search?q=laptop             │
   │ GET /api/products/categories                 │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │ Database Query: Product.find({...})          │
   │ Applied: pagination, search, filtering       │
   │ Return: List of products with pagination     │
   └─────────────────────────────────────────────┘

2. PRODUCT DETAILS
   ┌─────────────────────────────────────────────┐
   │ GET /api/products/:id                        │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │ Database Query: Product.findById({id})       │
   │ Populate: Shop details                       │
   │ Return: Full product information             │
   └─────────────────────────────────────────────┘

3. ADD TO CART (Auth Required)
   ┌─────────────────────────────────────────────┐
   │ POST /api/cart                               │
   │ {                                             │
   │   "productId": "60d5ec49c...",                │
   │   "quantity": 2                               │
   │ }                                             │
   │ Header: Authorization: Bearer <TOKEN>       │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │ Validations:                                 │
   │ ✓ Token is valid (verified by middleware)   │
   │ ✓ Product exists and is available           │
   │ ✓ Requested quantity <= stock               │
   │ ✓ Quantity is positive integer              │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │ Database Operations:                         │
   │ 1. Find or create Cart for user             │
   │ 2. Check if product already in cart         │
   │ 3. If yes: increment quantity               │
   │    If no: add new item to cart               │
   │ 4. Save updated cart                        │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │ Response: Updated cart with all items       │
   └─────────────────────────────────────────────┘

4. VIEW CART
   ┌─────────────────────────────────────────────┐
   │ GET /api/cart                                │
   │ Header: Authorization: Bearer <TOKEN>       │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │ Database Query:                              │
   │ Cart.findOne({userId})                       │
   │ .populate('items.productId')                 │
   │ Calculate totals                             │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │ Response:                                    │
   │ {                                             │
   │   "items": [...with product details],        │
   │   "itemCount": 5,                             │
   │   "total": 154500                             │
   │ }                                             │
   └─────────────────────────────────────────────┘

5. UPDATE CART
   ┌─────────────────────────────────────────────┐
   │ PUT /api/cart/:itemId                        │
   │ {"quantity": 5}                              │
   │ OR                                            │
   │ DELETE /api/cart/:itemId  (remove item)      │
   │ OR                                            │
   │ DELETE /api/cart  (clear all)                │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────┐
   │ Similar validations and updates              │
   │ Return: Updated cart state                  │
   └─────────────────────────────────────────────┘

6. CHECKOUT (Coming Soon)
   ┌─────────────────────────────────────────────┐
   │ POST /api/orders                             │
   │ {                                             │
   │   "shippingAddress": {...},                  │
   │   "paymentMethod": "card"                    │
   │ }                                             │
   └────────────────┬────────────────────────────┘
                    │
                    ▼ (Will be implemented next)
   ┌─────────────────────────────────────────────┐
   │ Convert cart items to order                 │
   │ Reserve stock                                │
   │ Process payment                              │
   │ Create order record                          │
   │ Clear user's cart                            │
   └─────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
d:/General_Store/
│
├── Server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js                 (User schema with auth)
│   │   │   ├── Product.js              (Product catalog)
│   │   │   ├── Shop.js                 (Seller shops)
│   │   │   ├── Cart.js                 (Shopping cart)
│   │   │   ├── Order.js                (Customer orders)
│   │   │   └── index.js                (Model exports)
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js       (Auth logic)
│   │   │   ├── productController.js    (Product browsing)
│   │   │   ├── adminProductController.js (Admin product mgmt)
│   │   │   ├── cartController.js       (Shopping cart ops)
│   │   │   └── orderController.js      (Order processing)
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js           (Authentication endpoints)
│   │   │   ├── customerProductRoutes.js (Public product browsing)
│   │   │   ├── cartRoutes.js           (Cart management)
│   │   │   ├── adminProductRoutes.js   (Admin product endpoints)
│   │   │   └── orderRoutes.js          (Order endpoints)
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       (JWT verification)
│   │   │   ├── validation.js           (Input validation)
│   │   │   └── errorHandler.js         (Error handling)
│   │   │
│   │   ├── utils/
│   │   │   ├── validators.js           (Custom validators)
│   │   │   ├── helpers.js              (Utility functions)
│   │   │   └── constants.js            (App constants)
│   │   │
│   │   └── server.js                   (Express app setup)
│   │
│   ├── .env                            (Environment variables)
│   ├── package.json                    (Dependencies)
│   └── .gitignore
│
├── Client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductList.js
│   │   │   ├── ProductDetail.js
│   │   │   ├── Cart.js
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   └── cartService.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useProducts.js
│   │   │   ├── useCart.js
│   │   │   └── useAuth.js
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── CartContext.js
│   │   │
│   │   ├── App.js
│   │   └── index.js
│   │
│   ├── public/
│   └── package.json
│
└── Documentation/
    ├── CUSTOMER_API_DOCUMENTATION.md
    ├── CUSTOMER_API_QUICK_REFERENCE.md
    ├── ADMIN_API_DOCUMENTATION.md
    ├── FRONTEND_INTEGRATION_GUIDE.md
    ├── SYSTEM_OVERVIEW.md (this file)
    ├── DATABASE_SCHEMA.md
    └── DEPLOYMENT_GUIDE.md
```

---

## 🔄 Request-Response Cycle

```
REQUEST → SERVER → MIDDLEWARE → VALIDATION → BUSINESS LOGIC → DATABASE → RESPONSE

1. REQUEST
   Client sends HTTP request with:
   - Method (GET, POST, PUT, DELETE)
   - URL/Path
   - Headers (Authorization, Content-Type)
   - Body (if applicable)

2. SERVER (Express.js)
   - Route matched to handler
   - Request object created

3. MIDDLEWARE
   a) Authentication (if required)
      - verifyToken() extracts and validates JWT
      - Sets req.user = decoded token payload
   
   b) Request Parsing
      - JSON.parse() for body
      - URL parsing for query params
   
   c) Rate Limiting (optional)
      - Check request limits

4. VALIDATION
   - Input validation (Joi or custom)
   - Type checking
   - Required field checking
   - Range/format validation

5. BUSINESS LOGIC (Controller)
   - Database queries
   - Calculations
   - Stock checks
   - Access control

6. DATABASE (MongoDB)
   - Execute queries
   - Return data
   - Lock/unlock records

7. RESPONSE
   - Format response object
   - Set status code
   - Add headers
   - Send JSON to client
```

---

## 🛡️ Security Features

### 1. Password Security
- Passwords hashed with bcrypt (rounds: 10)
- Passwords never stored in plaintext
- Password comparison done securely with bcrypt.compare()

### 2. Authentication & Authorization
- JWT tokens with 7-day expiration
- Tokens verified on protected routes via verifyToken middleware
- Role-based access control (customer, seller, admin)
- Protected endpoints require valid, non-expired token

### 3. Input Validation
- All inputs validated with Joi
- Query parameters validated inline
- Type checking for all fields
- Protection against injection attacks

### 4. Database Security
- MongoDB ObjectId validation
- Prepared statements via Mongoose
- Protection against NoSQL injection
- Field-level access control in queries

### 5. Error Handling
- Generic error messages to prevent information leakage
- Detailed logging for debugging
- No sensitive data in error responses
- Proper HTTP status codes

### 6. CORS & Headers
- CORS headers configured
- Content-Type validation
- Request size limits
- Security headers

---

## 📊 API Endpoints Summary

### Public (No Auth)
```
GET  /api/products                    Get all products
GET  /api/products/:id                Get single product
GET  /api/products/categories         Get all categories
GET  /api/products/search             Search products
GET  /api/products/category/:cat      Get by category
GET  /api/products/shop/:shopId       Get by shop
```

### Authentication
```
POST /api/v1/auth/register            Register new user
POST /api/v1/auth/login               Login user
```

### Cart (Auth Required)
```
GET  /api/cart                        Get user's cart
GET  /api/cart/summary                Get cart summary
POST /api/cart                        Add to cart
PUT  /api/cart/:itemId                Update quantity
DELETE /api/cart/:itemId              Remove item
DELETE /api/cart                      Clear cart
```

### Admin (Auth + Admin Role)
```
GET  /api/v1/admin/products           List all products
POST /api/v1/admin/products           Create product
PUT  /api/v1/admin/products/:id       Update product
DELETE /api/v1/admin/products/:id     Delete product
```

---

## 🚀 Performance Optimizations

### Database Indexing
```javascript
// Indexes created on these fields:
User.index({ email: 1 });                    // Unique index
Product.index({ category: 1 });              // Filtering
Product.index({ price: 1 });                 // Range queries
Product.index({ shopId: 1 });                // Foreign key
Cart.index({ userId: 1 }, { unique: true }); // User lookup
Cart.index({ expiresAt: 1 });                // TTL cleanup
```

### Pagination
- Default limit: 20 items
- Maximum limit: 100 items
- Skip calculation: (page-1) * limit

### Query Optimization
- Only fetch needed fields
- Use .lean() for read-only queries
- Populate only when necessary

### Caching Strategy (Future)
- Redis for frequently accessed data
- Cache categories list
- Cache popular products
- Cache user sessions

---

## 📈 Scalability Considerations

### Current Setup
- Single Express.js server
- Single MongoDB instance
- In-memory sessions

### Future Improvements
1. **Load Balancing**
   - Multiple server instances
   - Load balancer (nginx/HAProxy)
   - Sticky sessions for cart consistency

2. **Database Optimization**
   - MongoDB replication set
   - Database sharding for large scale
   - Read replicas for reporting

3. **Caching Layer**
   - Redis for session storage
   - Redis for frequently accessed data
   - Cache invalidation strategy

4. **CDN for Static Assets**
   - Product images to CloudFront/Cloudflare
   - Reduce server bandwidth

5. **Microservices** (if needed)
   - Separate payment service
   - Separate notification service
   - Separate inventory service

---

## 🧪 Testing Strategy

### Unit Tests
```javascript
// Test individual functions
- validateEmail()
- calculateDiscount()
- mergeCartItems()
```

### Integration Tests
```javascript
// Test endpoints with database
- POST /api/products (create)
- GET /api/cart (retrieve and populate)
- PUT /api/cart/:id (update quantity)
```

### E2E Tests
```javascript
// Test complete flows
- User Registration → Login → Browse → Cart → Checkout
- Product Search → Filter → Details → Add to Cart
```

---

## 📋 Checklist: From Development to Production

### Development
- [x] Local environment setup
- [x] Database schema design
- [x] API endpoint development
- [x] Basic testing
- [x] Documentation

### Testing
- [ ] Unit tests (80% coverage)
- [ ] Integration tests
- [ ] E2E tests with real scenarios
- [ ] Load testing
- [ ] Security testing (OWASP)

### Deployment
- [ ] Environment variables configured
- [ ] Database backups automated
- [ ] Logging and monitoring set up
- [ ] CI/CD pipeline configured
- [ ] Security headers configured
- [ ] HTTPS/SSL enabled
- [ ] Rate limiting enabled
- [ ] Error handling in production mode

### Post-Launch
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Feature iteration

---

## 📞 Development Contacts

- **Backend Lead:** Backend Developer
- **Database Admin:** DBA
- **Frontend Lead:** Frontend Developer
- **DevOps:** DevOps Engineer

---

## 📚 Related Documentation

- [Quick Reference](./CUSTOMER_API_QUICK_REFERENCE.md)
- [Complete API Docs](./CUSTOMER_API_DOCUMENTATION.md)
- [Frontend Guide](./FRONTEND_INTEGRATION_GUIDE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Project:** General Store E-Commerce Platform  
**Last Updated:** February 19, 2026  
**Status:** Development Phase (Phase 2 Complete)  
**Next Phase:** Order Management & Payment Integration
