'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, fmtDate, initials, inr, mapsUrl, timeAgo, useFetch } from '@/lib/client';
import { useUser } from '@/components/User';
import { useToast } from '@/components/Toast';
import ClientModal from '@/components/ClientModal';
import { Empty, Icon, Loading, Modal, PctBadge, PctPicker } from '@/components/ui';

function EditModal({ lead, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    hotel_name: lead.hotel_name,
    contact: lead.contact || '',
    owner_name: lead.owner_name || '',
    price: lead.price ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    setError('');
    try {
      await api('/leads/' + lead.id, { method: 'PATCH', body: form });
      toast('Lead updated');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Edit lead"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </>
      }
    >
      {error && <div className="err">{error}</div>}
      <div className="field">
        <label>Hotel name</label>
        <input className="input" value={form.hotel_name} onChange={set('hotel_name')} />
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Contact</label>
          <input className="input" type="tel" value={form.contact} onChange={set('contact')} />
        </div>
        <div className="field">
          <label>Owner <span className="opt">(optional)</span></label>
          <input className="input" value={form.owner_name} onChange={set('owner_name')} />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Price <span className="opt">(optional)</span></label>
        <input className="input" type="number" inputMode="decimal" min="0" value={form.price} onChange={set('price')} />
      </div>
    </Modal>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const router = useRouter();
  const user = useUser();
  const toast = useToast();

  const lead = useFetch('/leads/' + id);
  const remarks = useFetch('/leads/' + id + '/remarks');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [savingPct, setSavingPct] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toHishob, setToHishob] = useState(false);

  if (lead.loading) return <Loading />;
  if (lead.error)
    return (
      <div className="page">
        <div className="err">{lead.error}</div>
        <Link href="/leads" className="btn">Back to leads</Link>
      </div>
    );

  const l = lead.data.lead;

  async function setPct(confirmation) {
    if (confirmation === l.confirmation) return;
    setSavingPct(true);
    try {
      await api('/leads/' + id, { method: 'PATCH', body: { confirmation } });
      await Promise.all([lead.reload(), remarks.reload()]);
      toast(`Confirmation set to ${confirmation}%`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSavingPct(false);
    }
  }

  async function addRemark(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api('/leads/' + id + '/remarks', { method: 'POST', body: { body: text } });
      setText('');
      await remarks.reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPosting(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${l.hotel_name}" and its remarks?`)) return;
    try {
      await api('/leads/' + id, { method: 'DELETE' });
      toast('Lead deleted');
      router.replace('/camps/' + l.area_id);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const list = remarks.data?.remarks || [];

  return (
    <div className="page">
      <Link href={'/camps/' + l.area_id} className="crumb">
        <Icon name="back" size={13} /> {l.areas?.name || 'Camp'}
      </Link>

      <div className="page-head">
        <div>
          <div className="row" style={{ gap: 10 }}>
            <h1>{l.hotel_name}</h1>
            <PctBadge value={l.confirmation} />
            {l.in_hishob && <span className="badge ok"><Icon name="check" size={11} /> In hishob</span>}
          </div>
          <p>
            Added {timeAgo(l.created_at)} by {l.creator?.name || 'unknown'}
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setEditing(true)}>
            <Icon name="edit" /> Edit
          </button>
          {user.isAdmin && l.confirmation === 100 && !l.in_hishob && (
            <button className="btn dark" onClick={() => setToHishob(true)}>
              <Icon name="book" /> Move to hishob
            </button>
          )}
          {user.isAdmin && (
            <button className="btn danger icon" onClick={remove} title="Delete lead">
              <Icon name="trash" />
            </button>
          )}
        </div>
      </div>

      <div className="grid g-main">
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <div className="card-head">
              <h2>Confirmation</h2>
              <span className="muted">How sure is this hotel?</span>
            </div>
            <PctPicker value={l.confirmation} onChange={setPct} disabled={savingPct} />
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Remarks</h2>
              <span className="muted">{list.filter((r) => r.kind === 'note').length} notes</span>
            </div>
            <form onSubmit={addRemark} style={{ marginBottom: 16 }}>
              <textarea
                className="input"
                placeholder="Add a remark… what happened, next step, who to call"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={2000}
              />
              <div className="row" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
                <button className="btn primary" disabled={posting || !text.trim()}>
                  <Icon name="send" size={14} /> {posting ? 'Posting…' : 'Post remark'}
                </button>
              </div>
            </form>

            {remarks.loading && !remarks.data ? (
              <Loading />
            ) : list.length === 0 ? (
              <Empty icon="message" title="No remarks yet" hint="Be the first to leave a note on this hotel." />
            ) : (
              <div className="timeline">
                {list.map((r) =>
                  r.kind === 'system' ? (
                    <div key={r.id} className="tl system">
                      <div className="dot"><i /></div>
                      <div className="tl-body">
                        <div className="tl-text">
                          {r.body} · {r.author?.name || 'Someone'} · {timeAgo(r.created_at)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={r.id} className="tl">
                      <span className="avatar sm">{initials(r.author?.name)}</span>
                      <div className="tl-body">
                        <div className="tl-head">
                          <b>{r.author?.name || 'Former member'}</b>
                          <span>{timeAgo(r.created_at)}</span>
                        </div>
                        <div className="tl-text">{r.body}</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <div className="card-head"><h2>Details</h2></div>
            <dl className="detail-list" style={{ margin: 0 }}>
              <dt>Camp</dt>
              <dd>{l.areas?.name}</dd>
              <dt>Contact</dt>
              <dd>
                {l.contact ? (
                  <a href={'tel:' + l.contact} className="row" style={{ gap: 5 }}>
                    <Icon name="phone" size={13} /> {l.contact}
                  </a>
                ) : '—'}
              </dd>
              <dt>Owner</dt>
              <dd>{l.owner_name || <span className="muted">Not added</span>}</dd>
              <dt>Price</dt>
              <dd>{l.price ? inr(l.price) : <span className="muted">Not added</span>}</dd>
              <dt>Added</dt>
              <dd>{fmtDate(l.created_at)}</dd>
            </dl>
          </div>

          <div className="card">
            <div className="card-head"><h2>Location</h2></div>
            <div className="loc ok" style={{ marginBottom: 10 }}>
              <div className="ic"><Icon name="pin" size={14} /></div>
              <div>
                <b>Captured on the phone</b>
                <small>
                  {l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}
                  {l.location_accuracy ? ` · ±${Math.round(l.location_accuracy)} m` : ''}
                </small>
              </div>
            </div>
            <div className="row">
              <a className="btn" href={mapsUrl(l.latitude, l.longitude)} target="_blank" rel="noreferrer">
                <Icon name="external" /> Open in Maps
              </a>
              <a
                className="btn"
                href={`https://www.google.com/maps/dir/?api=1&destination=${l.latitude},${l.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="nav" /> Directions
              </a>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <EditModal
          lead={l}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            lead.reload();
          }}
        />
      )}
      {toHishob && (
        <ClientModal
          prefill={{ lead_id: l.id, hotel_name: l.hotel_name, owner_name: l.owner_name, contact: l.contact, price: l.price }}
          onClose={() => setToHishob(false)}
          onSaved={() => {
            setToHishob(false);
            lead.reload();
          }}
        />
      )}
    </div>
  );
}
