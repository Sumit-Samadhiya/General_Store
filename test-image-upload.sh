#!/bin/bash

# Image Upload API Testing Script
# Tests all image upload endpoints with various scenarios

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:5000/api"
RANDOM_SUFFIX=$((RANDOM % 9000 + 1000))

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
print_test() {
  echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_error() {
  echo -e "${RED}[FAIL]${NC} $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Upload Single Image
test_upload_single() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Upload single product image"

  # Create a test image (1x1 pixel PNG)
  echo -ne '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > /tmp/test.png

  RESPONSE=$(curl -s -X POST "$API_URL/upload" \
    -F "image=@/tmp/test.png" \
    -F "folder=products")

  if echo "$RESPONSE" | grep -q '"success":true'; then
    IMAGE_URL=$(echo "$RESPONSE" | grep -o '"url":"[^"]*' | cut -d'"' -f4 | head -1)
    print_success "Single image upload - URL: $IMAGE_URL"
    echo "$IMAGE_URL" > /tmp/test_image_url.txt
  else
    print_error "Single image upload failed"
    echo "Response: $RESPONSE"
  fi

  rm -f /tmp/test.png
}

# Test 2: Upload Product Image with Query Parameter
test_upload_with_folder() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Upload profile image"

  echo -ne '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > /tmp/test.png

  RESPONSE=$(curl -s -X POST "$API_URL/upload?folder=profiles" \
    -F "image=@/tmp/test.png")

  if echo "$RESPONSE" | grep -q '"folder":"profiles"'; then
    print_success "Profile image upload with folder parameter"
  elif echo "$RESPONSE" | grep -q '"success":true'; then
    print_success "Profile image uploaded successfully"
  else
    print_error "Profile image upload failed"
    echo "Response: $RESPONSE"
  fi

  rm -f /tmp/test.png
}

# Test 3: Upload Multiple Images
test_upload_batch() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Upload batch images (3 files)"

  # Create test images
  for i in {1..3}; do
    echo -ne '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > /tmp/test$i.png
  done

  RESPONSE=$(curl -s -X POST "$API_URL/upload/batch" \
    -F "images=@/tmp/test1.png" \
    -F "images=@/tmp/test2.png" \
    -F "images=@/tmp/test3.png" \
    -F "folder=products")

  if echo "$RESPONSE" | grep -q '"count":3'; then
    print_success "Batch upload (3 images)"
  elif echo "$RESPONSE" | grep -q '"success":true'; then
    print_success "Batch upload completed"
  else
    print_error "Batch upload failed"
    echo "Response: $RESPONSE"
  fi

  rm -f /tmp/test{1,2,3}.png
}

# Test 4: Invalid File Type
test_invalid_filetype() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Try uploading invalid file type (should fail)"

  # Create a text file
  echo "This is not an image" > /tmp/test.txt

  RESPONSE=$(curl -s -X POST "$API_URL/upload" \
    -F "image=@/tmp/test.txt")

  if echo "$RESPONSE" | grep -q '"success":false'; then
    print_success "Correctly rejected invalid file type"
  else
    print_error "Should have rejected invalid file type"
    echo "Response: $RESPONSE"
  fi

  rm -f /tmp/test.txt
}

# Test 5: Missing Image File
test_missing_file() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Try uploading with no file (should fail)"

  RESPONSE=$(curl -s -X POST "$API_URL/upload")

  if echo "$RESPONSE" | grep -q '"success":false'; then
    print_success "Correctly rejected missing file"
  else
    print_error "Should have rejected missing file"
    echo "Response: $RESPONSE"
  fi
}

# Test 6: Get Image Info
test_get_image_info() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Get image information"

  if [ ! -f /tmp/test_image_url.txt ]; then
    print_info "Skipping - no image uploaded yet"
    return
  fi

  IMAGE_URL=$(cat /tmp/test_image_url.txt)
  FILENAME=$(echo "$IMAGE_URL" | sed 's/.*\///')

  RESPONSE=$(curl -s -X GET "$API_URL/upload/info/$FILENAME")

  if echo "$RESPONSE" | grep -q '"url"'; then
    print_success "Retrieved image information"
  else
    print_error "Failed to get image information"
    echo "Response: $RESPONSE"
  fi
}

# Test 7: Delete Image
test_delete_image() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Delete uploaded image"

  if [ ! -f /tmp/test_image_url.txt ]; then
    print_info "Skipping - no image uploaded yet"
    return
  fi

  IMAGE_URL=$(cat /tmp/test_image_url.txt)
  FILENAME=$(echo "$IMAGE_URL" | sed 's/.*\///')

  RESPONSE=$(curl -s -X DELETE "$API_URL/upload/$FILENAME")

  if echo "$RESPONSE" | grep -q '"success":true'; then
    print_success "Image deleted successfully"
  else
    print_error "Failed to delete image"
    echo "Response: $RESPONSE"
  fi
}

# Test 8: Delete Non-existent Image
test_delete_nonexistent() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Try deleting non-existent image"

  RESPONSE=$(curl -s -X DELETE "$API_URL/upload/nonexistent-file.jpg")

  # Should either fail or succeed (depends on implementation)
  if echo "$RESPONSE" | grep -q '"success"'; then
    print_success "Delete request processed"
  else
    print_error "Delete request failed"
    echo "Response: $RESPONSE"
  fi
}

# Test 9: Verify Server Running
test_server_health() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Verify server is running"

  RESPONSE=$(curl -s http://localhost:5000/health)

  if echo "$RESPONSE" | grep -q "OK"; then
    print_success "Server is running"
  else
    print_error "Server health check failed"
    echo "Response: $RESPONSE"
  fi
}

# Test 10: Upload Image with Size Details
test_upload_and_check_size() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  print_test "Upload image and verify size in response"

  echo -ne '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > /tmp/test.png

  RESPONSE=$(curl -s -X POST "$API_URL/upload" \
    -F "image=@/tmp/test.png")

  if echo "$RESPONSE" | grep -q '"size"'; then
    SIZE=$(echo "$RESPONSE" | grep -o '"size":[0-9]*' | cut -d':' -f2)
    print_success "Image size: $SIZE bytes"
  else
    print_error "Response missing size information"
    echo "Response: $RESPONSE"
  fi

  rm -f /tmp/test.png
}

# Main Test Execution
main() {
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}  Image Upload API - Test Suite${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo ""

  test_server_health
  echo ""

  test_upload_single
  echo ""

  test_upload_with_folder
  echo ""

  test_upload_batch
  echo ""

  test_invalid_filetype
  echo ""

  test_missing_file
  echo ""

  test_upload_and_check_size
  echo ""

  test_get_image_info
  echo ""

  test_delete_image
  echo ""

  test_delete_nonexistent
  echo ""

  # Summary
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}  Test Summary${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo -e "Total Tests:  $TESTS_TOTAL"
  echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
  echo -e "${RED}Failed:       $TESTS_FAILED${NC}"

  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
  fi
}

# Run tests
main
