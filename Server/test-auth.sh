#!/bin/bash

# General Store API - Authentication Testing Examples
# These are example cURL commands to test the authentication endpoints

API_BASE_URL="http://localhost:5000/api/v1"

echo "====== General Store Authentication API Tests ======"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. Register User
# ============================================
echo -e "${YELLOW}1. REGISTER USER${NC}"
echo "======================================"
echo "POST $API_BASE_URL/auth/register"
echo ""

curl -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "9876543210",
    "role": "customer"
  }' | jq .

echo ""
echo ""

# ============================================
# 2. Login User
# ============================================
echo -e "${YELLOW}2. LOGIN USER${NC}"
echo "======================================"
echo "POST $API_BASE_URL/auth/login"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq .

# Extract tokens from login response
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken')

echo ""
echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
echo ""

# ============================================
# 3. Get Current User Profile
# ============================================
echo -e "${YELLOW}3. GET CURRENT USER PROFILE${NC}"
echo "======================================"
echo "GET $API_BASE_URL/auth/me"
echo "Authorization: Bearer $ACCESS_TOKEN"
echo ""

curl -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo ""
echo ""

# ============================================
# 4. Refresh Access Token
# ============================================
echo -e "${YELLOW}4. REFRESH ACCESS TOKEN${NC}"
echo "======================================"
echo "POST $API_BASE_URL/auth/refresh-token"
echo ""

REFRESH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "$REFRESH_RESPONSE" | jq .

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.accessToken')
echo ""
echo "New Access Token: $NEW_ACCESS_TOKEN"
echo ""

# ============================================
# 5. Request Password Reset
# ============================================
echo -e "${YELLOW}5. REQUEST PASSWORD RESET${NC}"
echo "======================================"
echo "POST $API_BASE_URL/auth/request-password-reset"
echo ""

curl -X POST "$API_BASE_URL/auth/request-password-reset" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }' | jq .

echo ""
echo "Note: Check your email for password reset link"
echo ""
echo ""

# ============================================
# 6. Reset Password (with token from email)
# ============================================
echo -e "${YELLOW}6. RESET PASSWORD${NC}"
echo "======================================"
echo "POST $API_BASE_URL/auth/reset-password"
echo ""
echo "Note: You need the token from the email link"
echo ""

# This is a placeholder - replace with actual token from email
RESET_TOKEN="YOUR_RESET_TOKEN_HERE"

echo "Example (with actual token):"
echo "curl -X POST \"$API_BASE_URL/auth/reset-password\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d \"{ \\\"token\\\": \\\"$RESET_TOKEN\\\", \\\"newPassword\\\": \\\"newpassword123\\\" }\""

echo ""
echo ""

# ============================================
# 7. Logout User
# ============================================
echo -e "${YELLOW}7. LOGOUT USER${NC}"
echo "======================================"
echo "POST $API_BASE_URL/auth/logout"
echo "Authorization: Bearer $ACCESS_TOKEN"
echo ""

curl -X POST "$API_BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo ""
echo ""

# ============================================
# Error Test Cases
# ============================================
echo -e "${YELLOW}ERROR TEST CASES${NC}"
echo "======================================"
echo ""

# Test 1: Invalid credentials
echo "Test: Invalid Credentials"
echo "POST $API_BASE_URL/auth/login (with wrong password)"
curl -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "wrongpassword"
  }' | jq .

echo ""
echo ""

# Test 2: Missing required fields
echo "Test: Missing Required Fields"
echo "POST $API_BASE_URL/auth/register (email missing)"
curl -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "password": "password123",
    "phone": "9876543211"
  }' | jq .

echo ""
echo ""

# Test 3: Invalid email format
echo "Test: Invalid Email Format"
echo "POST $API_BASE_URL/auth/login (invalid email)"
curl -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notanemail",
    "password": "password123"
  }' | jq .

echo ""
echo ""

# Test 4: Missing token
echo "Test: Missing Token"
echo "GET $API_BASE_URL/auth/me (without Authorization header)"
curl -X GET "$API_BASE_URL/auth/me" | jq .

echo ""
echo ""

# Test 5: Invalid token
echo "Test: Invalid Token"
echo "GET $API_BASE_URL/auth/me (with invalid token)"
curl -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer invalidtoken123" | jq .

echo ""
echo ""

echo -e "${GREEN}====== Tests Complete ======${NC}"
