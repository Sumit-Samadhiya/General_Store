# Admin Product API - Quick Reference Card

## Base URL
```
http://localhost:5000/api/v1/admin/products
```

## Authentication
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints at a Glance

### 1️⃣ Create Product
```
POST /
❌ No query params
✅ Body: name, description, category, price, stock, shopId
📝 Response: Created product object
```

### 2️⃣ Get Products (List)
```
GET /
✅ Query params: page, limit, search, category, minPrice, maxPrice, sortBy, sortOrder
❌ No body
📝 Response: Array of products + pagination info
```

### 3️⃣ Get Statistics
```
GET /stats/overview
❌ No query params
❌ No body
📝 Response: Summary, aggregate, by-category stats
```

### 4️⃣ Get Single Product
```
GET /:id
❌ No query params
❌ No body
📝 Response: Single product object with details
```

### 5️⃣ Update Product
```
PUT /:id
❌ No query params
✅ Body: Any product fields to update (all optional)
📝 Response: Updated product object
```

### 6️⃣ Update Stock
```
PATCH /:id/stock
❌ No query params
✅ Body: stock (required, integer >= 0)
📝 Response: Stock update confirmation
```

### 7️⃣ Delete Product (Soft)
```
DELETE /:id
❌ No query params
❌ No body
📝 Response: Deleted product object (isAvailable = false)
```

### 8️⃣ Bulk Update
```
PATCH /bulk/update
❌ No query params
✅ Body: productIds (array), updates (object with fields)
📝 Response: {matchedCount, modifiedCount}
```

---

## Quick Query Examples

| Task | Query String |
|------|--------------|
| Get page 1 | `?page=1&limit=20` |
| Search laptops | `?search=laptop` |
| Electronics only | `?category=electronics` |
| Price 50k-100k | `?minPrice=50000&maxPrice=100000` |
| Sorted by price (low→high) | `?sortBy=price&sortOrder=1` |
| Latest first | `?sortBy=createdAt&sortOrder=-1` |
| All combined | `?page=1&limit=20&search=laptop&category=electronics&minPrice=50000&maxPrice=100000&sortBy=price` |

---

## cURL Templates

### Create
```bash
curl -X POST http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"...","description":"...","category":"...","price":0,"stock":0,"shopId":"..."}'
```

### Read (List)
```bash
curl -X GET "http://localhost:5000/api/v1/admin/products?page=1&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

### Read (Single)
```bash
curl -X GET http://localhost:5000/api/v1/admin/products/PRODUCT_ID \
  -H "Authorization: Bearer TOKEN"
```

### Update
```bash
curl -X PUT http://localhost:5000/api/v1/admin/products/PRODUCT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":0,"stock":0}'
```

### Update Stock
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/products/PRODUCT_ID/stock \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stock":50}'
```

### Delete
```bash
curl -X DELETE http://localhost:5000/api/v1/admin/products/PRODUCT_ID \
  -H "Authorization: Bearer TOKEN"
```

### Statistics
```bash
curl -X GET http://localhost:5000/api/v1/admin/products/stats/overview \
  -H "Authorization: Bearer TOKEN"
```

### Bulk Update
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/products/bulk/update \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productIds":["id1","id2"],"updates":{"price":0}}'
```

---

## Field Reference

### Required Fields (Create)
| Field | Type | Example |
|-------|------|---------|
| name | String | "Laptop" |
| description | String | "High performance laptop..." |
| category | String | "electronics" |
| price | Number | 75000 |
| stock | Integer | 50 |
| shopId | String | "60d5ec49c1234567890abcde" |

### Optional Fields
| Field | Type | Example |
|-------|------|---------|
| discountedPrice | Number | 69000 |
| images | Array | ["https://...jpg"] |
| isAvailable | Boolean | true |

### Query Parameters
| Param | Type | Example |
|-------|------|---------|
| page | Number | 1 |
| limit | Number | 20 |
| search | String | "laptop" |
| category | String | "electronics" |
| minPrice | Number | 50000 |
| maxPrice | Number | 100000 |
| sortBy | String | "price" |
| sortOrder | Number | 1 or -1 |

---

## Response Examples

### Success (200/201)
```json
{
  "success": true,
  "message": "Description",
  "data": { /* response */ }
}
```

### Error (400/401/403/404/500)
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": ["field1 error", "field2 error"]
}
```

---

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation failed |
| 401 | Unauthorized | No/invalid token |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Server error |

---

## Common Operations

### Create & Get
```bash
# Create
PRODUCT=$(curl -s -X POST .../admin/products ... | jq '.data._id')

# Get the product
curl -X GET .../admin/products/$PRODUCT
```

### Update & Check
```bash
# Update price
curl -X PUT .../admin/products/PRODUCT_ID -d '{"price":99000}'

# Verify
curl -X GET .../admin/products/PRODUCT_ID
```

### Restock
```bash
curl -X PATCH .../admin/products/PRODUCT_ID/stock -d '{"stock":200}'
```

### Discount All Laptops
```bash
# Get laptop IDs
IDS=$(curl .../admin/products?search=laptop | jq '.data[]._id')

# Bulk update
curl -X PATCH .../admin/products/bulk/update \
  -d '{"productIds":['$IDS'],"updates":{"discountedPrice":80000}}'
```

---

## Quick Troubleshooting

| Problem | Check |
|---------|-------|
| "No token" | Add `Authorization: Bearer TOKEN` header |
| "Invalid token" | Re-login to get new token |
| "Not authorized" | Verify user is admin or shop owner |
| "Validation error" | Check field types and lengths |
| "Not found" | Verify product/shop ID exists |
| "Can't update" | Check ownership (non-admins) |

---

## Field Constraints

```
name: 3-100 chars
description: 10-1000 chars
category: 2+ chars
price: >= 0
discountedPrice: < price
stock: >= 0 integer
page: >= 1
limit: 1-100
```

---

## Common Search Patterns

```bash
# All electronics
?category=electronics

# Laptops under 100k
?search=laptop&maxPrice=100000

# New expensive items
?minPrice=50000&sortBy=createdAt&sortOrder=-1

# Available items only
?category=clothing&page=1&limit=50

# All products (use pagination)
?page=1&limit=100&sortBy=name
```

---

## HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Read data | Fetch product list |
| POST | Create data | Add new product |
| PUT | Update data | Update product details |
| PATCH | Partial update | Update stock only |
| DELETE | Delete data | Remove product |

---

## Remember

✅ Always use Bearer token in Authorization header  
✅ Use pagination for list endpoints  
✅ Validate input before sending  
✅ Check response status codes  
✅ Handle errors gracefully  
✅ Soft delete preserves data  
✅ Shop owners can only manage own products  
✅ Admins can manage all products  
✅ Stock = 0 makes product unavailable  
✅ Bulk operations are efficient for multiple changes  

---

## Links

- **Full API Docs:** See `ADMIN_PRODUCT_API.md`
- **Implementation Guide:** See `ADMIN_PRODUCTS_GUIDE.md`
- **Test Script:** Run `test-admin-products.sh`
- **Server:** `http://localhost:5000`

---

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Keep this handy! 📋**
