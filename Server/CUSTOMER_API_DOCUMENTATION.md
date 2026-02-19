# Customer Website REST API - Complete Documentation

## Overview

The Customer Website API provides endpoints for browsing products and managing shopping carts. All product endpoints are public (no authentication required), while cart endpoints require user authentication.

**API Version:** v1  
**Base URL:** `http://localhost:5000/api`  
**Current Date:** 2026-02-19

---

## Table of Contents

1. [Product Endpoints](#product-endpoints)
2. [Category Endpoints](#category-endpoints)
3. [Cart Endpoints](#cart-endpoints)
4. [Error Handling](#error-handling)
5. [Response Formats](#response-formats)
6. [Examples](#examples)

---

## Product Endpoints

### 1. Get All Products

**Endpoint:** `GET /api/products`

**Description:** Get all available products with pagination, search, filtering, and sorting.

**Access:** Public (No authentication required)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number for pagination |
| limit | Number | 20 | Items per page (max 100) |
| search | String | - | Search in product name/description |
| category | String | - | Filter by product category |
| minPrice | Number | - | Minimum price filter |
| maxPrice | Number | - | Maximum price filter |
| sortBy | String | createdAt | Sort field (name, price, rating, createdAt) |
| sortOrder | Number | -1 | 1 for ascending, -1 for descending |

**Example Request:**

```bash
GET /api/products?page=1&limit=20&search=laptop&category=electronics&minPrice=50000&maxPrice=100000&sortBy=price&sortOrder=1
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "60d5ec49c1234567890abcde",
        "name": "High Performance Laptop",
        "description": "15-inch display, Intel i7, 16GB RAM",
        "category": "electronics",
        "price": 75000,
        "discountedPrice": 69000,
        "stock": 50,
        "isAvailable": true,
        "rating": 4.5,
        "reviewCount": 23,
        "images": ["https://example.com/laptop.jpg"],
        "shopId": {
          "_id": "60d5ec42c1234567890abcdc",
          "shopName": "TechStore",
          "ownerName": "John Doe",
          "email": "john@techstore.com",
          "phone": "+1234567890"
        },
        "createdAt": "2026-02-15T10:30:00Z",
        "updatedAt": "2026-02-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalProducts": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": ["minPrice must be a positive number"]
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/products?page=1&limit=20&sortBy=price&sortOrder=1" \
  -H "Content-Type: application/json"
```

---

### 2. Search Products

**Endpoint:** `GET /api/products/search`

**Description:** Search products with text query and optional filters.

**Access:** Public

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | String | Yes | Search query (min 1, max 100 chars) |
| category | String | No | Filter by category |
| minPrice | Number | No | Minimum price |
| maxPrice | Number | No | Maximum price |
| page | Number | No | Page number (default: 1) |
| limit | Number | No | Items per page (default: 20, max: 100) |

**Example Request:**

```bash
GET /api/products/search?q=wireless%20headphones&category=electronics&minPrice=1000&maxPrice=10000&page=1&limit=20
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Found 45 product(s)",
  "data": {
    "data": [
      {
        "_id": "60d5ec49c1234567890abcde",
        "name": "Wireless Headphones Pro",
        "description": "High-quality sound with noise cancellation",
        "category": "electronics",
        "price": 5000,
        "discountedPrice": 4500,
        "stock": 100,
        "isAvailable": true,
        "rating": 4.8,
        "reviewCount": 234,
        "shopId": {
          "_id": "60d5ec42c1234567890abcdc",
          "shopName": "AudioWorld"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalProducts": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Search query is required",
  "error": "Parameter 'q' is needed"
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/products/search?q=laptop&minPrice=50000" \
  -H "Content-Type: application/json"
```

---

### 3. Get Single Product

**Endpoint:** `GET /api/products/:id`

**Description:** Get detailed information about a single product by ID.

**Access:** Public

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Product MongoDB ObjectId |

**Example Request:**

```bash
GET /api/products/60d5ec49c1234567890abcde
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Product details retrieved successfully",
  "data": {
    "_id": "60d5ec49c1234567890abcde",
    "name": "High Performance Laptop",
    "description": "15-inch display, Intel i7, 16GB RAM, 512GB SSD. Perfect for professionals and gamers.",
    "category": "electronics",
    "price": 75000,
    "discountedPrice": 69000,
    "stock": 50,
    "isAvailable": true,
    "rating": 4.5,
    "reviewCount": 23,
    "images": [
      "https://example.com/laptop1.jpg",
      "https://example.com/laptop2.jpg"
    ],
    "shopId": {
      "_id": "60d5ec42c1234567890abcdc",
      "shopName": "TechStore",
      "ownerName": "John Doe",
      "email": "john@techstore.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Tech Street",
        "city": "TechCity",
        "state": "TC",
        "zipCode": "12345",
        "country": "Techland"
      },
      "rating": 4.7
    },
    "createdAt": "2026-02-15T10:30:00Z",
    "updatedAt": "2026-02-15T10:30:00Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Product not found",
  "error": "No product with ID 60d5ec49c1234567890abcde exists"
}
```

**Error Response (404 Unavailable):**

```json
{
  "success": false,
  "message": "This product is currently unavailable",
  "error": "Product is out of stock"
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/products/60d5ec49c1234567890abcde" \
  -H "Content-Type: application/json"
```

---

## Category Endpoints

### 4. Get All Categories

**Endpoint:** `GET /api/products/categories`

**Description:** Get all available product categories with statistics (product count, price range, average price).

**Access:** Public

**Query Parameters:** None

**Example Request:**

```bash
GET /api/products/categories
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "name": "electronics",
      "count": 150,
      "minPrice": 5000,
      "maxPrice": 500000,
      "avgPrice": 85000
    },
    {
      "name": "clothing",
      "count": 320,
      "minPrice": 500,
      "maxPrice": 15000,
      "avgPrice": 3500
    },
    {
      "name": "home-appliances",
      "count": 89,
      "minPrice": 2000,
      "maxPrice": 250000,
      "avgPrice": 45000
    }
  ]
}
```

**Success Response - Empty (200 OK):**

```json
{
  "success": true,
  "message": "No categories available",
  "data": []
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/products/categories" \
  -H "Content-Type: application/json"
```

---

### 5. Get Products by Category

**Endpoint:** `GET /api/products/category/:category`

**Description:** Get all products in a specific category with pagination and sorting.

**Access:** Public

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | String | Category name |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number |
| limit | Number | 20 | Items per page (max 100) |
| sortBy | String | createdAt | Sort field (name, price, rating, createdAt) |
| sortOrder | Number | -1 | 1 for ascending, -1 for descending |

**Example Request:**

```bash
GET /api/products/category/electronics?page=1&limit=20&sortBy=price&sortOrder=1
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Products in \"electronics\" category retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "60d5ec49c1234567890abcde",
        "name": "Budget Smartphone",
        "category": "electronics",
        "price": 15000,
        "stock": 150,
        "isAvailable": true,
        "shopId": {
          "_id": "60d5ec42c1234567890abcdc",
          "shopName": "PhoneStore",
          "phone": "+1234567890",
          "email": "info@phonestore.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalProducts": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "message": "No products found for this shop",
  "error": "No products match the category criteria"
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/products/category/electronics?sortBy=price" \
  -H "Content-Type: application/json"
```

---

### 6. Get Shop Products

**Endpoint:** `GET /api/products/shop/:shopId`

**Description:** Get all products from a specific shop.

**Access:** Public

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| shopId | String | Shop MongoDB ObjectId |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number |
| limit | Number | 20 | Items per page (max 100) |
| sortBy | String | createdAt | Sort field |
| sortOrder | Number | -1 | 1 ascending, -1 descending |

**Example Request:**

```bash
GET /api/products/shop/60d5ec42c1234567890abcdc?page=1&limit=20&sortBy=rating&sortOrder=-1
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Shop products retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "60d5ec49c1234567890abcde",
        "name": "Product Name",
        "category": "electronics",
        "price": 50000,
        "stock": 45,
        "isAvailable": true,
        "rating": 4.8,
        "shopId": {
          "_id": "60d5ec42c1234567890abcdc",
          "shopName": "TechStore",
          "phone": "+1234567890",
          "email": "info@techstore.com",
          "address": {...},
          "rating": 4.7,
          "totalProducts": 150
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalProducts": 87,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Invalid shop ID format",
  "error": "Shop ID must be a valid MongoDB ObjectId"
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/products/shop/60d5ec42c1234567890abcdc" \
  -H "Content-Type: application/json"
```

---

## Cart Endpoints

All cart endpoints require authentication.

**Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`

---

### 7. Add Item to Cart

**Endpoint:** `POST /api/cart`

**Description:** Add a product to the user's shopping cart.

**Access:** Private (Authentication required)

**Request Body:**

```json
{
  "productId": "60d5ec49c1234567890abcde",
  "quantity": 2
}
```

**Body Parameters:**

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|-----------|
| productId | String | Yes | Product MongoDB ObjectId | Valid ObjectId format |
| quantity | Number | Yes | Number of items to add | Integer >= 1 |

**Example Request:**

```bash
curl -X POST "http://localhost:5000/api/cart" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "60d5ec49c1234567890abcde",
    "quantity": 2
  }'
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart": {
      "itemCount": 5,
      "total": 245000,
      "items": [
        {
          "_id": "60d5ec50c1234567890abcdf",
          "productId": {
            "_id": "60d5ec49c1234567890abcde",
            "name": "High Performance Laptop",
            "price": 75000,
            "stock": 50
          },
          "quantity": 2,
          "price": 75000,
          "subtotal": 150000,
          "addedAt": "2026-02-19T15:30:00Z"
        },
        {
          "_id": "60d5ec51c1234567890abce0",
          "productId": {
            "_id": "60d5ec4ac1234567890abcdf",
            "name": "Wireless Mouse",
            "price": 1500,
            "stock": 200
          },
          "quantity": 3,
          "price": 1500,
          "subtotal": 4500,
          "addedAt": "2026-02-19T15:28:00Z"
        }
      ]
    }
  }
}
```

**Error Response (400 Bad Request - Invalid Quantity):**

```json
{
  "success": false,
  "message": "Quantity must be a positive integer",
  "error": "Invalid input"
}
```

**Error Response (404 Product Not Found):**

```json
{
  "success": false,
  "message": "Product not found",
  "error": "No product exists with ID 60d5ec49c1234567890abcde"
}
```

**Error Response (400 Out of Stock):**

```json
{
  "success": false,
  "message": "Only 10 item(s) available in stock",
  "error": "Insufficient stock for requested quantity"
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "No token provided",
  "error": "Authentication required"
}
```

---

### 8. Get User's Cart

**Endpoint:** `GET /api/cart`

**Description:** Retrieve the current user's shopping cart with all items.

**Access:** Private (Authentication required)

**Query Parameters:** None

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/cart" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "_id": "60d5ec52c1234567890abce1",
    "userId": "60d5ec48c1234567890abcdd",
    "items": [
      {
        "_id": "60d5ec50c1234567890abcdf",
        "product": {
          "_id": "60d5ec49c1234567890abcde",
          "name": "High Performance Laptop",
          "description": "Gaming laptop with RTX 3060",
          "images": ["https://example.com/laptop.jpg"],
          "category": "electronics"
        },
        "quantity": 2,
        "price": 75000,
        "subtotal": 150000,
        "addedAt": "2026-02-19T15:30:00Z"
      },
      {
        "_id": "60d5ec51c1234567890abce0",
        "product": {
          "_id": "60d5ec4ac1234567890abcdf",
          "name": "Wireless Mouse",
          "description": "Precision wireless mouse",
          "images": ["https://example.com/mouse.jpg"],
          "category": "electronics"
        },
        "quantity": 3,
        "price": 1500,
        "subtotal": 4500,
        "addedAt": "2026-02-19T15:28:00Z"
      }
    ],
    "itemCount": 5,
    "total": 154500,
    "lastUpdated": "2026-02-19T15:30:00Z",
    "createdAt": "2026-02-19T10:00:00Z",
    "updatedAt": "2026-02-19T15:30:00Z"
  }
}
```

**Success Response - Empty Cart (200 OK):**

```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "_id": "60d5ec52c1234567890abce1",
    "userId": "60d5ec48c1234567890abcdd",
    "items": [],
    "itemCount": 0,
    "total": 0,
    "lastUpdated": "2026-02-19T15:30:00Z",
    "createdAt": "2026-02-19T10:00:00Z",
    "updatedAt": "2026-02-19T15:30:00Z"
  }
}
```

---

### 9. Update Cart Item Quantity

**Endpoint:** `PUT /api/cart/:itemId`

**Description:** Update the quantity of a specific item in the cart.

**Access:** Private (Authentication required)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| itemId | String | Cart item ID (MongoDB ObjectId) |

**Request Body:**

```json
{
  "quantity": 5
}
```

**Body Parameters:**

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|-----------|
| quantity | Number | Yes | New quantity | Integer >= 1 |

**Example Request:**

```bash
curl -X PUT "http://localhost:5000/api/cart/60d5ec50c1234567890abcdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "cart": {
      "itemCount": 8,
      "total": 259500,
      "items": [
        {
          "_id": "60d5ec50c1234567890abcdf",
          "productId": {
            "_id": "60d5ec49c1234567890abcde",
            "name": "High Performance Laptop",
            "price": 75000,
            "stock": 50
          },
          "quantity": 5,
          "price": 75000,
          "subtotal": 375000,
          "addedAt": "2026-02-19T15:30:00Z"
        }
      ]
    }
  }
}
```

**Error Response (404 Item Not Found):**

```json
{
  "success": false,
  "message": "Item not found in cart",
  "error": "No item with ID 60d5ec50c1234567890abcdf exists in cart"
}
```

**Error Response (400 Insufficient Stock):**

```json
{
  "success": false,
  "message": "Only 20 item(s) available in stock",
  "error": "Cannot update quantity beyond available stock"
}
```

---

### 10. Remove Item from Cart

**Endpoint:** `DELETE /api/cart/:itemId`

**Description:** Remove a specific item from the user's cart.

**Access:** Private (Authentication required)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| itemId | String | Cart item ID (MongoDB ObjectId) |

**Example Request:**

```bash
curl -X DELETE "http://localhost:5000/api/cart/60d5ec50c1234567890abcdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Item removed from cart successfully",
  "data": {
    "cart": {
      "itemCount": 3,
      "total": 4500,
      "items": [
        {
          "_id": "60d5ec51c1234567890abce0",
          "productId": {
            "_id": "60d5ec4ac1234567890abcdf",
            "name": "Wireless Mouse",
            "price": 1500,
            "stock": 200
          },
          "quantity": 3,
          "price": 1500,
          "subtotal": 4500,
          "addedAt": "2026-02-19T15:28:00Z"
        }
      ]
    }
  }
}
```

**Error Response (404 Item Not Found):**

```json
{
  "success": false,
  "message": "Item not found in cart",
  "error": "No item with this ID exists in cart"
}
```

---

### 11. Clear Entire Cart

**Endpoint:** `DELETE /api/cart`

**Description:** Remove all items from the user's cart.

**Access:** Private (Authentication required)

**Example Request:**

```bash
curl -X DELETE "http://localhost:5000/api/cart" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "cart": {
      "itemCount": 0,
      "total": 0,
      "items": []
    }
  }
}
```

---

### 12. Get Cart Summary

**Endpoint:** `GET /api/cart/summary`

**Description:** Get a quick summary of the cart (item count, total, emptiness status).

**Access:** Private (Authentication required)

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/cart/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart summary retrieved successfully",
  "data": {
    "itemCount": 5,
    "total": 154500,
    "items": 2,
    "isEmpty": false
  }
}
```

**Success Response - Empty Cart:**

```json
{
  "success": true,
  "message": "Cart is empty",
  "data": {
    "itemCount": 0,
    "total": 0,
    "isEmpty": true
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Access denied (authorization) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

### Standard Error Response

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details"
}
```

### Common Error Scenarios

#### Missing Authentication
```json
{
  "success": false,
  "message": "No token provided",
  "error": "Authorization header is required for this endpoint"
}
```

#### Invalid Product ID
```json
{
  "success": false,
  "message": "Invalid product ID format",
  "error": "Product ID must be a valid MongoDB ObjectId"
}
```

#### Product Out of Stock
```json
{
  "success": false,
  "message": "Only 0 item(s) available in stock",
  "error": "Product is not available"
}
```

#### Quantity Exceeds Stock
```json
{
  "success": false,
  "message": "Only 5 item(s) available in stock",
  "error": "Cannot add 10 units when only 5 are available"
}
```

---

## Response Formats

### Standard Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Description of what was done",
  "data": {
    // Response-specific data
  }
}
```

### Pagination Response

List endpoints include pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalProducts": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Product Object Structure

```json
{
  "_id": "60d5ec49c1234567890abcde",
  "name": "Product Name",
  "description": "Product description",
  "category": "category-name",
  "price": 50000,
  "discountedPrice": 45000,
  "stock": 50,
  "isAvailable": true,
  "rating": 4.5,
  "reviewCount": 23,
  "images": ["url1.jpg", "url2.jpg"],
  "shopId": {
    "_id": "60d5ec42c1234567890abcdc",
    "shopName": "Shop Name",
    "ownerName": "Owner Name",
    "email": "owner@example.com",
    "phone": "+1234567890"
  },
  "createdAt": "2026-02-15T10:30:00Z",
  "updatedAt": "2026-02-15T10:30:00Z"
}
```

### Cart Item Object Structure

```json
{
  "_id": "60d5ec50c1234567890abcdf",
  "product": {
    "_id": "60d5ec49c1234567890abcde",
    "name": "Product Name",
    "description": "Description",
    "images": ["url.jpg"],
    "category": "electronics"
  },
  "quantity": 2,
  "price": 50000,
  "subtotal": 100000,
  "addedAt": "2026-02-19T15:30:00Z"
}
```

---

## Examples

### Complete Shopping Flow

#### 1. Get Categories
```bash
curl -X GET "http://localhost:5000/api/products/categories"
```

#### 2. Browse Products in Category
```bash
curl -X GET "http://localhost:5000/api/products/category/electronics?page=1&limit=20&sortBy=rating&sortOrder=-1"
```

#### 3. Search Specific Product
```bash
curl -X GET "http://localhost:5000/api/products/search?q=laptop&minPrice=50000&maxPrice=100000"
```

#### 4. Get Product Details
```bash
curl -X GET "http://localhost:5000/api/products/60d5ec49c1234567890abcde"
```

#### 5. Login to Get Token
```bash
curl -X POST "http://localhost:5000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
# Save accessToken from response
```

#### 6. Add Item to Cart
```bash
curl -X POST "http://localhost:5000/api/cart" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "60d5ec49c1234567890abcde",
    "quantity": 2
  }'
```

#### 7. View Cart
```bash
curl -X GET "http://localhost:5000/api/cart" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 8. Update Item Quantity
```bash
curl -X PUT "http://localhost:5000/api/cart/60d5ec50c1234567890abcdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

#### 9. Remove Item
```bash
curl -X DELETE "http://localhost:5000/api/cart/60d5ec50c1234567890abcdf" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 10. Get Cart Summary
```bash
curl -X GET "http://localhost:5000/api/cart/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Best Practices

1. **Pagination:** Always use pagination when fetching lists. Default is 20 items per page.
2. **Search:** Use the `/products/search` endpoint for text-based searches.
3. **Filtering:** Combine `category`, `minPrice`, and `maxPrice` filters for better results.
4. **Sorting:** Use `sortBy` and `sortOrder` parameters for different sorting options.
5. **Authentication:** Store JWT tokens securely. Include in `Authorization: Bearer` header.
6. **Error Handling:** Always check `success` field and handle errors appropriately.
7. **Cart Management:** Always validate stock before adding items.
8. **Pagination Navigation:** Use `hasNextPage` and `hasPrevPage` for pagination UI.

---

## Rate Limiting

Currently, there is no rate limiting implemented. Please use API responsibly:
- Don't make more than 100 requests per minute per IP
- Implement caching on client side where possible

---

## Future Enhancements

- Wishlist functionality
- Product reviews and ratings
- Product comparisons
- Abandoned cart recovery
- Stock tracking notifications
- Bulk operations for multiple products

---

**API Version:** 1.0  
**Last Updated:** February 19, 2026  
**Status:** Production Ready ✅
