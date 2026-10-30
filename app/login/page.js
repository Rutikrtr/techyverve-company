'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/auth/login', { method: 'POST', body: { username, password } });
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-art">
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-mark">T</div>
          <div>
            <div className="brand-name">Techyverve</div>
            <div className="brand-sub">CRM</div>
          </div>
        </div>
        <div>
          <h1>Every hotel lead, from the field to the books.</h1>
          <p>Track camps, confirmations and remarks with live location, then see the hishob in one place.</p>
        </div>
        <div style={{ color: '#b2b8c4', fontSize: 12, position: 'relative' }}>Techyverve internal tool</div>
      </div>

      <div className="login-form">
        <form className="login-box" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="sub">Use the login your superadmin gave you.</p>
          {error && <div className="err">{error}</div>}
          <div className="field">
            <label htmlFor="u">Username</label>
            <input
              id="u"
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="p">Password</label>
            <input
              id="p"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn primary" disabled={busy || !username || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
