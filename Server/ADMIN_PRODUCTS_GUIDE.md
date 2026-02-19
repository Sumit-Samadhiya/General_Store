# Admin Product Management - Complete Implementation Guide

## Overview

The Admin Product Management system provides REST API endpoints for managing product inventory in the General Store application. All endpoints are protected with JWT authentication and role-based access control.

---

## Quick Start

### 1. Prerequisites

- Node.js server running on `http://localhost:5000`
- Valid JWT access token from login
- Admin or Shop Owner role

### 2. Get Your Access Token

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Store the `accessToken` from the response:
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Test an Endpoint

```bash
curl -X GET http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN"
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/products` | Create product |
| GET | `/api/v1/admin/products` | Get all products |
| GET | `/api/v1/admin/products/:id` | Get single product |
| PUT | `/api/v1/admin/products/:id` | Update product |
| DELETE | `/api/v1/admin/products/:id` | Delete product (soft) |
| PATCH | `/api/v1/admin/products/:id/stock` | Update stock |
| PATCH | `/api/v1/admin/products/bulk/update` | Bulk update |
| GET | `/api/v1/admin/products/stats/overview` | Get statistics |

---

## Detailed Endpoint Documentation

### POST /api/v1/admin/products - Create Product

**Purpose:** Add a new product to shop inventory

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Headphones",
    "description": "Premium noise-cancelling wireless headphones with 30-hour battery life",
    "category": "electronics",
    "price": 8999,
    "discountedPrice": 7999,
    "stock": 100,
    "images": ["https://cdn.example.com/headphones.jpg"],
    "shopId": "60d5ec49c1234567890abcde"
  }'
```

**Validation:**
- name: 3-100 characters (required)
- description: 10-1000 characters (required)
- category: 2+ characters (required)
- price: number >= 0 (required)
- discountedPrice: number < price (optional)
- stock: integer >= 0 (required)
- shopId: valid MongoDB ID (required)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "60d5ec49c1234567890abcdf",
    "name": "Wireless Headphones",
    "description": "Premium noise-cancelling wireless headphones...",
    "category": "electronics",
    "price": 8999,
    "discountedPrice": 7999,
    "stock": 100,
    "isAvailable": true,
    "shopId": "60d5ec49c1234567890abcde",
    "createdAt": "2026-02-19T12:00:00Z",
    "updatedAt": "2026-02-19T12:00:00Z"
  }
}
```

---

### GET /api/v1/admin/products - Get All Products

**Purpose:** Retrieve all products with pagination and filtering

**Query Parameters:**
```
page=1                          # Page number (default: 1)
limit=20                        # Items per page (default: 10, max: 100)
search=headphones               # Search in name/description
category=electronics            # Filter by category
minPrice=5000                   # Minimum price filter
maxPrice=15000                  # Maximum price filter
sortBy=price                    # Sort field (default: createdAt)
sortOrder=-1                    # 1=ascending, -1=descending (default: -1)
```

**Request:**
```bash
curl -X GET "http://localhost:5000/api/v1/admin/products?page=1&limit=20&category=electronics&minPrice=5000&maxPrice=15000&sortBy=price" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "60d5ec49c1234567890abcdf",
      "name": "Wireless Headphones",
      "description": "Premium noise-cancelling...",
      "category": "electronics",
      "price": 8999,
      "discountedPrice": 7999,
      "stock": 100,
      "isAvailable": true,
      "shopId": {
        "_id": "60d5ec49c1234567890abcde",
        "shopName": "Tech Store"
      },
      "rating": 4.5,
      "reviewCount": 25,
      "createdAt": "2026-02-19T12:00:00Z",
      "updatedAt": "2026-02-19T12:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalProducts": 250,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### GET /api/v1/admin/products/:id - Get Single Product

**Purpose:** Retrieve detailed information for a specific product

**Request:**
```bash
curl -X GET http://localhost:5000/api/v1/admin/products/60d5ec49c1234567890abcdf \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "_id": "60d5ec49c1234567890abcdf",
    "name": "Wireless Headphones",
    "description": "Premium noise-cancelling wireless headphones with 30-hour battery life",
    "category": "electronics",
    "price": 8999,
    "discountedPrice": 7999,
    "stock": 100,
    "images": ["https://cdn.example.com/headphones.jpg"],
    "isAvailable": true,
    "shopId": {
      "_id": "60d5ec49c1234567890abcde",
      "shopName": "Tech Store",
      "email": "tech@store.com",
      "phone": "9876543210"
    },
    "rating": 4.5,
    "reviewCount": 25,
    "createdAt": "2026-02-19T12:00:00Z",
    "updatedAt": "2026-02-19T12:00:00Z"
  }
}
```

---

### PUT /api/v1/admin/products/:id - Update Product

**Purpose:** Update product details

**Request:**
```bash
curl -X PUT http://localhost:5000/api/v1/admin/products/60d5ec49c1234567890abcdf \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Wireless Headphones",
    "price": 9999,
    "discountedPrice": 8999,
    "stock": 75,
    "description": "Updated description with better features"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "60d5ec49c1234567890abcdf",
    "name": "Premium Wireless Headphones",
    "price": 9999,
    "discountedPrice": 8999,
    "stock": 75,
    "isAvailable": true,
    "updatedAt": "2026-02-19T13:30:00Z"
  }
}
```

---

### DELETE /api/v1/admin/products/:id - Delete Product

**Purpose:** Soft delete a product (mark as unavailable)

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/v1/admin/products/60d5ec49c1234567890abcdf \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully (soft delete)",
  "data": {
    "_id": "60d5ec49c1234567890abcdf",
    "name": "Wireless Headphones",
    "isAvailable": false,
    "updatedAt": "2026-02-19T14:00:00Z"
  }
}
```

