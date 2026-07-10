import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

// Helper to simulate session (for testing)
async function createTestSession() {
  const user = await prisma.user.findUnique({
    where: { email: 'test@swiftwallet.local' }
  });
  
  if (!user) {
    throw new Error('Test user not found');
  }
  
  return {
    user: {
      id: user.id.toString(),
      email: user.email,
      name: user.name
    }
  };
}

// Test Collection endpoint
async function testCollection(session) {
  console.log('\n📦 Testing Collection Endpoint...');
  
  try {
    // Create a mock session cookie (NextAuth JWT)
    const sessionData = JSON.stringify(session);
    const sessionJwt = Buffer.from(sessionData).toString('base64');
    
    const response = await fetch(`${BASE_URL}/api/swiftpay/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${sessionJwt}` // Mock cookie
      },
      body: JSON.stringify({
        amount: 1000,
        description: 'Test collection payment',
        customerEmail: 'customer@test.local'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Collection test failed:', error.message);
  }
}

// Test QRPH endpoint
async function testQrPh(session) {
  console.log('\n🔲 Testing QRPH Endpoint...');
  
  try {
    const sessionData = JSON.stringify(session);
    const sessionJwt = Buffer.from(sessionData).toString('base64');
    
    const response = await fetch(`${BASE_URL}/api/swiftpay/qrph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${sessionJwt}`
      },
      body: JSON.stringify({
        amount: 500,
        description: 'Test QRPH payment'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ QRPH test failed:', error.message);
  }
}

// Test Payment Link endpoint
async function testPaymentLink(session) {
  console.log('\n🔗 Testing Payment Link Endpoint...');
  
  try {
    const sessionData = JSON.stringify(session);
    const sessionJwt = Buffer.from(sessionData).toString('base64');
    
    const response = await fetch(`${BASE_URL}/api/swiftpay/payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${sessionJwt}`
      },
      body: JSON.stringify({
        amount: 2000,
        description: 'Test payment link',
        customerEmail: 'customer@test.local'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Payment Link test failed:', error.message);
  }
}

// Test Disbursement endpoint
async function testDisbursement(session) {
  console.log('\n💸 Testing Disbursement Endpoint...');
  
  try {
    const sessionData = JSON.stringify(session);
    const sessionJwt = Buffer.from(sessionData).toString('base64');
    
    const response = await fetch(`${BASE_URL}/api/swiftpay/disbursement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${sessionJwt}`
      },
      body: JSON.stringify({
        amount: 1500,
        description: 'Test disbursement',
        recipient: 'recipient@test.local'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Disbursement test failed:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 SwiftPay Integration Tests');
  console.log('==============================');
  
  try {
    const session = await createTestSession();
    console.log('✅ Test session created for:', session.user.email);
    
    await testCollection(session);
    await testQrPh(session);
    await testPaymentLink(session);
    await testDisbursement(session);
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
