#!/usr/bin/env node
import crypto from 'crypto';
import fetch from 'node-fetch';

const SECRET_KEY = '268EFCA56CE54677A21C7987BF1D33E4';
const BASE_URL = 'http://localhost:3000';

function createSignature(payload) {
  const normalized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', SECRET_KEY).update(normalized).digest('hex');
}

async function testWebhook() {
  console.log('\n🔗 Testing Webhook Signature Verification...\n');
  
  const payload = {
    id: 'ext-12345',
    reference: 'COL-1720557600000',
    status: 'EXECUTED',
    amount: 1000,
    currency: 'PHP',
    event: {
      status: 'COMPLETED'
    }
  };
  
  const signature = createSignature(payload);
  
  console.log('📋 Test Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n🔑 Generated Signature:', signature);
  
  try {
    console.log('\n📤 Sending webhook request...');
    const response = await fetch(`${BASE_URL}/api/swiftpay/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('\n✅ Webhook signature verified successfully!');
    }
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
}

async function testInvalidSignature() {
  console.log('\n\n🔐 Testing Invalid Signature Rejection...\n');
  
  const payload = {
    id: 'ext-99999',
    reference: 'TEST-INVALID',
    status: 'EXECUTED'
  };
  
  const invalidSignature = 'invalid_signature_here';
  
  try {
    const response = await fetch(`${BASE_URL}/api/swiftpay/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': invalidSignature
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Invalid signature correctly rejected!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testUnauthenticatedEndpoint() {
  console.log('\n\n🚫 Testing Unauthenticated Endpoint Access...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/swiftpay/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Unauthorized access correctly rejected!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testReturnEndpoint() {
  console.log('\n\n🔄 Testing Return/Callback Redirect...\n');
  
  try {
    // Don't follow redirects to see the redirect response
    const response = await fetch(`${BASE_URL}/api/swiftpay/return?status=EXECUTED`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log('Status:', response.status);
    console.log('Location:', response.headers.get('location'));
    
    if (response.status >= 300 && response.status < 400) {
      console.log('✅ Redirect working correctly!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════');
  console.log('   🎯 SwiftPay API Integration Tests');
  console.log('═══════════════════════════════════════════');
  
  await testWebhook();
  await testInvalidSignature();
  await testUnauthenticatedEndpoint();
  await testReturnEndpoint();
  
  console.log('\n═══════════════════════════════════════════');
  console.log('   ✅ Test Suite Completed');
  console.log('═══════════════════════════════════════════\n');
}

runAllTests().catch(console.error);
