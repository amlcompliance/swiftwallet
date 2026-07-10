import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { createPaymentLink } from '../../../../lib/swiftpay';

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
    reference: `LINK-${Date.now()}`,
    description: body.description || 'SwiftWallet payment link',
    customerEmail: body.customerEmail || user?.email,
    redirectUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/dashboard',
  };

  const remote = await createPaymentLink(payload);
  return NextResponse.json({ ok: true, remote, payload });
}
