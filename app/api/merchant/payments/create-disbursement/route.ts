import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { withApiKeyAuth } from '../../../../../lib/apiauth';
import { createDisbursement } from '../../../../../lib/swiftpay';

async function handler(request, auth) {
  if (request.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  const body = await request.json();

  // Validate amount
  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
  }

  // Validate description
  if (!body.description || body.description.length < 3) {
    return NextResponse.json(
      { message: 'Description must be at least 3 characters' },
      { status: 400 }
    );
  }

  // Validate recipient
  if (!body.recipient || body.recipient.length < 3) {
    return NextResponse.json(
      { message: 'Valid recipient required' },
      { status: 400 }
    );
  }

  try {
    const payload = {
      merchantId: auth.user.id,
      amount: Number(body.amount),
      currency: body.currency || 'PHP',
      reference: `DISB-${Date.now()}`,
      description: body.description,
      recipient: body.recipient,
      metadata: body.metadata || {}
    };

    // Create disbursement via SwiftPay
    const remote = await createDisbursement(payload);

    // Store transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: auth.user.id,
        type: 'DISBURSEMENT',
        amount: Number(body.amount),
        currency: body.currency || 'PHP',
        status: remote.status === 'EXECUTED' ? 'EXECUTED' : 'PENDING',
        provider: 'SWIFTPAY',
        reference: payload.reference,
        externalId: remote.id,
        rawPayload: JSON.stringify(remote)
      }
    });

    return NextResponse.json({
      message: 'Disbursement created successfully',
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        status: transaction.status,
        externalId: transaction.externalId
      },
      swiftpayResponse: remote
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create disbursement', error: error.message },
      { status: 500 }
    );
  }
}

export const POST = withApiKeyAuth(handler);
