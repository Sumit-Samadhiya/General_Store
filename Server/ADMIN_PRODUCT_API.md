# Admin Product Management API Documentation

## Overview

The Admin Product Management API provides comprehensive endpoints for managing product inventory. All endpoints are protected and require authentication with admin or shop owner role.

## Base URL

```
http://localhost:5000/api/v1/admin/products
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Required Roles
- `admin` - Full access to all products
- `customer` (shop owner) - Access to own shop products only

---

## Endpoints

### 1. Create Product

**Endpoint:** `POST /api/v1/admin/products`

**Authentication:** Required (Admin/Shop Owner)

**Request Body:**
```json
{
  "name": "Laptop Computer",
  "description": "High-performance laptop with 16GB RAM and 512GB SSD",
  "category": "electronics",
  "price": 50000,
  "discountedPrice": 45000,
  "stock": 25,
  "images": [
    "https://example.com/images/laptop1.jpg",
    "https://example.com/images/laptop2.jpg"
  ],
  "shopId": "507f1f77bcf86cd799439011"
}
```

**Validation Rules:**
- `name`: Required, 3-100 characters
- `description`: Required, 10-1000 characters
- `category`: Required, minimum 2 characters
- `price`: Required, must be >= 0
- `discountedPrice`: Optional, must be < price
- `stock`: Required, non-negative integer
- `images`: Optional, array of valid URLs
- `shopId`: Required, valid MongoDB ID

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Laptop Computer",
    "description": "High-performance laptop with 16GB RAM and 512GB SSD",
    "category": "electronics",
    "price": 50000,
    "discountedPrice": 45000,
    "stock": 25,
    "images": ["https://example.com/images/laptop1.jpg"],
    "isAvailable": true,
    "shopId": "507f1f77bcf86cd799439011",
    "rating": 0,
    "reviewCount": 0,
    "createdAt": "2026-02-19T10:30:00Z",
    "updatedAt": "2026-02-19T10:30:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Computer",
    "description": "High-performance laptop with 16GB RAM",
    "category": "electronics",
    "price": 50000,
    "discountedPrice": 45000,
    "stock": 25,
    "shopId": "507f1f77bcf86cd799439011"
  }'
```

---

### 2. Get All Products

**Endpoint:** `GET /api/v1/admin/products`

**Authentication:** Required (Admin/Shop Owner)

**Query Parameters:**
- `page` (number): Page number, default 1
- `limit` (number): Products per page, default 10, max 100
- `search` (string): Search in name and description
- `category` (string): Filter by category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Field to sort by, default 'createdAt'
- `sortOrder` (number): 1 for ascending, -1 for descending (default -1)

**Example Request:**
```
GET /api/v1/admin/products?page=1&limit=20&search=laptop&category=electronics&minPrice=40000&maxPrice=60000&sortBy=price&sortOrder=1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Laptop Computer",
      "description": "High-performance laptop...",
      "category": "electronics",
      "price": 50000,
      "discountedPrice": 45000,
      "stock": 25,
      "isAvailable": true,
      "shopId": {
        "_id": "507f1f77bcf86cd799439011",
        "shopName": "Tech Store"
      },
      "rating": 4.5,
      "reviewCount": 10,
      "createdAt": "2026-02-19T10:30:00Z",
      "updatedAt": "2026-02-19T10:30:00Z"
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
```

