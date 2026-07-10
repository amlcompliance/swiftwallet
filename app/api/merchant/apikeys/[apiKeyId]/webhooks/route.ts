import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../lib/auth';
import { prisma } from '../../../../../../lib/prisma';
import crypto from 'crypto';

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId } = params;

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  const webhooks = await prisma.webhookConfig.findMany({
    where: { apiKeyId },
    include: {
      _count: { select: { deliveries: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(webhooks);
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId } = params;
  const body = await request.json();

  // Validate URL
  if (!body.url || !isValidUrl(body.url)) {
    return NextResponse.json({ message: 'Valid webhook URL required' }, { status: 400 });
  }

  // Validate events
  const validEvents = ['payment.completed', 'payment.failed', 'payment.pending', 'disbursement.completed', 'disbursement.failed'];
  if (body.events) {
    const events = typeof body.events === 'string' ? body.events.split(',') : body.events;
    if (!events.every(e => validEvents.includes(e.trim()))) {
      return NextResponse.json(
        { message: 'Invalid events. Valid events are: ' + validEvents.join(', ') },
        { status: 400 }
      );
    }
  }

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    const secret = crypto.randomBytes(32).toString('hex');
    
    const webhook = await prisma.webhookConfig.create({
      data: {
        userId: Number(session.user.id),
        apiKeyId,
        url: body.url,
        events: body.events ? body.events.join(',') : 'payment.completed,payment.failed',
        secret,
        isActive: true
      }
    });

    return NextResponse.json({
      message: 'Webhook created. Save the secret for signature verification.',
      webhook: {
        ...webhook,
        secret: secret // Only shown once
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create webhook', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId, webhookId } = params;
  const body = await request.json();

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    const webhook = await prisma.webhookConfig.update({
      where: { id: webhookId },
      data: {
        ...(body.url && { url: body.url }),
        ...(body.events && { events: typeof body.events === 'string' ? body.events : body.events.join(',') }),
        ...(typeof body.isActive === 'boolean' && { isActive: body.isActive })
      }
    });

    return NextResponse.json({
      message: 'Webhook updated successfully',
      webhook
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update webhook', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId, webhookId } = params;

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    await prisma.webhookConfig.delete({
      where: { id: webhookId }
    });

    return NextResponse.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to delete webhook', error: error.message },
      { status: 500 }
    );
  }
}
