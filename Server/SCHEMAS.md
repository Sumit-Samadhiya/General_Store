# MongoDB Schemas Documentation

## Overview
This document details the MongoDB schemas used in the General Store backend application.

---

## 1. User Schema

**Collection:** `users`

### Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|-----------|
| `name` | String | Yes | - | Min: 2, Max: 50 characters |
| `email` | String | Yes | - | Valid email format, unique |
| `password` | String | Yes | - | Min: 6 characters, hashed with bcrypt |
| `role` | String | No | 'customer' | Enum: ['admin', 'customer'] |
| `phone` | String | Yes | - | 10-digit number |
| `isActive` | Boolean | No | true | - |
| `createdAt` | Date | No | Date.now | - |
| `updatedAt` | Date | No | Date.now | - |

### Indexes
- `email` (unique)
- `role`
- `isActive`
- `createdAt`

### Methods
- `comparePassword(passwordInput)` - Compare password with hashed password

### Pre-save Hooks
- Automatically hashes password before saving

### Example
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...", // hashed
  "role": "customer",
  "phone": "9876543210",
  "isActive": true,
  "createdAt": "2026-02-19T10:00:00Z",
  "updatedAt": "2026-02-19T10:00:00Z"
}
```

---

## 2. Product Schema

**Collection:** `products`

### Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|-----------|
| `name` | String | Yes | - | Min: 3, Max: 100 characters |
| `description` | String | Yes | - | Min: 10, Max: 1000 characters |
| `category` | String | Yes | - | Lowercase, trimmed |
| `price` | Number | Yes | - | Must be > 0 |
| `discountedPrice` | Number | No | - | Must be < original price |
| `stock` | Number | Yes | 0 | Min: 0 |
| `images` | Array[String] | No | [] | Valid image URLs |
| `isAvailable` | Boolean | No | true | - |
| `shopId` | ObjectId | Yes | - | Reference to Shop |
| `rating` | Number | No | 0 | Min: 0, Max: 5 |
| `reviewCount` | Number | No | 0 | - |
| `createdAt` | Date | No | Date.now | - |
| `updatedAt` | Date | No | Date.now | - |

### Indexes
- `name` + `description` (text search)
- `category`
- `shopId`
- `isAvailable`
- `price`
- `rating` (descending)
- `createdAt` (descending)

### Example
```json
{
  "name": "Organic Apples",
  "description": "Fresh organic apples from local farms",
  "category": "fruits",
  "price": 80,
  "discountedPrice": 70,
  "stock": 50,
  "images": ["https://example.com/apple.jpg"],
  "isAvailable": true,
  "shopId": "507f1f77bcf86cd799439011",
  "rating": 4.5,
  "reviewCount": 12,
  "createdAt": "2026-02-19T10:00:00Z",
  "updatedAt": "2026-02-19T10:00:00Z"
}
```

---

## 3. Shop Schema

**Collection:** `shops`

### Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|-----------|
| `shopName` | String | Yes | - | Min: 3, Max: 100 characters |
| `ownerName` | String | Yes | - | Min: 2, Max: 50 characters |
| `email` | String | Yes | - | Valid email format, unique |
| `phone` | String | Yes | - | 10-digit number |
| `address.street` | String | Yes | - | Min: 5 characters |
| `address.city` | String | Yes | - | Min: 2 characters |
| `address.state` | String | Yes | - | Min: 2 characters |
| `address.zipCode` | String | Yes | - | 5-6 digits |
| `address.country` | String | No | 'India' | - |
| `type` | String | No | 'general' | Enum: ['general', 'medical', 'electronics', 'clothing', 'groceries', 'other'] |
| `isActive` | Boolean | No | true | - |
| `rating` | Number | No | 0 | Min: 0, Max: 5 |
| `totalProducts` | Number | No | 0 | - |
| `ownerId` | ObjectId | Yes | - | Reference to User |
| `createdAt` | Date | No | Date.now | - |
| `updatedAt` | Date | No | Date.now | - |

### Indexes
- `email` (unique)
- `ownerId`
- `type`
- `isActive`
- `shopName` (text search)
- `rating` (descending)
- `createdAt` (descending)

### Example
```json
{
  "shopName": "Green Valley Mart",
  "ownerName": "Raj Kumar",
  "email": "raj@greenvalley.com",
  "phone": "9876543210",
  "address": {
    "street": "123 Main Street",
    "city": "Bangalore",
    "state": "Karnataka",
    "zipCode": "560001",
    "country": "India"
  },
  "type": "general",
  "isActive": true,
  "rating": 4.7,
  "totalProducts": 150,
  "ownerId": "507f1f77bcf86cd799439012",
  "createdAt": "2026-02-19T10:00:00Z",
  "updatedAt": "2026-02-19T10:00:00Z"
}
```

---

## 4. Order Schema

**Collection:** `orders`

### Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|-----------|
| `customerId` | ObjectId | Yes | - | Reference to User |
| `products[].productId` | ObjectId | Yes | - | Reference to Product |
| `products[].productName` | String | Yes | - | - |
| `products[].quantity` | Number | Yes | - | Min: 1 |
| `products[].price` | Number | Yes | - | Min: 0 |
| `products[].shopId` | ObjectId | Yes | - | Reference to Shop |
| `products[].subtotal` | Number | Yes | - | - |
| `totalAmount` | Number | Yes | - | Min: 0 |
| `discountAmount` | Number | No | 0 | Min: 0 |
| `taxAmount` | Number | No | 0 | Min: 0 |
| `status` | String | No | 'pending' | Enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'] |
| `paymentStatus` | String | No | 'pending' | Enum: ['pending', 'paid', 'failed', 'refunded'] |
| `deliveryAddress.name` | String | Yes | - | Min: 2 characters |
| `deliveryAddress.phone` | String | Yes | - | 10-digit number |
| `deliveryAddress.email` | String | No | - | Valid email format |
| `deliveryAddress.street` | String | Yes | - | - |
| `deliveryAddress.city` | String | Yes | - | - |
| `deliveryAddress.state` | String | Yes | - | - |
| `deliveryAddress.zipCode` | String | Yes | - | 5-6 digits |
| `deliveryAddress.country` | String | No | 'India' | - |
| `notes` | String | No | - | Max: 500 characters |
| `trackingNumber` | String | No | - | - |
| `estimatedDeliveryDate` | Date | No | - | - |
| `actualDeliveryDate` | Date | No | - | - |
| `createdAt` | Date | No | Date.now | - |
| `updatedAt` | Date | No | Date.now | - |

### Indexes
- `customerId`
- `status`
- `paymentStatus`
- `products.shopId`
- `createdAt` (descending)
- `customerId` + `createdAt` (descending)
- `status` + `createdAt` (descending)

### Example
```json
{
  "customerId": "507f1f77bcf86cd799439013",
  "products": [
    {
      "productId": "507f1f77bcf86cd799439014",
      "productName": "Organic Apples",
      "quantity": 2,
      "price": 70,
      "shopId": "507f1f77bcf86cd799439011",
      "subtotal": 140
    }
  ],
  "totalAmount": 150,
  "discountAmount": 10,
  "taxAmount": 10,
  "status": "confirmed",
  "paymentStatus": "paid",
  "deliveryAddress": {
    "name": "Jane Doe",
    "phone": "8765432109",
    "email": "jane@example.com",
    "street": "456 Park Avenue",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "notes": "Please deliver after 6 PM",
  "trackingNumber": "TRACK123456",
  "estimatedDeliveryDate": "2026-02-23T10:00:00Z",
  "createdAt": "2026-02-19T10:00:00Z",
  "updatedAt": "2026-02-19T10:00:00Z"
}
```

---

## Relationships

### User → Shop
- One user can own multiple shops (via `Shop.ownerId`)

### Shop → Product
- One shop can have multiple products (via `Product.shopId`)

### User → Order
- One customer can have multiple orders (via `Order.customerId`)

### Order → Product
- One order can contain multiple products (via `Order.products[].productId`)

### Order → Shop
- One order can have products from multiple shops (via `Order.products[].shopId`)

---

## Data Integrity Notes

1. **Password Security**: User passwords are hashed with bcryptjs before storage
2. **Unique Constraints**: Email fields are unique at the database level
3. **Referential Integrity**: Foreign key references use MongoDB ObjectIds
4. **Timestamp Tracking**: All schemas track `createdAt` and `updatedAt` automatically
5. **Validation**: All required fields are validated at schema level
6. **Denormalization**: Some fields (like `productName`, `shopId` in orders) are denormalized for query efficiency
