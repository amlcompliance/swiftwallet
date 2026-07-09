import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <div className="container">Please sign in.</div>;
  }

  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });

  return (
    <main className="container">
      <nav>
        <strong>SwiftWallet</strong>
        <div><Link href="/dashboard">Dashboard</Link> | <Link href="/transactions">Transactions</Link> | <Link href="/profile">Profile</Link></div>
      </nav>
      <div className="card">
        <h2>Profile</h2>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
      </div>
    </main>
  );
}
