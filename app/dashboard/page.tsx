import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import SwiftPayActions from '../../components/SwiftPayActions';
import TransactionStatusBadge from '../../components/TransactionStatusBadge';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <div className="container">Please sign in.</div>;
  }

  const transactions = await prisma.transaction.findMany({ where: { userId: Number(session.user.id) }, orderBy: { createdAt: 'desc' } });
  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });

  return (
    <main className="container">
      <nav>
        <strong>SwiftWallet</strong>
        <div><Link href="/dashboard">Dashboard</Link> | <Link href="/transactions">Transactions</Link> | <Link href="/profile">Profile</Link></div>
      </nav>
      <div className="card">
        <h2>Welcome, {user?.name}</h2>
        <p>Balance: PHP {user?.balance.toFixed(2)}</p>
      </div>
      <SwiftPayActions />
      <div className="card">
        <h3>Recent transactions</h3>
        <ul>
          {transactions.map((tx) => (
            <li key={tx.id} style={{ marginBottom: '8px' }}>
              {tx.type} — PHP {tx.amount.toFixed(2)} — <TransactionStatusBadge status={tx.status} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
