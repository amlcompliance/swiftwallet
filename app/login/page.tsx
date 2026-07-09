'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await signIn('credentials', { redirect: false, email, password });
    if (result?.error) {
      setError('Invalid credentials');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 480, margin: '40px auto' }}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          <button type="submit">Sign in</button>
        </form>
        {error ? <p>{error}</p> : null}
      </div>
    </main>
  );
}