**Example cURL:**
```bash
curl -X GET "http://localhost:5000/api/v1/admin/products?page=1&limit=20&search=laptop&category=electronics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Single Product

**Endpoint:** `GET /api/v1/admin/products/:id`

**Authentication:** Required (Admin/Shop Owner)

**Path Parameters:**
- `id` (string): Product ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Laptop Computer",
    "description": "High-performance laptop with 16GB RAM and 512GB SSD",
    "category": "electronics",
    "price": 50000,
    "discountedPrice": 45000,
    "stock": 25,
    "images": ["https://example.com/images/laptop1.jpg"],
    "isAvailable": true,
    "shopId": {
      "_id": "507f1f77bcf86cd799439011",
      "shopName": "Tech Store",
      "email": "tech@store.com",
      "phone": "9876543210"
    },
    "rating": 4.5,
    "reviewCount": 10,
    "createdAt": "2026-02-19T10:30:00Z",
    "updatedAt": "2026-02-19T10:30:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/v1/admin/products/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Product

**Endpoint:** `PUT /api/v1/admin/products/:id`

**Authentication:** Required (Admin/Shop Owner)

**Path Parameters:**
- `id` (string): Product ID

**Request Body (all fields optional):**
```json
{
  "name": "Updated Laptop",
  "description": "Updated description",
  "category": "computers",
  "price": 55000,
  "discountedPrice": 50000,
  "stock": 30,
  "images": ["https://example.com/images/laptop3.jpg"],
  "isAvailable": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Updated Laptop",
    "description": "Updated description",
    "category": "computers",
    "price": 55000,
    "discountedPrice": 50000,
    "stock": 30,
    "isAvailable": true,
    "updatedAt": "2026-02-19T11:00:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X PUT http://localhost:5000/api/v1/admin/products/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 55000,
    "discountedPrice": 50000,
    "stock": 30
  }'
```

---

### 5. Delete Product (Soft Delete)

**Endpoint:** `DELETE /api/v1/admin/products/:id`

**Authentication:** Required (Admin/Shop Owner)

**Path Parameters:**
- `id` (string): Product ID

**Note:** This performs a soft delete by marking the product as unavailable instead of permanently removing it.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product deleted successfully (soft delete)",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Laptop Computer",
    "isAvailable": false,
    "updatedAt": "2026-02-19T11:30:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X DELETE http://localhost:5000/api/v1/admin/products/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Update Product Stock

**Endpoint:** `PATCH /api/v1/admin/products/:id/stock`

**Authentication:** Required (Admin/Shop Owner)

**Path Parameters:**
- `id` (string): Product ID

**Request Body:**
```json
{
  "stock": 50
}
```

**Validation Rules:**
- `stock`: Required, non-negative integer

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product stock updated successfully",
  "data": {
    "productId": "507f1f77bcf86cd799439020",
    "productName": "Laptop Computer",
    "previousStock": 25,
    "newStock": 50,
    "isAvailable": true
  }
}
```

**Example cURL:**
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/products/507f1f77bcf86cd799439020/stock \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 50
  }'
```

---

### 7. Bulk Update Products

**Endpoint:** `PATCH /api/v1/admin/products/bulk/update`

**Authentication:** Required (Admin/Shop Owner)

**Request Body:**
```json
{
  "productIds": [
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022"
  ],
  "updates": {
    "price": 45000,
    "discountedPrice": 40000,
    "category": "electronics"
  }
}
```

**Validation Rules:**
- `productIds`: Required, non-empty array of product IDs
- `updates`: Required, object with at least one field to update
  - `price`: Optional, must be >= 0
  - `discountedPrice`: Optional, must be >= 0
  - `category`: Optional
  - `isAvailable`: Optional, boolean

**Response (200 OK):**
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

**Example cURL:**
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/products/bulk/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
    "updates": {
      "price": 45000,
      "category": "electronics"
    }
  }'
```

---

### 8. Get Product Statistics

**Endpoint:** `GET /api/v1/admin/products/stats/overview`

