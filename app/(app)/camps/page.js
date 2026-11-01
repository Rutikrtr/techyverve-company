'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, initials, useFetch } from '@/lib/client';
import { useUser } from '@/components/User';
import { useToast } from '@/components/Toast';
import { Empty, Icon, Loading, Modal } from '@/components/ui';
import { isTouch } from '@/lib/dom';

function CampModal({ camp, team, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: camp?.name || '', city: camp?.city || '', notes: camp?.notes || '' });
  const [selected, setSelected] = useState(new Set((camp?.members || []).map((m) => m.id)));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function save() {
    setError('');
    setBusy(true);
    try {
      const body = { ...form, user_ids: [...selected] };
      if (camp) await api('/areas/' + camp.id, { method: 'PATCH', body });
      else await api('/areas', { method: 'POST', body });
      toast(camp ? 'Camp updated' : 'Camp created');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete camp "${camp.name}" and ALL its leads? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api('/areas/' + camp.id, { method: 'DELETE' });
      toast('Camp deleted');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={camp ? 'Edit camp' : 'New camp'}
      onClose={onClose}
      footer={
        <>
          {camp && (
            <button className="btn danger" style={{ marginRight: 'auto' }} onClick={remove} disabled={busy}>
              <Icon name="trash" /> Delete
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={save} disabled={busy || !form.name.trim()}>
            {busy ? 'Saving…' : 'Save camp'}
          </button>
        </>
      }
    >
      {error && <div className="err">{error}</div>}
      <div className="field">
        <label>Camp / area name</label>
        <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Shirdi – Main Road" autoFocus={!isTouch()} enterKeyHint="next" autoCapitalize="words" autoComplete="off" />
      </div>
      <div className="field">
        <label>
          City <span className="opt">(optional)</span>
        </label>
        <input className="input" value={form.city} onChange={set('city')} enterKeyHint="next" autoCapitalize="words" autoComplete="off" />
      </div>
      <div className="field">
        <label>
          Notes <span className="opt">(optional)</span>
        </label>
        <textarea className="input" value={form.notes} onChange={set('notes')} />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <span className="label-txt">Assign team members</span>
        {team.length === 0 ? (
          <div className="note">Add team members first (Team page), then assign them here.</div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {team.map((m) => (
              <label key={m.id} className={'check' + (selected.has(m.id) ? ' on' : '')}>
                <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
                <span className="avatar sm">{initials(m.name)}</span>
                <span className="ink">{m.name}</span>
                {!m.active && <span className="badge off">disabled</span>}
              </label>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function CampsPage() {
  const user = useUser();
  const router = useRouter();
  const { data, loading, error, reload } = useFetch('/areas');
  const { data: teamData } = useFetch(user.isAdmin ? '/team' : null);
  const [modal, setModal] = useState(null); // null | 'new' | camp

  if (loading) return <Loading />;
  const areas = data?.areas || [];
  const team = (teamData?.members || []).filter((m) => m.role === 'member');

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{user.isAdmin ? 'Camps' : 'My camps'}</h1>
          <p>
            {user.isAdmin
              ? 'Create areas, assign your team, and see lead progress camp by camp.'
              : 'The areas assigned to you. Open one to add hotels.'}
          </p>
        </div>
        {user.isAdmin && (
          <button className="btn primary keep" onClick={() => setModal('new')}>
            <Icon name="plus" /> New camp
          </button>
        )}
      </div>

      {error && <div className="err">{error}</div>}

      {areas.length === 0 ? (
        <div className="card">
          <Empty
            icon="map"
            title={user.isAdmin ? 'No camps yet' : 'No camp assigned yet'}
            hint={user.isAdmin ? 'Create your first camp and assign team members to it.' : 'Ask your superadmin to assign you to a camp.'}
          >
            {user.isAdmin && (
              <button className="btn primary" onClick={() => setModal('new')}>
                <Icon name="plus" /> New camp
              </button>
            )}
          </Empty>
        </div>
      ) : (
        <div className="grid g3">
          {areas.map((a) => (
            <div key={a.id} className="card camp" onClick={() => router.push('/camps/' + a.id)}>
              <div className="row">
                <div style={{ minWidth: 0 }}>
                  <h3>{a.name}</h3>
                  <div className="meta">
                    <Icon name="pin" size={12} /> {a.city || 'No city set'}
                  </div>
                </div>
                <span className="spacer" />
                {user.isAdmin && (
                  <button
                    className="btn icon ghost"
                    title="Edit camp & team"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal(a);
                    }}
                  >
                    <Icon name="edit" />
                  </button>
                )}
              </div>

              <div className="camp-stats">
                <div>
                  <b>{a.stats.total}</b>
                  <span>Leads</span>
                </div>
                <div>
                  <b>{a.stats.hot}</b>
                  <span>Hot 70%+</span>
                </div>
                <div>
                  <b className="pos">{a.stats.confirmed}</b>
                  <span>Confirmed</span>
                </div>
              </div>

              <div className="row">
                <div className="stack">
                  {a.members.slice(0, 4).map((m) => (
                    <span key={m.id} className="avatar sm" title={m.name}>
                      {initials(m.name)}
                    </span>
                  ))}
                </div>
                <span className="muted" style={{ fontSize: 12 }}>
                  {a.members.length === 0 ? 'No one assigned' : `${a.members.length} member${a.members.length > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CampModal
          camp={modal === 'new' ? null : modal}
          team={team}
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
