import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../../../lib/auth';
import { prisma } from '../../../../../../../../lib/prisma';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId, webhookId } = params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status'); // 'pending', 'success', 'failed'

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    const where = {
      webhookConfigId: webhookId
    };

    if (status === 'success') {
      where.succeededAt = { not: null };
    } else if (status === 'failed') {
      where.nextRetryAt = null;
      where.attempts = { gte: 3 };
    } else if (status === 'pending') {
      where.succeededAt = null;
      where.attempts = { lt: 3 };
    }

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.webhookDelivery.count({ where })
    ]);

    return NextResponse.json({
      deliveries,
      pagination: {
        limit,
        offset,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch deliveries', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId, webhookId, deliveryId } = params;
  const body = await request.json();

  if (!body.action || !['retry', 'cancel'].includes(body.action)) {
    return NextResponse.json(
      { message: 'Valid action (retry or cancel) required' },
      { status: 400 }
    );
  }

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    if (body.action === 'retry') {
      const delivery = await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts: 0,
          nextRetryAt: new Date()
        }
      });

      return NextResponse.json({
        message: 'Delivery queued for retry',
        delivery
      });
    } else if (body.action === 'cancel') {
      const delivery = await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          nextRetryAt: null,
          attempts: 999 // Mark as failed
        }
      });

      return NextResponse.json({
        message: 'Delivery cancelled',
        delivery
      });
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to process delivery', error: error.message },
      { status: 500 }
    );
  }
}
