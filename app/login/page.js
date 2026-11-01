'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { Icon } from '@/components/ui';
import Logo, { Brand } from '@/components/Logo';
import { isTouch } from '@/lib/dom';

const FEATURES = [
  { icon: 'pin', title: 'Live location on every lead', text: 'Each hotel is saved with the exact spot, straight from the phone.' },
  { icon: 'list', title: 'Confirmation tracking', text: 'Follow every hotel from 10% to 100% with team remarks.' },
  { icon: 'book', title: 'Hishob in one place', text: 'Confirmed clients, payments and company expenses together.' },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // desktop: focus the username; phone: leave the keyboard closed until the user taps a field
  useEffect(() => {
    if (!isTouch()) document.getElementById('u')?.focus();
  }, []);

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
    <div className="login2">
      <aside className="l2-art">
        <div className="l2-grid" />
        <div className="l2-glow" />
        <Brand light size={42} />
        <div className="l2-hero">
          <span className="l2-pill">Techyverve CRM</span>
          <h1>Every hotel lead, from the field to the books.</h1>
          <p>One simple app for your team in the field and the people running the numbers.</p>
          <ul className="l2-feat">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span className="l2-ic"><Icon name={f.icon} size={16} /></span>
                <div>
                  <b>{f.title}</b>
                  <span>{f.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="l2-foot">© {new Date().getFullYear()} Techyverve. All rights reserved.</div>
      </aside>

      <main className="l2-side">
        <div className="l2-mobile-top">
          <div className="l2-grid" />
          <div className="l2-glow" />
          <Brand light size={44} />
          <p>Every hotel lead, from the field to the books.</p>
        </div>

        <form className="l2-card" onSubmit={submit}>
          <div className="l2-card-logo"><Logo size={44} /></div>
          <h2>Welcome back</h2>
          <p className="sub">Sign in to your Techyverve account</p>

          {error && <div className="err">{error}</div>}

          <div className="field">
            <label htmlFor="u">Username</label>
            <div className="l2-input">
              <Icon name="user" size={16} />
              <input
                id="u"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="p">Password</label>
            <div className="l2-input">
              <Icon name="key" size={16} />
              <input
                id="p"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                enterKeyHint="go"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="l2-show" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button className="btn primary l2-submit" disabled={busy || !username || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="l2-help">Forgot your password? Ask your superadmin to reset it.</p>
        </form>

        <div className="l2-copy">Techyverve · Internal tool</div>
      </main>
    </div>
  );
}
