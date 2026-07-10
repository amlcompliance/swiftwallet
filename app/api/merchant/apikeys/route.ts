import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { generateApiKey, maskApiKey } from '../../../../lib/apikey';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: Number(session.user.id) },
    select: {
      id: true,
      key: false,
      name: true,
      mode: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true,
      rateLimit: true,
      _count: { select: { ipWhitelists: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(apiKeys);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  if (!body.name || typeof body.name !== 'string' || body.name.length < 3) {
    return NextResponse.json(
      { message: 'Name must be at least 3 characters' },
      { status: 400 }
    );
  }

  if (!['sandbox', 'live'].includes(body.mode)) {
    return NextResponse.json(
      { message: 'Mode must be sandbox or live' },
      { status: 400 }
    );
  }

  const { key, keyHash } = generateApiKey();

  try {
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: Number(session.user.id),
        name: body.name,
        mode: body.mode,
        key: keyHash,
        keyHash: keyHash,
        rateLimit: body.rateLimit || 100
      }
    });

    return NextResponse.json({
      message: 'API key created. Save this key securely - you won\'t be able to see it again!',
      key: key, // Only shown once
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        mode: apiKey.mode,
        masked: maskApiKey(key),
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        rateLimit: apiKey.rateLimit
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create API key', error: error.message },
      { status: 500 }
    );
  }
}
