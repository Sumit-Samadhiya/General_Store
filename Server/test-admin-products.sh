#!/bin/bash

# Admin Product Management API - Testing Script
# This script contains cURL commands to test all admin product endpoints

API_BASE_URL="http://localhost:5000/api/v1"

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Sample data
SHOP_ID="507f1f77bcf86cd799439011"  # Replace with actual shop ID
PRODUCT_ID=""  # Will be populated during tests

echo -e "${BLUE}========== Admin Product Management API Tests ==========${NC}\n"

# ============================================
# 1. Create Product
# ============================================
echo -e "${YELLOW}1. CREATE PRODUCT${NC}"
echo "========================================"

CREATE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Laptop",
    "description": "High-performance laptop with Intel i7 processor, 16GB RAM, and 512GB SSD storage",
    "category": "electronics",
    "price": 75000,
    "discountedPrice": 69000,
    "stock": 50,
    "images": [
      "https://example.com/products/laptop-1.jpg",
      "https://example.com/products/laptop-2.jpg"
    ],
    "shopId": "'$SHOP_ID'"
  }')

echo "$CREATE_RESPONSE" | jq .
PRODUCT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data._id')
echo -e "\n${GREEN}Created Product ID: $PRODUCT_ID${NC}\n\n"

# ============================================
# 2. Get All Products with Pagination
# ============================================
echo -e "${YELLOW}2. GET ALL PRODUCTS (with pagination and filters)${NC}"
echo "========================================"

curl -s -X GET "$API_BASE_URL/admin/products?page=1&limit=10&search=laptop&category=electronics&sortBy=price&sortOrder=-1" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .

echo ""

# ============================================
# 3. Get Single Product
# ============================================
echo -e "${YELLOW}3. GET SINGLE PRODUCT${NC}"
echo "========================================"

curl -s -X GET "$API_BASE_URL/admin/products/$PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .

echo -e "\n"

# ============================================
# 4. Update Product
# ============================================
echo -e "${YELLOW}4. UPDATE PRODUCT${NC}"
echo "========================================"

curl -s -X PUT "$API_BASE_URL/admin/products/$PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Laptop - Updated",
    "price": 72000,
    "discountedPrice": 68000,
    "stock": 45
  }' | jq .

echo -e "\n"

# ============================================
# 5. Update Product Stock
# ============================================
echo -e "${YELLOW}5. UPDATE PRODUCT STOCK${NC}"
echo "========================================"

curl -s -X PATCH "$API_BASE_URL/admin/products/$PRODUCT_ID/stock" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 35
  }' | jq .

echo -e "\n"

# ============================================
# 6. Bulk Update Products
# ============================================
echo -e "${YELLOW}6. BULK UPDATE PRODUCTS${NC}"
echo "========================================"

curl -s -X PATCH "$API_BASE_URL/admin/products/bulk/update" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["'$PRODUCT_ID'"],
    "updates": {
      "price": 70000,
      "discountedPrice": 66000
    }
  }' | jq .

echo -e "\n"

# ============================================
# 7. Get Product Statistics
# ============================================
echo -e "${YELLOW}7. GET PRODUCT STATISTICS${NC}"
echo "========================================"

curl -s -X GET "$API_BASE_URL/admin/products/stats/overview" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .

echo -e "\n"

# ============================================
# 8. Search Products
# ============================================
echo -e "${YELLOW}8. SEARCH PRODUCTS${NC}"
echo "========================================"

curl -s -X GET "$API_BASE_URL/admin/products?search=laptop&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .

echo -e "\n"

# ============================================
# 9. Filter by Price Range
# ============================================
echo -e "${YELLOW}9. FILTER BY PRICE RANGE${NC}"
echo "========================================"

curl -s -X GET "$API_BASE_URL/admin/products?minPrice=50000&maxPrice=100000&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .

echo -e "\n"