**Authentication:** Required (Admin/Shop Owner)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product statistics retrieved",
  "data": {
    "summary": {
      "totalProducts": 150,
      "availableProducts": 145,
      "unavailableProducts": 5
    },
    "aggregate": {
      "totalValue": 7500000,
      "avgPrice": 50000,
      "minPrice": 1000,
      "maxPrice": 200000,
      "totalStock": 500,
      "avgRating": 4.3
    },
    "byCategory": [
      {
        "_id": "electronics",
        "count": 50,
        "avgPrice": 60000,
        "totalStock": 200
      },
      {
        "_id": "clothing",
        "count": 45,
        "avgPrice": 2000,
        "totalStock": 150
      }
    ]
  }
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/v1/admin/products/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Error",
  "errors": [
    "name is required",
    "price must be at least 0"
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to update this product"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error updating product",
  "error": "MongoDB connection error"
}
```

---

## Field Specifications

### Product Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | String | Yes | 3-100 chars |
| description | String | Yes | 10-1000 chars |
| category | String | Yes | 2+ chars, lowercase |
| price | Number | Yes | >= 0 |
| discountedPrice | Number | No | < price |
| stock | Number | Yes | >= 0, integer |
| images | Array | No | Valid URLs |
| isAvailable | Boolean | No | Auto-set based on stock |
| shopId | ObjectId | Yes | Valid shop ID |
| rating | Number | No | 0-5 |
| reviewCount | Number | No | >= 0 |

---

## Sorting & Pagination

### Sort Fields
- `createdAt` (default)
- `updatedAt`
- `price`
- `name`
- `stock`
- `rating`

### Sort Order
- `1` - Ascending
- `-1` - Descending (default)

### Pagination Limits
- Page: >= 1
- Limit: 1-100 (default 10)

**Example:**
```
?page=2&limit=25&sortBy=price&sortOrder=1
```

---

## Search & Filtering

### Global Search
Searches in `name` and `description` fields:
```
?search=laptop
```

### Category Filter
```
?category=electronics
```

### Price Range Filter
```
?minPrice=40000&maxPrice=60000
```

### Combined Filters
```
?search=laptop&category=electronics&minPrice=40000&maxPrice=60000&page=1&limit=20
```

---

## Authorization Rules

| Operation | Admin | Shop Owner |
|-----------|-------|-----------|
| Create Product | ✅ | ✅ (own shop) |
| View All Products | ✅ (all) | ✅ (own shop) |
| View Product | ✅ | ✅ (own) |
| Update Product | ✅ | ✅ (own) |
| Delete Product | ✅ | ✅ (own) |
| Update Stock | ✅ | ✅ (own) |
| Bulk Operations | ✅ | ✅ (own shop) |
| View Statistics | ✅ | ✅ (own shop) |

---

## Usage Examples

### JavaScript/Fetch API

#### Create Product
```javascript
const createProduct = async () => {
  const response = await fetch('http://localhost:5000/api/v1/admin/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Laptop Computer',
      description: 'High-performance laptop',
      category: 'electronics',
      price: 50000,
      stock: 25,
      shopId: 'shop-id-here'
    })
  });
  return await response.json();
};
```

#### Get Products with Filters
```javascript
const getProducts = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  const response = await fetch(
    `http://localhost:5000/api/v1/admin/products?${queryString}`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );
  return await response.json();
};

// Usage
const products = await getProducts({
  page: 1,
  limit: 20,
  category: 'electronics',
  minPrice: 40000,
  maxPrice: 60000
});
```

#### Update Stock
```javascript
const updateStock = async (productId, newStock) => {
  const response = await fetch(
    `http://localhost:5000/api/v1/admin/products/${productId}/stock`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stock: newStock })
    }
  );
  return await response.json();
};
```

---

## Best Practices

1. **Always Include Pagination** - Don't fetch unlimited products
2. **Use Search & Filters** - Reduce data transfer
3. **Validate Input Client-side** - Better UX
4. **Handle Errors Gracefully** - Show user-friendly messages
5. **Cache Responses** - Reduce API calls
6. **Batch Operations** - Use bulk update for multiple products
7. **Store Image URLs Properly** - Ensure valid URLs
8. **Track Inventory** - Keep stock updated
9. **Soft Deletes** - Preserve data history
10. **Monitor Statistics** - Track business metrics

---

## Rate Limiting

Currently no rate limiting. Implement based on needs:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated

---

## Response Headers

```
Content-Type: application/json
X-Total-Count: 150
X-Page-Number: 1
X-Page-Size: 20
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not authorized" | Verify user role and shop ownership |
| Validation errors | Check field types and length constraints |
| "Shop not found" | Ensure shopId is valid |
| Images not uploading | Provide valid image URLs |
| Stock updates failing | Ensure stock is non-negative integer |
| Search not working | Check search field has data |

---

## Upcoming Features

- ✅ Image upload integration
- ✅ Bulk price adjustments
- ✅ Product templates
- ✅ Variant management
- ✅ Inventory alerts
- ✅ Export/Import CSV

---

**Last Updated:** February 19, 2026  
**API Version:** v1  
**Status:** ✅ Production Ready
