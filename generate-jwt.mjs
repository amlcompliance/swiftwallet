#!/usr/bin/env node
import crypto from 'crypto';
import { promisify } from 'util';

// Simulate JWT creation (NextAuth compatible)
function createJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Create session payload
const sessionPayload = {
  user: {
    id: '1',
    email: 'test@swiftwallet.local',
    name: 'Test Merchant'
  },
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  jti: crypto.randomUUID()
};

const secret = 'swiftwallet-dev-secret';
const jwt = createJWT(sessionPayload, secret);

console.log('\n📝 Generated JWT Token:');
console.log(jwt);
console.log('\n');

// Also create a simple session format NextAuth understands
console.log('✅ JWT created successfully!');
console.log('\n💡 To use this token, set the following environment variable:');
console.log(`   export SESSION_JWT="${jwt}"`);

console.log('\n📋 Session Payload:');
console.log(JSON.stringify(sessionPayload, null, 2));
