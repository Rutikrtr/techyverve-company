'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, initials } from '@/lib/client';
import { useUser } from '@/components/User';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/ui';

function PasswordCard() {
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', again: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    if (form.next !== form.again) return setError('The two new passwords do not match');
    setBusy(true);
    try {
      await api('/auth/password', { method: 'POST', body: { current: form.current, next: form.next } });
      toast('Password changed');
      setForm({ current: '', next: '', again: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={save}>
      <div className="card-head"><h2>Change password</h2></div>
      {error && <div className="err">{error}</div>}
      <div className="field">
        <label>Current password</label>
        <input className="input" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} enterKeyHint="next" />
      </div>
      <div className="form-grid">
        <div className="field">
          <label>New password</label>
          <input className="input" type="password" autoComplete="new-password" value={form.next} onChange={set('next')} placeholder="At least 6 characters" enterKeyHint="next" />
        </div>
        <div className="field">
          <label>Repeat new password</label>
          <input className="input" type="password" autoComplete="new-password" value={form.again} onChange={set('again')} enterKeyHint="next" />
        </div>
      </div>
      <button className="btn primary" disabled={busy || !form.current || !form.next || !form.again}>
        {busy ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}

function LocationCard() {
  const [state, setState] = useState({ status: 'idle' });

  function test() {
    if (!navigator.geolocation) return setState({ status: 'error', message: 'This device or browser does not support location.' });
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (p) => setState({ status: 'ok', lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      (err) =>
        setState({
          status: 'error',
          message:
            err.code === 1
              ? 'Location is blocked. Tap the lock icon in the address bar → Permissions → Location → Allow, and turn on GPS.'
              : 'Could not read your location. Turn on GPS and try again.',
        }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  return (
    <div className="card">
      <div className="card-head"><h2>Location check</h2></div>
      <p className="muted" style={{ marginBottom: 12 }}>
        Adding a hotel needs your phone location. Test that it works before you go out.
      </p>
      {state.status === 'ok' && (
        <div className="loc ok">
          <div className="ic"><Icon name="check" size={14} /></div>
          <div>
            <b>Location works</b>
            <small>{state.lat.toFixed(5)}, {state.lng.toFixed(5)} · ±{Math.round(state.acc)} m</small>
          </div>
        </div>
      )}
      {state.status === 'error' && (
        <div className="loc bad">
          <div className="ic"><Icon name="pin" size={14} /></div>
          <div><b>Location is off</b><small>{state.message}</small></div>
        </div>
      )}
      <button className="btn" onClick={test} disabled={state.status === 'loading'}>
        <Icon name="pin" /> {state.status === 'loading' ? 'Checking…' : 'Test my location'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const user = useUser();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Your account and app options.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
            <span className="avatar" style={{ width: 44, height: 44, fontSize: 15 }}>{initials(user.name)}</span>
            <div style={{ minWidth: 0 }}>
              <div className="cell-title" style={{ fontSize: 15 }}>{user.name}</div>
              <div className="muted">@{user.username} · {user.isAdmin ? 'Superadmin' : 'Team member'} · {user.company}</div>
            </div>
          </div>
        </div>

        <LocationCard />
        <PasswordCard />

        <div className="card">
          <div className="card-head"><h2>Install the app</h2></div>
          <p className="muted">
            <b className="ink">Android (Chrome):</b> menu ⋮ → Install app.<br />
            <b className="ink">iPhone (Safari):</b> Share → Add to Home Screen.
          </p>
        </div>

        <div className="card">
          <div className="card-head"><h2>Sign out</h2></div>
          <p className="muted" style={{ marginBottom: 12 }}>You will need your username and password to sign in again.</p>
          <button className="btn danger" onClick={logout} disabled={leaving}>
            <Icon name="logout" /> {leaving ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}
