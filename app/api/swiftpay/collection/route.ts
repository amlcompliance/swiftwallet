import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
const { createCollection } = require('../../../../lib/swiftpay');

function normalizeStatus(status: string | undefined) {
  const mapped = (status || '').toUpperCase();
  const statusMap: Record<string, string> = {
    PENDING: 'PENDING',
    EXECUTED: 'EXECUTED',
    COMPLETED: 'EXECUTED',
    SUCCEEDED: 'EXECUTED',
    PAID: 'EXECUTED',
    CANCELED: 'CANCELED',
    CANCELLED: 'CANCELED',
    REJECTED: 'REJECTED',
    FAILED: 'REJECTED',
    EXPIRED: 'EXPIRED',
  };
  return statusMap[mapped] || 'PENDING';
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });

  const payload = {
    merchantId: user?.id,
    amount: Number(body.amount || 0),
    currency: 'PHP',
    reference: `COL-${Date.now()}`,
    description: body.description || 'SwiftWallet collection',
    customerEmail: body.customerEmail || user?.email,
  };

  const remote = await createCollection(payload);

  await prisma.transaction.create({
    data: {
      userId: Number(session.user.id),
      type: 'COLLECTION',
      amount: Number(body.amount || 0),
      currency: 'PHP',
      status: normalizeStatus(remote.status || remote.data?.status),
      provider: 'SWIFTPAY',
      reference: payload.reference,
    },
  });

  return NextResponse.json({ ok: true, remote, payload });
}
