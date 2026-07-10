import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { withApiKeyAuth } from '../../../../lib/apiauth';

async function handler(request, auth) {
  if (request.method !== 'GET') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get usage statistics
    const usages = await prisma.apiUsage.findMany({
      where: {
        userId: auth.user.id,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Calculate statistics
    const totalRequests = usages.length;
    const successCount = usages.filter(u => u.statusCode >= 200 && u.statusCode < 300).length;
    const errorCount = usages.filter(u => u.statusCode >= 400).length;
    const avgResponseTime = usages.length > 0
      ? Math.round(usages.reduce((sum, u) => sum + u.responseTime, 0) / usages.length)
      : 0;

    // Group by endpoint
    const byEndpoint = {};
    usages.forEach(u => {
      if (!byEndpoint[u.endpoint]) {
        byEndpoint[u.endpoint] = { count: 0, errors: 0, avgTime: 0 };
      }
      byEndpoint[u.endpoint].count++;
      if (u.statusCode >= 400) byEndpoint[u.endpoint].errors++;
    });

    // Group by status code
    const byStatusCode = {};
    usages.forEach(u => {
      byStatusCode[u.statusCode] = (byStatusCode[u.statusCode] || 0) + 1;
    });

    return NextResponse.json({
      period: {
        since,
        days,
        until: new Date()
      },
      summary: {
        totalRequests,
        successCount,
        errorCount,
        successRate: totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(2) + '%' : '0%',
        avgResponseTime: avgResponseTime + 'ms'
      },
      byEndpoint,
      byStatusCode,
      recentRequests: usages.slice(0, 20).map(u => ({
        endpoint: u.endpoint,
        method: u.method,
        statusCode: u.statusCode,
        responseTime: u.responseTime + 'ms',
        ipAddress: u.ipAddress,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch usage data', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withApiKeyAuth(handler);
