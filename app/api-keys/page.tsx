'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', mode: 'sandbox', rateLimit: 100 });
  const [createdKey, setCreatedKey] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    try {
      const response = await fetch('/api/merchant/apikeys');
      const data = await response.json();
      setApiKeys(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load API keys');
      setLoading(false);
    }
  }

  async function createApiKey(e) {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/merchant/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }

      const data = await response.json();
      setCreatedKey(data);
      setFormData({ name: '', mode: 'sandbox', rateLimit: 100 });
      setShowCreateForm(false);
      
      // Refresh list after short delay
      setTimeout(fetchApiKeys, 500);
    } catch (err) {
      setError(err.message);
    }
  }

  async function revokeApiKey(id) {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      const response = await fetch(`/api/merchant/apikeys/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to revoke key');

      await fetchApiKeys();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <nav>
        <strong>SwiftWallet</strong>
        <div>
          <Link href="/dashboard">Dashboard</Link> | <Link href="/transactions">Transactions</Link> | <Link href="/profile">Profile</Link> | <Link href="/api-keys">API Keys</Link>
        </div>
      </nav>

      <div className="card">
        <h2>API Keys</h2>
        <p>Manage API keys for merchant integrations. API keys allow third-party applications to interact with your SwiftWallet account.</p>
      </div>

      {error && <div className="card" style={{ color: 'red' }}>{error}</div>}

      {createdKey && (
        <div className="card" style={{ background: '#e8f5e9', borderLeft: '4px solid green', padding: '15px' }}>
          <h3 style={{ color: 'green', marginTop: 0 }}>✓ API Key Created</h3>
          <p><strong>⚠️ Save your API key now - you won't see it again!</strong></p>
          <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '10px' }}>
            {createdKey.key}
          </div>
          <p><strong>Name:</strong> {createdKey.apiKey.name}</p>
          <p><strong>Mode:</strong> {createdKey.apiKey.mode}</p>
          <p><strong>Rate Limit:</strong> {createdKey.apiKey.rateLimit} requests/minute</p>
          <button onClick={() => setCreatedKey(null)}>Close</button>
        </div>
      )}

      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        <>
          <div className="card">
            <button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? '✕ Cancel' : '+ Create API Key'}
            </button>
          </div>

          {showCreateForm && (
            <div className="card">
              <h3>Create New API Key</h3>
              <form onSubmit={createApiKey}>
                <input
                  type="text"
                  placeholder="Key Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  minLength={3}
                />

                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="live">Live (Production)</option>
                </select>

                <input
                  type="number"
                  placeholder="Rate Limit (requests/min)"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                  min={10}
                  max={10000}
                />

                <button type="submit">Create API Key</button>
              </form>
            </div>
          )}

          <div className="card">
            <h3>Your API Keys</h3>
            {apiKeys.length === 0 ? (
              <p>No API keys yet. Create one to get started.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Mode</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Rate Limit</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Last Used</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{key.name}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          background: key.mode === 'live' ? '#ff5252' : '#ffb74d',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}>
                          {key.mode.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          background: key.isActive ? '#4caf50' : '#999',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{key.rateLimit}/min</td>
                      <td style={{ padding: '10px' }}>
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <Link href={`/api-keys/${key.id}`}>
                          <button style={{ padding: '4px 8px', marginRight: '5px' }}>Settings</button>
                        </Link>
                        <button
                          onClick={() => revokeApiKey(key.id)}
                          style={{ padding: '4px 8px', background: '#f44336', color: 'white' }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3>Documentation</h3>
            <p>Need help integrating the Merchant API? Check out our documentation:</p>
            <ul>
              <li><Link href="/docs/merchant-api.md">📖 API Documentation</Link></li>
              <li>
                <a href="https://github.com/denshits1996-art/swiftwallet#merchant-api" target="_blank" rel="noopener noreferrer">
                  💻 GitHub Examples
                </a>
              </li>
              <li>
                <a href="mailto:support@swiftwallet.local">📧 Contact Support</a>
              </li>
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
