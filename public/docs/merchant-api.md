# Merchant API Documentation

## Overview

The Merchant API allows merchants to integrate SwiftWallet into their own websites and e-commerce platforms. Merchants can programmatically create payments, check transaction status, manage webhooks, and track usage analytics.

## Authentication

All API requests must be authenticated using an API key. API keys can be generated from your merchant dashboard.

### Methods

#### 1. Bearer Token (Recommended)
```bash
curl -H "Authorization: Bearer sk_your_api_key_here" \
  https://api.swiftwallet.local/api/merchant/...
```

#### 2. Header
```bash
curl -H "x-api-key: sk_your_api_key_here" \
  https://api.swiftwallet.local/api/merchant/...
```

## API Endpoints

### 1. API Key Management

#### List API Keys
```
GET /api/merchant/apikeys
Authentication: Required (Session)
```

**Response:**
```json
[
  {
    "id": "key_123",
    "name": "Production Key",
    "mode": "live",
    "isActive": true,
    "lastUsedAt": "2026-07-09T22:30:00Z",
    "createdAt": "2026-07-09T12:00:00Z",
    "expiresAt": null,
    "rateLimit": 100,
    "_count": {
      "ipWhitelists": 2
    }
  }
]
```

#### Create API Key
```
POST /api/merchant/apikeys
Authentication: Required (Session)

Body:
{
  "name": "My API Key",
  "mode": "sandbox",  // sandbox or live
  "rateLimit": 100    // optional, defaults to 100
}
```

**Response:** (201)
```json
{
  "message": "API key created. Save this key securely...",
  "key": "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "apiKey": {
    "id": "key_123",
    "name": "My API Key",
    "mode": "sandbox",
    "masked": "sk_xxxxxxxxxxxx",
    "isActive": true,
    "createdAt": "2026-07-09T22:30:00Z",
    "rateLimit": 100
  }
}
```

#### Revoke API Key
```
DELETE /api/merchant/apikeys/{keyId}
Authentication: Required (Session)
```

#### Update API Key
```
PATCH /api/merchant/apikeys/{keyId}
Authentication: Required (Session)

Body:
{
  "name": "Updated Name",
  "rateLimit": 200,
  "isActive": false,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

### 2. Payments

#### Create Collection (Incoming Payment)
```
POST /api/merchant/payments/create-collection
Authentication: Required (API Key)

Body:
{
  "amount": 1000,
  "currency": "PHP",
  "description": "Order #12345",
  "customerEmail": "customer@example.com",
  "metadata": {
    "orderId": "12345",
    "customerId": "cust_123"
  }
}
```

**Response:** (201)
```json
{
  "message": "Collection created successfully",
  "transaction": {
    "id": 1,
    "reference": "MER-1720608600000",
    "amount": 1000,
    "status": "PENDING",
    "externalId": "ext_swiftpay_123"
  },
  "swiftpayResponse": {
    "id": "ext_swiftpay_123",
    "status": "PENDING"
  }
}
```

#### Create Disbursement (Outgoing Payment)
```
POST /api/merchant/payments/create-disbursement
Authentication: Required (API Key)

Body:
{
  "amount": 500,
  "currency": "PHP",
  "description": "Refund",
  "recipient": "merchant@bank.com",
  "metadata": {
    "refundId": "ref_123"
  }
}
```

#### Check Transaction Status
```
GET /api/merchant/payments/status?reference=MER-1720608600000
GET /api/merchant/payments/status?id=1
Authentication: Required (API Key)
```

**Response:**
```json
{
  "id": 1,
  "type": "COLLECTION",
  "reference": "MER-1720608600000",
  "externalId": "ext_swiftpay_123",
  "amount": 1000,
  "currency": "PHP",
  "status": "EXECUTED",
  "provider": "SWIFTPAY",
  "createdAt": "2026-07-09T22:30:00Z",
  "updatedAt": "2026-07-09T22:35:00Z"
}
```

### 3. Analytics & Usage

#### Get Usage Analytics
```
GET /api/merchant/usage?days=30&limit=100
Authentication: Required (API Key)
```

**Response:**
```json
{
  "period": {
    "since": "2026-06-09T22:30:00Z",
    "days": 30,
    "until": "2026-07-09T22:30:00Z"
  },
  "summary": {
    "totalRequests": 1523,
    "successCount": 1498,
    "errorCount": 25,
    "successRate": "98.36%",
    "avgResponseTime": "245ms"
  },
  "byEndpoint": {
    "/api/merchant/payments/create-collection": {
      "count": 892,
      "errors": 12,
      "avgTime": 234
    }
  },
  "byStatusCode": {
    "200": 1498,
    "400": 15,
    "401": 10
  },
  "recentRequests": [...]
}
```

### 4. IP Whitelist

#### List IP Whitelists
```
GET /api/merchant/apikeys/{keyId}/ipwhitelist
Authentication: Required (Session)
```

#### Add IP to Whitelist
```
POST /api/merchant/apikeys/{keyId}/ipwhitelist
Authentication: Required (Session)

Body:
{
  "ipAddress": "192.168.1.1",
  "description": "Production Server"
}
```

#### Remove IP from Whitelist
```
DELETE /api/merchant/apikeys/{keyId}/ipwhitelist/{ipId}
Authentication: Required (Session)
```

### 5. Webhooks

#### List Webhooks
```
GET /api/merchant/apikeys/{keyId}/webhooks
Authentication: Required (Session)
```

#### Create Webhook
```
POST /api/merchant/apikeys/{keyId}/webhooks
Authentication: Required (Session)

