import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  if (body.type === 'checkout.session.completed') {
    const amount = Number(body.data.object.amount_total || 0) / 100;
    const email = body.data.object.customer_email;
    const user = await prisma.user.findFirst({ where: { email } });
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { balance: user.balance + amount } });
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'TOP_UP',
          amount,
          currency: 'PHP',
          status: 'COMPLETED',
          provider: 'STRIPE',
          reference: `STRIPE-${Date.now()}`,
        },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
