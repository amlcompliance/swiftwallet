import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../lib/auth';
import { prisma } from '../../../../../../lib/prisma';

// Validate IP address format
function isValidIp(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[\da-f:]+$/i;
  
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(octet => parseInt(octet) <= 255);
  }
  
  return ipv6Regex.test(ip);
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

  const whitelists = await prisma.ipWhitelist.findMany({
    where: { apiKeyId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(whitelists);
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId } = params;
  const body = await request.json();

  // Validate IP
  if (!body.ipAddress || !isValidIp(body.ipAddress)) {
    return NextResponse.json({ message: 'Invalid IP address' }, { status: 400 });
  }

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    const whitelist = await prisma.ipWhitelist.create({
      data: {
        apiKeyId,
        ipAddress: body.ipAddress,
        description: body.description || null
      }
    });

    return NextResponse.json(whitelist, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'This IP is already whitelisted' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to add IP whitelist', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { apiKeyId, ipId } = params;

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId }
  });

  if (!apiKey || apiKey.userId !== Number(session.user.id)) {
    return NextResponse.json({ message: 'API key not found' }, { status: 404 });
  }

  try {
    await prisma.ipWhitelist.delete({
      where: { id: ipId }
    });

    return NextResponse.json({ message: 'IP whitelist removed' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to remove IP whitelist', error: error.message },
      { status: 500 }
    );
  }
}