# ============================================
# 10. Delete Product
# ============================================
echo -e "${YELLOW}10. DELETE PRODUCT (Soft Delete)${NC}"
echo "========================================"

curl -s -X DELETE "$API_BASE_URL/admin/products/$PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .

echo -e "\n"

# ============================================
# ERROR CASES
# ============================================
echo -e "${RED}========== ERROR TEST CASES ==========${NC}\n"

# Test 1: Missing required fields
echo -e "${YELLOW}Test: Create Product with Missing Fields${NC}"
curl -s -X POST "$API_BASE_URL/admin/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product",
    "shopId": "'$SHOP_ID'"
  }' | jq .

echo -e "\n"

# Test 2: Invalid price
echo -e "${YELLOW}Test: Create Product with Negative Price${NC}"
curl -s -X POST "$API_BASE_URL/admin/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product",
    "description": "Valid description for testing",
    "category": "test",
    "price": -1000,
    "stock": 10,
    "shopId": "'$SHOP_ID'"
  }' | jq .

echo -e "\n"

# Test 3: Invalid product ID
echo -e "${YELLOW}Test: Get Non-existent Product${NC}"
curl -s -X GET "$API_BASE_URL/admin/products/invalid-id" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .

echo -e "\n"

# Test 4: Missing token
echo -e "${YELLOW}Test: Request Without Token${NC}"
curl -s -X GET "$API_BASE_URL/admin/products" | jq .

echo -e "\n"

# Test 5: Invalid token
echo -e "${YELLOW}Test: Request With Invalid Token${NC}"
curl -s -X GET "$API_BASE_URL/admin/products" \
  -H "Authorization: Bearer invalid_token_here" | jq .

echo -e "\n"

# Test 6: Discounted price greater than actual price
echo -e "${YELLOW}Test: Discounted Price > Original Price${NC}"
curl -s -X POST "$API_BASE_URL/admin/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product",
    "description": "Valid description for testing",
    "category": "test",
    "price": 1000,
    "discountedPrice": 5000,
    "stock": 10,
    "shopId": "'$SHOP_ID'"
  }' | jq .

echo -e "\n"

# Test 7: Invalid stock value
echo -e "${YELLOW}Test: Update Stock with Negative Value${NC}"
curl -s -X PATCH "$API_BASE_URL/admin/products/$PRODUCT_ID/stock" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": -10
  }' | jq .

echo -e "\n${GREEN}========== Tests Complete ==========${NC}\n"

# ============================================
# NOTES FOR MANUAL TESTING
# ============================================
cat << 'EOF'

====== IMPORTANT INSTRUCTIONS ======

1. Replace "YOUR_TOKEN" with your actual JWT access token from login endpoint

2. Replace SHOP_ID with an actual shop ID from your database

3. Common Query Parameters:
   - page=1
   - limit=10
   - search=term
   - category=electronics
   - minPrice=1000
   - maxPrice=50000
   - sortBy=price (createdAt, price, name, stock, rating)
   - sortOrder=1 (ascending) or -1 (descending)

4. Authorization:
   - Admin users: Full access to all products
   - Shop owners: Access only to their own shop products

5. Soft Delete:
   - DELETE endpoint marks product as unavailable
   - Product is not permanently removed from database
   - Can be restored by updating isAvailable: true

6. Stock Updates:
   - When stock > 0: isAvailable = true
   - When stock = 0: isAvailable = false
   - Negative stocks are not allowed

7. Image URLs:
   - Must be valid URLs (http:// or https://)
   - Multiple images can be provided as array
   - Used for product display in frontend

8. Sorting Options:
   - createdAt (default)
   - updatedAt
   - price
   - name
   - stock
   - rating

9. Response Format:
   - All responses include "success" boolean
   - Error responses include "message" and "error"
   - Paginated responses include "pagination" object

10. Testing with Postman:
    - Import postman-collection.json
    - Set Authorization Bearer token
    - Use environment variables for IDs
    - Run with different filter combinations

EOF