---

### PATCH /api/v1/admin/products/:id/stock - Update Stock

**Purpose:** Update product stock quantity

**Request:**
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/products/60d5ec49c1234567890abcdf/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 50
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product stock updated successfully",
  "data": {
    "productId": "60d5ec49c1234567890abcdf",
    "productName": "Wireless Headphones",
    "previousStock": 100,
    "newStock": 50,
    "isAvailable": true
  }
}
```

---

### PATCH /api/v1/admin/products/bulk/update - Bulk Update

**Purpose:** Update multiple products at once

**Request:**
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/products/bulk/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": [
      "60d5ec49c1234567890abcdf",
      "60d5ec49c1234567890abce0",
      "60d5ec49c1234567890abce1"
    ],
    "updates": {
      "price": 9999,
      "discountedPrice": 8999,
      "category": "electronics"
    }
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Products updated successfully",
  "data": {
    "matchedCount": 3,
    "modifiedCount": 3
  }
}
```

---

### GET /api/v1/admin/products/stats/overview - Get Statistics

**Purpose:** Get product statistics and analytics

**Request:**
```bash
curl -X GET http://localhost:5000/api/v1/admin/products/stats/overview \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product statistics retrieved",
  "data": {
    "summary": {
      "totalProducts": 500,
      "availableProducts": 480,
      "unavailableProducts": 20
    },
    "aggregate": {
      "totalValue": 2500000,
      "avgPrice": 5000,
      "minPrice": 100,
      "maxPrice": 100000,
      "totalStock": 5000,
      "avgRating": 4.2
    },
    "byCategory": [
      {
        "_id": "electronics",
        "count": 150,
        "avgPrice": 25000,
        "totalStock": 1500
      },
      {
        "_id": "clothing",
        "count": 200,
        "avgPrice": 1500,
        "totalStock": 2000
      }
    ]
  }
}
```

---

## Examples with Different Scenarios

### Scenario 1: Seasonal Discount Update

**Goal:** Apply 20% discount to all summer items

```bash
# Step 1: Get summer products
curl -X GET "http://localhost:5000/api/v1/admin/products?category=summer&limit=100" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[].(_id + " " + .price)' > summer_products.txt

# Step 2: Extract product IDs (process the output)
# Step 3: Calculate 80% of price as new discounted price
# Step 4: Bulk update

curl -X PATCH http://localhost:5000/api/v1/admin/products/bulk/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["id1", "id2", "id3"],
    "updates": {
      "discountedPrice": "calculated_value"
    }
  }'
```

### Scenario 2: Restocking Alert

**Goal:** Find and restock items with low stock

```bash
# Get low stock items
curl -X GET "http://localhost:5000/api/v1/admin/products/stats/overview" \
  -H "Authorization: Bearer $TOKEN"

# Update stock for specific product
curl -X PATCH http://localhost:5000/api/v1/admin/products/PRODUCT_ID/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 500
  }'
```

### Scenario 3: Product Search & Filter

**Goal:** Find expensive electronics from last month

