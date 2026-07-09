'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MERCHANT' });
  const [status, setStatus] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      setStatus('Account created. You can now login.');
      router.push('/login');
      return;
    }
    const data = await response.json();
    setStatus(data.message || 'Registration failed');
  }

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 560, margin: '40px auto' }}>
        <h2>Register merchant account</h2>
        <form onSubmit={handleSubmit}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Business name" required />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" required />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" required />
          <button type="submit">Create account</button>
        </form>
        <p>{status}</p>
      </div>
    </main>
  );
}
