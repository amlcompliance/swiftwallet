import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { withApiKeyAuth } from '../../../../../lib/apiauth';

async function handler(request, auth) {
  if (request.method !== 'GET') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const transactionId = searchParams.get('id');

  if (!reference && !transactionId) {
    return NextResponse.json(
      { message: 'Either reference or id parameter required' },
      { status: 400 }
    );
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: auth.user.id,
        ...(reference ? { reference } : { id: Number(transactionId) })
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: transaction.id,
      type: transaction.type,
      reference: transaction.reference,
      externalId: transaction.externalId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      provider: transaction.provider,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch transaction status', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withApiKeyAuth(handler);
