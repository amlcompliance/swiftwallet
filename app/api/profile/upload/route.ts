import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const name = `${randomUUID()}-${file.name}`;
  const filePath = path.join(process.cwd(), 'public', 'uploads', name);
  await writeFile(filePath, buffer);

  await prisma.user.update({ where: { id: Number(session.user.id) }, data: { profileImage: `/uploads/${name}` } });
  return NextResponse.json({ ok: true, path: `/uploads/${name}` });
}