```bash
curl -X GET "http://localhost:5000/api/v1/admin/products?category=electronics&minPrice=50000&maxPrice=200000&sortBy=createdAt&sortOrder=-1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 4: Batch Price Adjustment

**Goal:** Apply 15% price increase across all products

```bash
# Step 1: Fetch all products with pagination
# Step 2: Calculate new prices
# Step 3: Bulk update with new prices

curl -X PATCH http://localhost:5000/api/v1/admin/products/bulk/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["id1", "id2", "id3", "..."],
    "updates": {
      "price": "new_calculated_price"
    }
  }'
```

---

## Client-Side Implementation Examples

### JavaScript/Node.js Class

```javascript
class AdminProductAPI {
  constructor(baseURL = 'http://localhost:5000/api/v1', token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async createProduct(productData) {
    const response = await fetch(`${this.baseURL}/admin/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    return response.json();
  }

  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseURL}/admin/products?${params}`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
    return response.json();
  }

  async getProductById(id) {
    const response = await fetch(`${this.baseURL}/admin/products/${id}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async updateProduct(id, updates) {
    const response = await fetch(`${this.baseURL}/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async updateStock(id, stock) {
    const response = await fetch(`${this.baseURL}/admin/products/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stock })
    });
    return response.json();
  }

  async deleteProduct(id) {
    const response = await fetch(`${this.baseURL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async bulkUpdate(productIds, updates) {
    const response = await fetch(`${this.baseURL}/admin/products/bulk/update`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productIds, updates })
    });
    return response.json();
  }

  async getStatistics() {
    const response = await fetch(`${this.baseURL}/admin/products/stats/overview`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }
}

// Usage
const api = new AdminProductAPI('http://localhost:5000/api/v1', accessToken);

// Create product
const product = await api.createProduct({
  name: 'Headphones',
  description: 'Premium headphones',
  category: 'electronics',
  price: 8999,
  stock: 100,
  shopId: 'shop-id'
});

// Get products with filters
const products = await api.getProducts({
  page: 1,
  limit: 20,
  category: 'electronics',
  minPrice: 5000,
  maxPrice: 15000
});
```

---

## Common Error Scenarios & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| "No token provided" | Missing Authorization header | Include `Authorization: Bearer TOKEN` |
| "Invalid token" | Token expired or wrong secret | Get new token from login endpoint |
| "Not authorized" | User is not admin/owner | Login with admin account or shop owner |
| "Validation Error" | Invalid field types/values | Check field types and constraints |
| "Product not found" | Invalid product ID | Ensure product exists and ID is correct |
| "Shop not found" | Invalid shop ID | Verify shop ID exists |

---

## Performance Tips

1. **Use Pagination** - Don't fetch unlimited products
   ```bash
   ?page=1&limit=50  # Good
   # Don't use: ?limit=10000  # Bad
   ```

2. **Filter Early** - Reduce data on server
   ```bash
   ?category=electronics&minPrice=5000&maxPrice=15000
   ```

3. **Use Bulk Operations** - Update multiple products at once
   ```bash
   # Good: 1 request for 100 products
   # Bad: 100 requests for 100 products
   ```

4. **Sort Server-Side** - Don't sort enormous datasets client-side
   ```bash
   ?sortBy=price&sortOrder=1
   ```

5. **Cache Statistics** - Don't fetch stats on every page load
   ```javascript
   const stats = await api.getStatistics();
   localStorage.setItem('stats', JSON.stringify(stats));
   ```

---

## Security Best Practices

1. ✅ **Always verify authorization** - Check user role and ownership
2. ✅ **Validate input** - Server-side validation always
3. ✅ **Use HTTPS** - Only in production
4. ✅ **Rate limit** - Prevent API abuse
5. ✅ **Log operations** - Track who changed what
6. ✅ **Soft deletes** - Preserve data for auditing
7. ✅ **Audit trail** - Store change history

---

## Troubleshooting

**Products not appearing:** Ensure `isAvailable: true` and check filters

**Stock showing zero:** Products with stock=0 are marked unavailable

**Can't update product:** Verify you own the shop (non-admins)

**Bulk update failing:** Ensure all product IDs are valid

**Search not working:** Data must exist in DB, search is case-insensitive

---

## Next Steps

1. ✅ Admin Product API - Complete
2. Create Shop Management endpoints
3. Create Order Management endpoints
4. Implement image upload service
5. Add product reviews and ratings
6. Create inventory alerts
7. Implement analytics dashboard

---

**Last Updated:** February 19, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
