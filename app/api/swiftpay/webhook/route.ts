import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifySignature } from '../../../../lib/swiftpay';

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
  const body = await request.json();
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature') || '';
  const raw = JSON.stringify(body);
  const valid = verifySignature(raw, signature, process.env.SWIFTPAY_SECRET_KEY || '');

  if (!valid) {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  const reference = body.reference || body.data?.reference || body.externalReference || body.id;
  const status = normalizeStatus(body.status || body.data?.status || body.event?.status);
  const externalId = body.id || body.data?.id || body.externalId || null;

  if (reference) {
    const transaction = await prisma.transaction.findUnique({ where: { reference } });
    if (transaction) {
      await prisma.transaction.update({
        where: { reference },
        data: {
          status,
          externalId,
          rawPayload: raw,
        },
      });

      if (status === 'EXECUTED') {
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
