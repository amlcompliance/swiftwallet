import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <div className="card">
        <h1>SwiftWallet</h1>
        <p>Secure merchant wallet, payouts, and collection orchestration.</p>
        <Link href="/login">Login</Link>
        <span> | </span>
        <Link href="/register">Register</Link>
      </div>
    </main>
  );
}
