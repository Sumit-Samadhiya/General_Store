#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000/api"
API_VERSION="v1"
CUSTOMER_EMAIL="customer@example.com"
CUSTOMER_PASSWORD="Customer@123456"

# Headers
HEADERS="-H 'Content-Type: application/json'"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
print_test() {
    echo -e "${BLUE}[TEST $TESTS_TOTAL] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Test 1: Get All Products
test_get_all_products() {
    ((TESTS_TOTAL++))
    print_test "Get All Products"
    
    response=$(curl -s "$BASE_URL/products?page=1&limit=10")
    
    if echo $response | grep -q "success"; then
        print_success "Get all products"
        product_id=$(echo $response | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ ! -z "$product_id" ]; then
            echo "  Product ID saved: $product_id"
        fi
    else
        print_error "Failed to get products"
        echo "Response: $response"
    fi
}

# Test 2: Get Categories
test_get_categories() {
    ((TESTS_TOTAL++))
    print_test "Get all Product Categories"
    
    response=$(curl -s "$BASE_URL/products/categories")
    
    if echo $response | grep -q "success"; then
        print_success "Got all categories"
        category_name=$(echo $response | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ ! -z "$category_name" ]; then
            echo "  First category: $category_name"
        fi
    else
        print_error "Failed to get categories"
    fi
}

# Test 3: Search Products
test_search_products() {
    ((TESTS_TOTAL++))
    print_test "Search Products"
    
    response=$(curl -s "$BASE_URL/products/search?q=laptop&page=1&limit=10")
    
    if echo $response | grep -q "success"; then
        print_success "Search products successful"
    else
        print_error "Search products failed"
    fi
}

# Test 4: Get Products by Category
test_get_by_category() {
    ((TESTS_TOTAL++))
    print_test "Get Products by Category"
    
    response=$(curl -s "$BASE_URL/products/category/electronics?page=1&limit=10")
    
    if echo $response | grep -q "success"; then
        print_success "Get products by category successful"
    else
        print_error "Get products by category failed"
    fi
}

# Test 5: Get Single Product
test_get_single_product() {
    ((TESTS_TOTAL++))
    print_test "Get Single Product"
    
    # First get a product ID
    response=$(curl -s "$BASE_URL/products?page=1&limit=1")
    product_id=$(echo $response | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$product_id" ]; then
        print_error "No product found to test"
        return
    fi
    
    response=$(curl -s "$BASE_URL/products/$product_id")
    
    if echo $response | grep -q "success"; then
        print_success "Get single product successful"
        echo "  Product: $(echo $response | grep -o '"name":"[^"]*"' | cut -d'"' -f4)"
    else
        print_error "Get single product failed"
    fi
}

# Test 6: Login
test_login() {
    ((TESTS_TOTAL++))
    print_test "Customer Login"
    
    response=$(curl -s -X POST "$BASE_URL/$API_VERSION/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$CUSTOMER_EMAIL\", \"password\": \"$CUSTOMER_PASSWORD\"}")
    
    if echo $response | grep -q "accessToken"; then
        print_success "Customer login successful"
        ACCESS_TOKEN=$(echo $response | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        echo "  Token obtained: ${ACCESS_TOKEN:0:20}..."
    else
        print_error "Login failed - may need to register first"
        print_info "Run registration test first, or adjust email/password"
    fi
}

# Test 7: Get Cart
test_get_cart() {
    ((TESTS_TOTAL++))
    print_test "Get User Cart"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "No access token - run login test first"
        return
    fi
    
    response=$(curl -s "$BASE_URL/cart" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo $response | grep -q "success"; then
        print_success "Get cart successful"
        item_count=$(echo $response | grep -o '"itemCount":[0-9]*' | cut -d':' -f2)
        echo "  Items in cart: $item_count"
    else
        print_error "Get cart failed"
        echo "Response: $response"
    fi
}

# Test 8: Get Cart Summary
test_get_cart_summary() {
    ((TESTS_TOTAL++))
    print_test "Get Cart Summary"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "No access token - run login test first"
        return
    fi
    
    response=$(curl -s "$BASE_URL/cart/summary" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo $response | grep -q "success"; then
        print_success "Get cart summary successful"
        echo $response | grep -o '"itemCount":[0-9]*'
    else
        print_error "Get cart summary failed"
    fi
}

# Test 9: Add to Cart
test_add_to_cart() {
    ((TESTS_TOTAL++))
    print_test "Add Item to Cart"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "No access token - run login test first"
        return
    fi
    
    # Get a product ID first
    products=$(curl -s "$BASE_URL/products?page=1&limit=1")
    product_id=$(echo $products | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$product_id" ]; then
        print_error "No products available to add to cart"
        return
    fi
    
    response=$(curl -s -X POST "$BASE_URL/cart" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"productId\": \"$product_id\", \"quantity\": 2}")
    
    if echo $response | grep -q "success"; then
        print_success "Add to cart successful"
        # Save cart item ID for later tests
        CART_ITEM_ID=$(echo $response | grep -o '"_id":"[^"]*"' | grep -v "productId" | head -1 | cut -d'"' -f4)
        echo "  Cart item ID: $CART_ITEM_ID"
    else
        print_error "Add to cart failed"
        echo "Response: $response"
    fi
}

# Test 10: Update Cart Item
test_update_cart_item() {
    ((TESTS_TOTAL++))
    print_test "Update Cart Item Quantity"
    
    if [ -z "$ACCESS_TOKEN" ] || [ -z "$CART_ITEM_ID" ]; then
        print_error "No access token or cart item ID - run add to cart test first"
        return
    fi
    
    response=$(curl -s -X PUT "$BASE_URL/cart/$CART_ITEM_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"quantity\": 5}")
    
    if echo $response | grep -q "success"; then
        print_success "Update cart item successful"
    else
        print_error "Update cart item failed"
    fi
}

# Test 11: Remove from Cart
test_remove_from_cart() {
    ((TESTS_TOTAL++))
    print_test "Remove Item from Cart"
    
    if [ -z "$ACCESS_TOKEN" ] || [ -z "$CART_ITEM_ID" ]; then
        print_error "No access token or cart item ID"
        return
    fi
    
    response=$(curl -s -X DELETE "$BASE_URL/cart/$CART_ITEM_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo $response | grep -q "success"; then
        print_success "Remove from cart successful"
    else
        print_error "Remove from cart failed"
    fi
}

# Test 12: Clear Cart
test_clear_cart() {
    ((TESTS_TOTAL++))
    print_test "Clear Entire Cart"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "No access token"
        return
    fi
    
    response=$(curl -s -X DELETE "$BASE_URL/cart" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo $response | grep -q "success"; then
        print_success "Clear cart successful"
    else
        print_error "Clear cart failed"
    fi
}

# Error scenario tests
test_invalid_product_id() {
    ((TESTS_TOTAL++))
    print_test "ERROR TEST: Invalid Product ID"
    
    response=$(curl -s "$BASE_URL/products/invalid-id")
    
    if echo $response | grep -q "success.*false"; then
        print_success "Correctly rejected invalid product ID"
    else
        print_error "Should have rejected invalid product ID"
    fi
}

test_invalid_quantity() {
    ((TESTS_TOTAL++))
    print_test "ERROR TEST: Invalid Quantity"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "No access token"
        return
    fi
    
    products=$(curl -s "$BASE_URL/products?page=1&limit=1")
    product_id=$(echo $products | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    response=$(curl -s -X POST "$BASE_URL/cart" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"productId\": \"$product_id\", \"quantity\": -1}")
    
    if echo $response | grep -q "success.*false"; then
        print_success "Correctly rejected negative quantity"
    else
        print_error "Should have rejected negative quantity"
    fi
}

test_missing_auth_token() {
    ((TESTS_TOTAL++))
    print_test "ERROR TEST: Missing Auth Token"
    
    response=$(curl -s "$BASE_URL/cart")
    
    if echo $response | grep -q "success.*false"; then
        print_success "Correctly rejected missing auth token"
    else
        print_error "Should have rejected missing token"
    fi
}

# Print banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Customer Website API - Test Suite                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Base URL: $BASE_URL${NC}"
echo ""

# Run all tests
echo -e "${YELLOW}=== PUBLIC PRODUCT TESTS ===${NC}"
test_get_all_products
test_get_categories
test_search_products
test_get_by_category
test_get_single_product

echo ""
echo -e "${YELLOW}=== AUTHENTICATION ===${NC}"
test_login

echo ""
echo -e "${YELLOW}=== CART OPERATIONS ===${NC}"
test_get_cart
test_get_cart_summary
test_add_to_cart
test_update_cart_item
test_remove_from_cart
test_clear_cart

echo ""
echo -e "${YELLOW}=== ERROR SCENARIOS ===${NC}"
test_invalid_product_id
test_invalid_quantity
test_missing_auth_token

# Print summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "Total Tests:  ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
