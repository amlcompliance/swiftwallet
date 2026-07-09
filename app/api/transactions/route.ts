import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const reference = `TXN-${Date.now()}`;
  const transaction = await prisma.transaction.create({
    data: {
      userId: Number(session.user.id),
      type: body.type || 'COLLECTION',
      amount: Number(body.amount || 0),
      currency: 'PHP',
      status: 'PENDING',
      provider: 'SWIFTPAY',
      reference,
    },
  });

  return NextResponse.json({ ok: true, transaction });
}
