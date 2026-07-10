import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { createQrPh } from '../../../../lib/swiftpay';

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
    reference: `QRPH-${Date.now()}`,
    description: body.description || 'SwiftWallet QRPH',
  };

  const remote = await createQrPh(payload);
  return NextResponse.json({ ok: true, remote, payload });
}
