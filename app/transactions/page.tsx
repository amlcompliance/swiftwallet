import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <div className="container">Please sign in.</div>;
  }

  const transactions = await prisma.transaction.findMany({ where: { userId: Number(session.user.id) }, orderBy: { createdAt: 'desc' } });

  return (
    <main className="container">
      <nav>
        <strong>SwiftWallet</strong>
        <div><Link href="/dashboard">Dashboard</Link> | <Link href="/transactions">Transactions</Link> | <Link href="/profile">Profile</Link></div>
      </nav>
      <div className="card">
        <h2>Transactions</h2>
        <ul>
          {transactions.map((tx) => (
            <li key={tx.id}><strong>{tx.reference}</strong> — {tx.type} — PHP {tx.amount.toFixed(2)} — {tx.status}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
