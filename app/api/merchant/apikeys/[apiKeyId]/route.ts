import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId } = params;

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'API key revoked successfully' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to revoke API key', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId } = params;
  const body = await request.json();

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    const updated = await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        ...(body.name && { name: body.name }),
        ...(typeof body.rateLimit === 'number' && { rateLimit: body.rateLimit }),
        ...(typeof body.isActive === 'boolean' && { isActive: body.isActive }),
        ...(body.expiresAt && { expiresAt: new Date(body.expiresAt) })
      }
    });

    return NextResponse.json({
      message: 'API key updated successfully',
      apiKey: updated
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update API key', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId } = params;

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    include: {
      ipWhitelists: true,
      webhookConfigs: true,
      _count: {
        select: { apiUsages: true }
      }
    }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...apiKey,
    key: undefined // Never return the actual key
  });
}
