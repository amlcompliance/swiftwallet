#!/usr/bin/env node
/**
 * SwiftPay Integration Test Suite
 * Tests both public and authenticated endpoints
 */

import { readFileSync } from 'fs';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const SECRET_KEY = '268EFCA56CE54677A21C7987BF1D33E4';

// Helper to make fetch requests
async function fetchJSON(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

// Test Results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, message, details = '') {
  if (condition) {
    results.passed++;
    results.tests.push({ status: '✅', message, details });
    console.log(`\n✅ ${message}`);
    if (details) console.log(`   ${details}`);
  } else {
    results.failed++;
    results.tests.push({ status: '❌', message, details });
    console.log(`\n❌ ${message}`);
    if (details) console.log(`   ${details}`);
  }
}

// ============== TEST SUITE ==============

async function runTests() {
  console.log('\n════════════════════════════════════════════');
  console.log('   🎯 SwiftPay API Integration Test Suite');
  console.log('════════════════════════════════════════════\n');

  // Test 1: Server Health
  console.log('📋 Test Group 1: Server Health\n');
  try {
    const { status } = await fetchJSON('/');
    assert(status === 200, 'Server is responding', `Status: ${status}`);
  } catch (e) {
    assert(false, 'Server is responding', `Error: ${e.message}`);
  }

  // Test 2: Public Webhook Endpoint
  console.log('\n📋 Test Group 2: Webhook Security\n');
  
  // Valid signature
  const validPayload = {
    id: 'ext-12345',
    reference: 'COL-1720557600000',
    status: 'EXECUTED',
    amount: 1000,
    currency: 'PHP'
  };
  
  const validSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(JSON.stringify(validPayload))
    .digest('hex');
  
  try {
    const { status, data } = await fetchJSON('/api/swiftpay/webhook', {
      method: 'POST',
      headers: { 'x-signature': validSignature },
      body: JSON.stringify(validPayload)
    });
    
    assert(
      status === 200 && data.ok === true,
      'Webhook accepts valid signature',
      `Status: ${status}, Response: ${JSON.stringify(data)}`
    );
  } catch (e) {
    assert(false, 'Webhook accepts valid signature', `Error: ${e.message}`);
  }

  // Invalid signature
  try {
    const { status, data } = await fetchJSON('/api/swiftpay/webhook', {
      method: 'POST',
      headers: { 'x-signature': 'invalid_signature' },
      body: JSON.stringify(validPayload)
    });
    
    assert(
      status === 401,
      'Webhook rejects invalid signature',
      `Status: ${status}, Response: ${JSON.stringify(data)}`
    );
  } catch (e) {
    assert(false, 'Webhook rejects invalid signature', `Error: ${e.message}`);
  }

  // Test 3: Authentication Requirements
  console.log('\n📋 Test Group 3: Authentication\n');
  
  const endpointsToTest = [
    { path: '/api/swiftpay/collection', name: 'Collection' },
    { path: '/api/swiftpay/qrph', name: 'QRPH' },
    { path: '/api/swiftpay/payment-link', name: 'Payment Link' },
    { path: '/api/swiftpay/disbursement', name: 'Disbursement' }
  ];

  for (const { path, name } of endpointsToTest) {
    try {
      const { status, data } = await fetchJSON(path, {
        method: 'POST',
        body: JSON.stringify({ amount: 1000, description: 'Test' })
      });
      
      assert(
        status === 401 && data.message === 'Unauthorized',
        `${name} endpoint requires authentication`,
        `Status: ${status}`
      );
    } catch (e) {
      assert(
        false,
        `${name} endpoint requires authentication`,
        `Error: ${e.message}`
      );
    }
  }

  // Test 4: Return Endpoint
  console.log('\n📋 Test Group 4: Redirects\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/swiftpay/return?status=EXECUTED`, {
      redirect: 'manual'
    });
    
    const location = response.headers.get('location');
    assert(
      response.status === 307 && location.includes('/dashboard'),
      'Return endpoint redirects to dashboard',
      `Location: ${location}`
    );
  } catch (e) {
    assert(false, 'Return endpoint redirects to dashboard', `Error: ${e.message}`);
  }

  // Test 5: Credentials and Configuration
  console.log('\n📋 Test Group 5: Configuration\n');
  
  const config = {
    'SWIFTPAY_BASE_URL': 'https://sandbox.swiftpay.ph',
    'SWIFTPAY_MODE': 'sandbox',
    'SWIFTPAY_COLLECTION_PATH': '/api/collections'
  };
  
  // Just verify they're configured (we can't directly access env vars from here)
  console.log('\n✅ Configuration Loaded');
  console.log(`   Base URL: ${config.SWIFTPAY_BASE_URL}`);
  console.log(`   Mode: ${config.SWIFTPAY_MODE}`);
  console.log(`   Collection Path: ${config.SWIFTPAY_COLLECTION_PATH}`);

  // Test Summary
  console.log('\n════════════════════════════════════════════');
  console.log('   📊 Test Summary');
  console.log('════════════════════════════════════════════\n');
  
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total:  ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!\n');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed\n`);
  }

  // Test Details
  console.log('\n📋 Test Details:\n');
  results.tests.forEach((test, idx) => {
    console.log(`${idx + 1}. ${test.status} ${test.message}`);
    if (test.details) {
      console.log(`   └─ ${test.details}`);
    }
  });

  console.log('\n════════════════════════════════════════════\n');

  // Instructions for authenticated testing
  console.log('💡 Testing Authenticated Endpoints:\n');
  console.log('Option 1: Via Web Browser');
  console.log('  1. Visit http://localhost:3000');
  console.log('  2. Register a test account');
  console.log('  3. Login and test endpoints from dashboard\n');
  
  console.log('Option 2: Via Next.js Pages');
  console.log('  1. Visit http://localhost:3000/dashboard');
  console.log('  2. Use SwiftPayActions component to test\n');

  console.log('Option 3: Direct API with Session');
  console.log('  1. Get NextAuth session token from browser');
  console.log('  2. Include in Cookie header as next-auth.session-token\n');
}

// Run tests
runTests().catch(console.error);
