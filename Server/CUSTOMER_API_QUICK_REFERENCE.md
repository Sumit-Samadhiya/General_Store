# Customer Website API - Quick Reference

## 🎯 Quick Links

- **Full Documentation:** See [CUSTOMER_API_DOCUMENTATION.md](./CUSTOMER_API_DOCUMENTATION.md)
- **Test Script:** Run `bash test-customer-api.sh`
- **Postman Collection:** Import `postman-customer-api-collection.json`

---

## 📱 Public Product Endpoints (No Auth Required)

### Get All Products
```
GET /api/products?page=1&limit=20&search=term&category=cat&minPrice=100&maxPrice=5000&sortBy=price&sortOrder=1
```

### Get Categories
```
GET /api/products/categories
```

Response:
```json
[
  {"name": "electronics", "count": 150, "minPrice": 5000, "maxPrice": 500000, "avgPrice": 85000},
  {"name": "clothing", "count": 320, "minPrice": 500, "maxPrice": 15000, "avgPrice": 3500}
]
```

### Search Products
```
GET /api/products/search?q=laptop&category=electronics&minPrice=50000&maxPrice=100000
```

### Get Products by Category
```
GET /api/products/category/electronics?page=1&limit=20&sortBy=price&sortOrder=1
```

### Get Products by Shop
```
GET /api/products/shop/60d5ec42c1234567890abcdc?page=1&limit=20
```

### Get Single Product
```
GET /api/products/60d5ec49c1234567890abcde
```

---

## 🛒 Cart Endpoints (Auth Required)

**Header:** `Authorization: Bearer <TOKEN>`

### Get Cart
```
GET /api/cart
```

### Get Cart Summary
```
GET /api/cart/summary
```

Response:
```json
{
  "itemCount": 5,
  "total": 154500,
  "items": 2,
  "isEmpty": false
}
```

### Add to Cart
```
POST /api/cart
{
  "productId": "60d5ec49c1234567890abcde",
  "quantity": 2
}
```

### Update Item Quantity
```
PUT /api/cart/60d5ec50c1234567890abcdf
{
  "quantity": 5
}
```

### Remove Item
```
DELETE /api/cart/60d5ec50c1234567890abcdf
```

### Clear Cart
```
DELETE /api/cart
```

---

## 📊 Query Parameters Reference

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Search & Filter
- `search` - Search in name/description
- `q` - Search query (required for /search)
- `category` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price

### Sorting
- `sortBy` - Field: name, price, rating, createdAt (default: createdAt)
- `sortOrder` - 1 (ascending) or -1 (descending) (default: -1)

---

## 🔑 Example Workflows

### 1. Browse Products
```bash
# Get categories
curl http://localhost:5000/api/products/categories

# Browse electronics (sorted by rating, newest first)
curl "http://localhost:5000/api/products/category/electronics?sortBy=rating&sortOrder=-1"

# Search specific product
curl "http://localhost:5000/api/products/search?q=laptop"
```

### 2. View Product Details
```bash
curl http://localhost:5000/api/products/60d5ec49c1234567890abcde
```

### 3. Shopping Flow
```bash
# Login first
curl -X POST http://localhost:5000/api/v1/auth/login \
  -d '{"email":"user@example.com","password":"pass"}' \
  -H "Content-Type: application/json"

# Save token
TOKEN="<accessToken from response>"

# Add to cart (quantity 2)
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"60d5ec49c1234567890abcde","quantity":2}'

# View cart
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN"

# Update quantity to 5
curl -X PUT http://localhost:5000/api/cart/60d5ec50c1234567890abcdf \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":5}'

# Get cart summary
curl http://localhost:5000/api/cart/summary \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Description",
  "data": { /* ... */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Technical details"
}
```

### Pagination in List Responses
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

---

## ✅ HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal error |

---

## 🛡️ Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "No token provided" | Missing Authorization header | Add `Authorization: Bearer TOKEN` |
| "Product not found" | Invalid product ID | Use correct product ID |
| "Only X item(s) available" | Stock exceeded | Reduce quantity |
| "Invalid product ID format" | Bad ObjectId | Use valid MongoDB ObjectId |
| "Cart not found" | User has no cart | Cart is auto-created on first add |

---

## 🔄 Field Types & Constraints

**Product Fields:**
- name: String (required)
- description: String (required)
- category: String (required)
- price: Number > 0 (required)
- discountedPrice: Number < price
- stock: Integer >= 0
- isAvailable: Boolean (auto-calculated)
- rating: Number 0-5
- reviewCount: Integer

**Cart Item Fields:**
- productId: MongoDB ObjectId
- quantity: Integer >= 1
- price: Number > 0 (from product)
- subtotal: Calculated (price × quantity)

---

## 🚀 Tips & Tricks

✅ **Use pagination** - Always use `page` and `limit` for list endpoints  
✅ **Filter efficiently** - Combine filters to narrow results  
✅ **Sort by rating** - Use `sortBy=rating&sortOrder=-1` for best products  
✅ **Search before browse** - Use search for specific items  
✅ **Cache categories** - Don't refetch categories on every page load  
✅ **Check stock** - Verify `stock > 0` before adding to cart  
✅ **Store token safely** - Keep JWT tokens secure on frontend  
✅ **Handle errors** - Always check `success` field  

---

## 📈 Performance Tips

- Pagination limit should be <= 100 (default: 20)
- Don't fetch all products without pagination
- Use category filter to narrow results
- Cache popular categories on frontend
- Use sort to match user expectations
- Combine multiple filters for better results

---

## 🔐 Authentication

**Get Token:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Use Token:**
```bash
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Token Expiry:** 7 days (then need to refresh)

---

## 🧪 Testing

### Run Automated Tests
```bash
bash test-customer-api.sh
```

### Use Postman
1. Import `postman-customer-api-collection.json`
2. Set `access_token` variable after login
3. Run requests from the collection

### Manual Testing with cURL
See examples section above or full documentation

---

## 📞 Common Questions

**Q: How do I search for products?**  
A: Use `/api/products/search?q=laptop` or `/api/products?search=laptop`

**Q: Can I browse without logging in?**  
A: Yes, all product endpoints are public. Only cart requires auth.

**Q: How do I filter by price?**  
A: Use `minPrice` and `maxPrice` query params

**Q: How do I sort products?**  
A: Use `sortBy` (name, price, rating, createdAt) and `sortOrder` (1 or -1)

**Q: What happens to my cart?**  
A: Carts persist for 30 days and are tied to user account

**Q: Can I add out-of-stock items?**  
A: No, API returns error if `stock <= 0` or request quantity > available

---

## 🔗 Related Resources

- [Complete Documentation](./CUSTOMER_API_DOCUMENTATION.md)
- [Admin Product API](./ADMIN_API_QUICK_REFERENCE.md)
- [Database Schemas](./SCHEMAS.md)
- [Deployment Guide](./DEPLOYMENT_CHECKLIST.md)

---

## 📝 Notes

- All IDs are MongoDB ObjectIds (24-character hex strings)
- Prices are in base currency units (e.g., cents or smallest unit)
- Timestamps are ISO 8601 format
- Empty cart returns as empty array with 0 total
- Pagination uses skip/limit pattern

---

**Last Updated:** February 19, 2026  
**Status:** Production Ready ✅  
**Version:** 1.0
