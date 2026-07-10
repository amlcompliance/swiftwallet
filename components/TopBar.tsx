'use client';

import Link from 'next/link';

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 18, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700 }}>SW</div>
        <div>
          <div className="topbar__title">SwiftWallet</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Fintech payments & merchant integrations</div>
        </div>
      </div>

      <nav className="topbar__nav">
        <Link className="topbar__link" href="/dashboard">Dashboard</Link>
        <Link className="topbar__link" href="/transactions">Transactions</Link>
        <Link className="topbar__link" href="/profile">Profile</Link>
        <Link className="topbar__link" href="/api-keys">API Keys</Link>
      </nav>
    </header>
  );
}
