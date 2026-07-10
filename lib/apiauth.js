import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import { extractApiKey, verifyApiKey, hashApiKey } from './apikey';

// Rate limit store (in-memory for demo, use Redis in production)
const rateLimitMap = new Map();

/**
 * Authenticate using API key
 * Returns user and API key metadata
 */
export async function authenticateApiKey(request) {
  const apiKey = extractApiKey(request);
  
  if (!apiKey) {
    return { 
      error: { message: 'API key required', status: 401 },
      user: null,
      apiKeyRecord: null
    };
  }

  try {
    // Find API key by hash
    const keyHash = hashApiKey(apiKey);
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash }
    });

    if (!apiKeyRecord) {
      return {
        error: { message: 'Invalid API key', status: 401 },
        user: null,
        apiKeyRecord: null
      };
    }

    if (!apiKeyRecord.isActive) {
      return {
        error: { message: 'API key is inactive', status: 403 },
        user: null,
        apiKeyRecord: null
      };
    }

    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return {
        error: { message: 'API key has expired', status: 403 },
        user: null,
        apiKeyRecord: null
      };
    }

    // Check IP whitelist
    const clientIp = getClientIp(request);
    if (apiKeyRecord.ipWhitelists && apiKeyRecord.ipWhitelists.length > 0) {
      const isWhitelisted = apiKeyRecord.ipWhitelists.some(ip => ip.ipAddress === clientIp);
      if (!isWhitelisted) {
        return {
          error: { message: 'IP address not whitelisted', status: 403 },
          user: null,
          apiKeyRecord: null
        };
      }
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: apiKeyRecord.userId }
    });

    if (!user) {
      return {
        error: { message: 'User not found', status: 401 },
        user: null,
        apiKeyRecord: null
      };
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    return {
      error: null,
      user,
      apiKeyRecord
    };
  } catch (error) {
    return {
      error: { message: 'Authentication failed', status: 500 },
      user: null,
      apiKeyRecord: null
    };
  }
}

/**
 * Check rate limit for API key
 */
export function checkRateLimit(apiKeyId, limit = 100) {
  const now = Date.now();
  const key = `ratelimit:${apiKeyId}`;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { requests: [now], reset: now + 60000 });
    return { allowed: true, remaining: limit - 1 };
  }

  const data = rateLimitMap.get(key);
  
  // Reset if window expired
  if (now > data.reset) {
    rateLimitMap.set(key, { requests: [now], reset: now + 60000 });
    return { allowed: true, remaining: limit - 1 };
  }

  // Remove old requests outside window
  const windowStart = now - 60000;
  data.requests = data.requests.filter(t => t > windowStart);

  if (data.requests.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: data.reset
    };
  }

  data.requests.push(now);
  return {
    allowed: true,
    remaining: limit - data.requests.length
  };
}

/**
 * Extract client IP from request
 */
export function getClientIp(request) {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  return 'unknown';
}

/**
 * Log API usage
 */
export async function logApiUsage(userId, apiKeyId, endpoint, method, statusCode, responseTime, request) {
  try {
    await prisma.apiUsage.create({
      data: {
        userId,
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseTime,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent')
      }
    });
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

/**
 * Middleware wrapper for API endpoints
 */
export async function withApiKeyAuth(handler) {
  return async (request) => {
    const startTime = Date.now();
    
    // Authenticate
    const auth = await authenticateApiKey(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }

    // Check rate limit
    const rateLimit = checkRateLimit(auth.apiKeyRecord.id, auth.apiKeyRecord.rateLimit);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
        { status: 429 }
      );
    }

    // Call handler with auth context
    try {
      const response = await handler(request, auth);
      const responseTime = Date.now() - startTime;
      
      // Log usage
      await logApiUsage(
        auth.user.id,
        auth.apiKeyRecord.id,
        request.nextUrl.pathname,
        request.method,
        response.status,
        responseTime,
        request
      );

      // Add rate limit headers
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit', auth.apiKeyRecord.rateLimit.toString());
      headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      headers.set('X-RateLimit-Reset', Math.ceil((Date.now() + 60000) / 1000).toString());

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await logApiUsage(
        auth.user.id,
        auth.apiKeyRecord.id,
        request.nextUrl.pathname,
        request.method,
        500,
        responseTime,
        request
      );

      return NextResponse.json(
        { message: 'Internal server error', error: error.message },
        { status: 500 }
      );
    }
  };
}
