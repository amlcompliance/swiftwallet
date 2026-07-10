import crypto from 'crypto';

const SWIFTPAY_BASE_URL = process.env.SWIFTPAY_BASE_URL || 'https://sandbox.swiftpay.ph';
const SWIFTPAY_ACCESS_KEY = process.env.SWIFTPAY_ACCESS_KEY || '';
const SWIFTPAY_SECRET_KEY = process.env.SWIFTPAY_SECRET_KEY || '';
const SWIFTPAY_MODE = process.env.SWIFTPAY_MODE || 'sandbox';
const SWIFTPAY_COLLECTION_PATH = process.env.SWIFTPAY_COLLECTION_PATH || '/api/collections';
const SWIFTPAY_QRPH_PATH = process.env.SWIFTPAY_QRPH_PATH || '/api/qrph';
const SWIFTPAY_PAYMENT_LINK_PATH = process.env.SWIFTPAY_PAYMENT_LINK_PATH || '/api/payment-links';
const SWIFTPAY_DISBURSEMENT_PATH = process.env.SWIFTPAY_DISBURSEMENT_PATH || '/api/disbursements';
const SWIFTPAY_ACCESS_HEADER = process.env.SWIFTPAY_ACCESS_HEADER || 'x-access-key';
const SWIFTPAY_SIGNATURE_HEADER = process.env.SWIFTPAY_SIGNATURE_HEADER || 'x-signature';
const SWIFTPAY_MODE_HEADER = process.env.SWIFTPAY_MODE_HEADER || 'x-mode';

export function createSignature(payload, secretKey) {
  const normalized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secretKey).update(normalized).digest('hex');
}

export function verifySignature(payload, signature, secretKey) {
  const expected = createSignature(payload, secretKey);
  return expected === signature;
}

function createHeaders(payload) {
  return {
    'Content-Type': 'application/json',
    [SWIFTPAY_ACCESS_HEADER]: SWIFTPAY_ACCESS_KEY,
    [SWIFTPAY_SIGNATURE_HEADER]: createSignature(payload, SWIFTPAY_SECRET_KEY),
    [SWIFTPAY_MODE_HEADER]: SWIFTPAY_MODE,
  };
}

async function postSwiftPay(path, payload) {
  if (!SWIFTPAY_ACCESS_KEY || !SWIFTPAY_SECRET_KEY) {
    throw new Error('SwiftPay credentials are not configured');
  }

  const response = await fetch(`${SWIFTPAY_BASE_URL}${path}`, {
    method: 'POST',
    headers: createHeaders(payload),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SwiftPay request failed (${response.status}): ${body}`);
  }

  return response.json();
}

export async function createCollection(payload) {
  return postSwiftPay(SWIFTPAY_COLLECTION_PATH, payload);
}

export async function createQrPh(payload) {
  return postSwiftPay(SWIFTPAY_QRPH_PATH, payload);
}

export async function createPaymentLink(payload) {
  return postSwiftPay(SWIFTPAY_PAYMENT_LINK_PATH, payload);
}

export async function createDisbursement(payload) {
  return postSwiftPay(SWIFTPAY_DISBURSEMENT_PATH, payload);
}
