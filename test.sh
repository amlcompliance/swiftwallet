#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
SECRET_KEY="268EFCA56CE54677A21C7987BF1D33E4"

echo "═══════════════════════════════════════════"
echo "   🎯 SwiftPay API Integration Tests"
echo "═══════════════════════════════════════════"

# Test 1: Webhook with valid signature
echo -e "\n${BLUE}🔗 Test 1: Webhook with Valid Signature${NC}\n"
PAYLOAD='{"id":"ext-12345","reference":"COL-1720557600000","status":"EXECUTED","amount":1000,"currency":"PHP"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET_KEY" -hex | cut -d' ' -f2)

echo "Payload: $PAYLOAD"
echo "Signature: $SIGNATURE"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/swiftpay/webhook" \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIGNATURE" \
  -d "$PAYLOAD")

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✅ Valid signature accepted${NC}"
else
  echo -e "${RED}❌ Test failed${NC}"
fi

# Test 2: Webhook with invalid signature
echo -e "\n${BLUE}🔐 Test 2: Webhook with Invalid Signature${NC}\n"
PAYLOAD='{"id":"ext-99999","reference":"TEST-INVALID","status":"EXECUTED"}'
SIGNATURE="invalid_signature_123"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/swiftpay/webhook" \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIGNATURE" \
  -d "$PAYLOAD")

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"
echo "Status: $STATUS"
if [ "$STATUS" == "401" ]; then
  echo -e "${GREEN}✅ Invalid signature correctly rejected${NC}"
else
  echo -e "${RED}❌ Test failed (expected 401, got $STATUS)${NC}"
fi

# Test 3: Collection endpoint without authentication
echo -e "\n${BLUE}🚫 Test 3: Collection Endpoint Without Auth${NC}\n"
PAYLOAD='{"amount":1000,"description":"Test collection"}'

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/swiftpay/collection" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY"
echo "Status: $STATUS"
if [ "$STATUS" == "401" ]; then
  echo -e "${GREEN}✅ Unauthorized access correctly rejected${NC}"
else
  echo -e "${RED}❌ Test failed (expected 401, got $STATUS)${NC}"
fi

# Test 4: Return endpoint redirect
echo -e "\n${BLUE}🔄 Test 4: Return Endpoint Redirect${NC}\n"

RESPONSE=$(curl -s -i -X GET "$BASE_URL/api/swiftpay/return?status=EXECUTED" 2>&1)

echo "$RESPONSE" | head -20
if echo "$RESPONSE" | grep -q "dashboard"; then
  echo -e "${GREEN}✅ Redirect working correctly${NC}"
else
  echo -e "${RED}⚠️  Check redirect response${NC}"
fi

echo -e "\n═══════════════════════════════════════════"
echo -e "   ✅ Test Suite Completed\n"
