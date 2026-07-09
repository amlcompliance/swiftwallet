import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';
import { createCheckoutSession } from '../../../lib/stripe';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const amount = Number(body.amount || 0);
  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });

  const checkout = await createCheckoutSession({
    amount,
    email: user?.email || '',
    merchantName: user?.name || 'merchant',
  });

  if (!checkout) {
    return NextResponse.json({ message: 'Stripe is not configured' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, url: checkout.url });
}
