import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      role: body.role || 'MERCHANT',
    },
  });

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
}
