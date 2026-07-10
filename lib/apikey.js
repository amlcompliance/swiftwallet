import crypto from 'crypto';

const KEY_PREFIX = 'sk_';
const KEY_LENGTH = 32;

/**
 * Generate a new API key
 * Returns both the key (to show to user) and hash (to store in DB)
 */
export function generateApiKey() {
  const key = KEY_PREFIX + crypto.randomBytes(KEY_LENGTH).toString('hex');
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, keyHash };
}

/**
 * Hash an API key for database storage
 */
export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(key, hash) {
  const computedHash = hashApiKey(key);
  return computedHash === hash;
}

/**
 * Extract API key from Authorization header or query param
 */
export function extractApiKey(request) {
  // Check Authorization header: Bearer sk_xxx
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  // Check x-api-key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  return null;
}

/**
 * Create HMAC signature for webhook events
 */
export function createWebhookSignature(payload, secret) {
  const normalized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload, signature, secret) {
  const expected = createWebhookSignature(payload, secret);
  return expected === signature;
}

/**
 * Mask API key for display (show only last 4 chars)
 */
export function maskApiKey(key) {
  if (!key || key.length < 8) return '****';
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
}