Body:
{
  "url": "https://yoursite.com/webhooks/swiftpay",
  "events": "payment.completed,payment.failed,disbursement.completed"
}
```

**Response:** (201)
```json
{
  "message": "Webhook created. Save the secret for signature verification.",
  "webhook": {
    "id": "hook_123",
    "url": "https://yoursite.com/webhooks/swiftpay",
    "events": "payment.completed,payment.failed",
    "secret": "whsec_xxxxxxxxxxxxxxxxxxxxx",
    "isActive": true
  }
}
```

#### Update Webhook
```
PATCH /api/merchant/apikeys/{keyId}/webhooks/{webhookId}
Authentication: Required (Session)

Body:
{
  "url": "https://newurl.com/webhooks",
  "events": "payment.completed",
  "isActive": false
}
```

#### Delete Webhook
```
DELETE /api/merchant/apikeys/{keyId}/webhooks/{webhookId}
Authentication: Required (Session)
```

#### Get Webhook Deliveries
```
GET /api/merchant/apikeys/{keyId}/webhooks/{webhookId}/deliveries?status=pending&limit=50&offset=0
Authentication: Required (Session)

Query Parameters:
- status: pending, success, failed
- limit: number of results (default: 50)
- offset: pagination offset (default: 0)
```

#### Retry/Cancel Delivery
```
POST /api/merchant/apikeys/{keyId}/webhooks/{webhookId}/deliveries/{deliveryId}
Authentication: Required (Session)

Body:
{
  "action": "retry"  // or "cancel"
}
```

## Webhook Events

### Event Types

- `payment.completed` - Payment collection succeeded
- `payment.failed` - Payment collection failed
- `payment.pending` - Payment collection pending
- `disbursement.completed` - Disbursement succeeded
- `disbursement.failed` - Disbursement failed

### Webhook Payload

```json
{
  "event": "payment.completed",
  "timestamp": "2026-07-09T22:30:00Z",
  "data": {
    "id": 1,
    "type": "COLLECTION",
    "reference": "MER-1720608600000",
    "amount": 1000,
    "currency": "PHP",
    "status": "EXECUTED",
    "externalId": "ext_swiftpay_123"
  }
}
```

### Signature Verification

All webhook deliveries include an `X-Webhook-Signature` header. Verify it using:

```javascript
const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const secret = 'whsec_xxxxx'; // Saved when creating webhook

const body = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

if (signature === expectedSignature) {
  // Valid signature
} else {
  // Invalid signature - reject
}
```

## Rate Limiting

API requests are rate limited based on your API key's configuration (default: 100 requests/minute).

Response headers:
- `X-RateLimit-Limit` - Total requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Unix timestamp when limit resets

When rate limit exceeded: `HTTP 429 Too Many Requests`

## Error Handling

### Standard Error Response

```json
{
  "message": "Error description",
  "error": "Additional details (optional)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid API key)
- `403` - Forbidden (key inactive, expired, or IP not whitelisted)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limited)
- `500` - Server Error

## Code Examples

### Python
```python
import requests

api_key = "sk_your_api_key_here"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Create collection
response = requests.post(
    "https://api.swiftwallet.local/api/merchant/payments/create-collection",
    headers=headers,
    json={
        "amount": 1000,
        "currency": "PHP",
        "description": "Order #12345",
        "customerEmail": "customer@example.com"
    }
)

transaction = response.json()
print(f"Reference: {transaction['transaction']['reference']}")
```

### Node.js
```javascript
const fetch = require('node-fetch');

const apiKey = 'sk_your_api_key_here';
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

const response = await fetch(
  'https://api.swiftwallet.local/api/merchant/payments/create-collection',
  {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: 1000,
      currency: 'PHP',
      description: 'Order #12345',
      customerEmail: 'customer@example.com'
    })
  }
);

const data = await response.json();
console.log(`Reference: ${data.transaction.reference}`);
```

### PHP
```php
<?php
$apiKey = 'sk_your_api_key_here';
$url = 'https://api.swiftwallet.local/api/merchant/payments/create-collection';

$data = [
    'amount' => 1000,
    'currency' => 'PHP',
    'description' => 'Order #12345',
    'customerEmail' => 'customer@example.com'
];

$options = [
    'http' => [
        'header' => "Authorization: Bearer $apiKey\r\nContent-Type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);
$transaction = json_decode($response, true);
echo "Reference: " . $transaction['transaction']['reference'];
?>
```

## Best Practices

1. **Secure Your API Keys**
   - Never commit keys to version control
   - Store in environment variables
   - Rotate keys periodically

2. **IP Whitelisting**
   - Whitelist your server IPs for security
   - Review and update as infrastructure changes

3. **Handle Webhooks**
   - Always verify signatures
   - Implement idempotency for duplicate prevention
   - Respond within 5 seconds to acknowledge delivery

4. **Error Handling**
   - Implement exponential backoff for retries
   - Log all API interactions for debugging
   - Monitor rate limit headers

5. **Testing**
   - Use sandbox mode for development
   - Test webhook deliveries thoroughly
   - Verify rate limiting behavior

## Support

For questions or issues:
- Email: support@swiftwallet.local
- Documentation: https://docs.swiftwallet.local
- Status: https://status.swiftwallet.local
