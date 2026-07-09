import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'PENDING';
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?status=${status}`);
}
