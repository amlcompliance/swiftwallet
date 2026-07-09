'use client';

import { useState } from 'react';

export default function SwiftPayActions() {
  const [amount, setAmount] = useState('1000');
  const [description, setDescription] = useState('SwiftWallet payment');
  const [customerEmail, setCustomerEmail] = useState('');
  const [recipient, setRecipient] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);

  async function callApi(path: string, payload: Record<string, unknown>) {
    setStatus('Working…');
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setResult(data);
      setStatus(response.ok ? 'Completed' : 'Failed');
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Request failed' });
      setStatus('Failed');
    }
  }

  return (
    <div className="card">
      <h3>SwiftPay actions</h3>
      <p>Generate collection, QRPH, payment-link, and disbursement requests.</p>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Customer email" />
      <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient" />
      <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
        <button onClick={() => callApi('/api/swiftpay/collection', { amount: Number(amount), description, customerEmail })}>Create collection</button>
        <button onClick={() => callApi('/api/swiftpay/qrph', { amount: Number(amount), description })}>Generate QRPH</button>
        <button onClick={() => callApi('/api/swiftpay/payment-link', { amount: Number(amount), description, customerEmail })}>Generate payment link</button>
        <button onClick={() => callApi('/api/swiftpay/disbursement', { amount: Number(amount), description, recipient })}>Initiate disbursement</button>
      </div>
      {status ? <p>{status}</p> : null}
      {result ? <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{JSON.stringify(result, null, 2)}</pre> : null}
    </div>
  );
}
