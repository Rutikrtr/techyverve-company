'use client';
import { useState } from 'react';
import { api, fmtDate, initials, useFetch } from '@/lib/client';
import { useToast } from '@/components/Toast';
import { Empty, Icon, Loading, Modal } from '@/components/ui';
import { isTouch } from '@/lib/dom';

function MemberModal({ member, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: member?.name || '',
    username: member?.username || '',
    phone: member?.phone || '',
    password: '',
    active: member?.active ?? true,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setError('');
    setBusy(true);
    try {
      if (member) {
        const body = { name: form.name, phone: form.phone, active: form.active };
        if (form.password) body.password = form.password;
        await api('/team/' + member.id, { method: 'PATCH', body });
        toast('Member updated');
      } else {
        await api('/team', { method: 'POST', body: form });
        toast('Member created');
      }
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete ${member.name}? Their leads stay, but they lose access.`)) return;
    setBusy(true);
    try {
      await api('/team/' + member.id, { method: 'DELETE' });
      toast('Member deleted');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const canSave = form.name.trim() && (member || (form.username.trim() && form.password.length >= 6));

  return (
    <Modal
      title={member ? 'Edit member' : 'New team member'}
      onClose={onClose}
      footer={
        <>
          {member && (
            <button className="btn danger" style={{ marginRight: 'auto' }} onClick={remove} disabled={busy}>
              <Icon name="trash" /> Delete
            </button>
          )}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy || !canSave}>
            {busy ? 'Saving…' : member ? 'Save changes' : 'Create member'}
          </button>
        </>
      }
    >
      {error && <div className="err">{error}</div>}
      <div className="field">
        <label>Full name</label>
        <input className="input" value={form.name} onChange={set('name')} autoFocus={!isTouch()} enterKeyHint="next" autoCapitalize="words" autoComplete="off" />
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Username (for login)</label>
          <input
            className="input"
            value={form.username}
            onChange={set('username')}
            disabled={Boolean(member)}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="e.g. amit.k" enterKeyHint="next" autoComplete="off" />
        </div>
        <div className="field">
          <label>Phone <span className="opt">(optional)</span></label>
          <input className="input" type="tel" value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="off" enterKeyHint="next" />
        </div>
      </div>
      <div className="field">
        <label>{member ? 'Reset password' : 'Password'} {member && <span className="opt">(leave empty to keep current)</span>}</label>
        <input className="input" type="text" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" enterKeyHint="next" />
      </div>
      {member && (
        <label className={'check' + (form.active ? ' on' : '')}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
          <span className="ink">Account active</span>
          <span className="muted">— turn off to block login</span>
        </label>
      )}
    </Modal>
  );
}

export default function TeamPage() {
  const { data, loading, error, reload } = useFetch('/team');
  const [modal, setModal] = useState(null);

  if (loading) return <Loading />;
  const members = (data?.members || []).filter((m) => m.role === 'member');

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Team</h1>
          <p>Create logins for your team. Assign them to camps from the Camps page.</p>
        </div>
        <button className="btn primary keep" onClick={() => setModal('new')}>
          <Icon name="plus" /> New member
        </button>
      </div>

      {error && <div className="err">{error}</div>}

      <div className="card flush">
        {members.length === 0 ? (
          <Empty icon="users" title="No team members yet" hint="Create the first login for someone in the field.">
            <button className="btn primary" onClick={() => setModal('new')}>
              <Icon name="plus" /> New member
            </button>
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th className="hide-sm">Username</th>
                  <th>Camps</th>
                  <th className="num">Leads</th>
                  <th>Status</th>
                  <th className="hide-sm">Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="row" style={{ gap: 9, flexWrap: 'nowrap' }}>
                        <span className="avatar">{initials(m.name)}</span>
                        <div>
                          <div className="cell-title">{m.name}</div>
                          <div className="cell-sub">{m.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hide-sm mono">{m.username}</td>
                    <td>
                      {m.areas.length === 0 ? (
                        <span className="muted">Not assigned</span>
                      ) : (
                        <div className="chips">
                          {m.areas.slice(0, 2).map((a) => (
                            <span key={a.id} className="badge blue">{a.name}</span>
                          ))}
                          {m.areas.length > 2 && <span className="badge">+{m.areas.length - 2}</span>}
                        </div>
                      )}
                    </td>
                    <td className="num">{m.lead_count}</td>
                    <td>{m.active ? <span className="badge ok">Active</span> : <span className="badge off">Disabled</span>}</td>
                    <td className="hide-sm">{fmtDate(m.created_at)}</td>
                    <td className="right">
                      <button className="btn sm" onClick={() => setModal(m)}>
                        <Icon name="edit" size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <MemberModal
          member={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
