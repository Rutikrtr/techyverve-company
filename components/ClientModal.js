'use client';
import { useState } from 'react';
import { api, useFetch } from '@/lib/client';
import { Icon, Modal } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { isTouch } from '@/lib/dom';

/**
 * Add / edit a confirmed client (hotel) in the hishob.
 * `client` = existing row to edit, `prefill` = values from a lead, otherwise blank.
 */
export default function ClientModal({ client, prefill, onClose, onSaved }) {
  const toast = useToast();
  const src = client || prefill || {};
  const [form, setForm] = useState({
    lead_id: client?.lead_id || prefill?.lead_id || '',
    hotel_name: src.hotel_name || '',
    owner_name: src.owner_name || '',
    contact: src.contact || '',
    given_price: src.given_price ?? src.price ?? '',
    received: src.received ?? '',
    confirmed_on: src.confirmed_on || new Date().toISOString().slice(0, 10),
    notes: src.notes || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Offer 100% leads to pick from when adding a brand-new client by hand.
  const picker = useFetch(!client && !prefill ? '/leads?pct=100' : null);
  const hotLeads = picker.data?.leads || [];

  function pick(e) {
    const lead = hotLeads.find((l) => l.id === e.target.value);
    if (!lead) return setForm((f) => ({ ...f, lead_id: '' }));
    setForm((f) => ({
      ...f,
      lead_id: lead.id,
      hotel_name: lead.hotel_name,
      owner_name: lead.owner_name || '',
      contact: lead.contact || '',
      given_price: lead.price ?? f.given_price,
    }));
  }

  async function save() {
    setError('');
    setBusy(true);
    try {
      if (client) await api('/clients/' + client.id, { method: 'PATCH', body: form });
      else await api('/clients', { method: 'POST', body: form });
      toast(client ? 'Client updated' : 'Confirmed hotel added to hishob');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove "${client.hotel_name}" from the hishob?`)) return;
    setBusy(true);
    try {
      await api('/clients/' + client.id, { method: 'DELETE' });
      toast('Client removed');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={client ? 'Edit confirmed hotel' : 'Add confirmed hotel'}
      onClose={onClose}
      wide
      footer={
        <>
          {client && (
            <button className="btn danger" style={{ marginRight: 'auto' }} onClick={remove} disabled={busy}>
              <Icon name="trash" /> Remove
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={save} disabled={busy || !form.hotel_name.trim() || form.given_price === ''}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="err">{error}</div>}

      {!client && !prefill && hotLeads.length > 0 && (
        <div className="field">
          <label>
            Pick from 100% leads <span className="opt">(optional)</span>
          </label>
          <select className="input" value={form.lead_id} onChange={pick}>
            <option value="">— type a new hotel below —</option>
            {hotLeads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.hotel_name} · {l.areas?.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label>Hotel name</label>
        <input className="input" value={form.hotel_name} onChange={set('hotel_name')} autoFocus={!isTouch()} enterKeyHint="next" autoCapitalize="words" autoComplete="off" />
      </div>
      <div className="form-grid">
        <div className="field">
          <label>
            Owner <span className="opt">(optional)</span>
          </label>
          <input className="input" value={form.owner_name} onChange={set('owner_name')} enterKeyHint="next" autoCapitalize="words" autoComplete="off" />
        </div>
        <div className="field">
          <label>
            Contact <span className="opt">(optional)</span>
          </label>
          <input className="input" type="tel" value={form.contact} onChange={set('contact')} inputMode="tel" autoComplete="off" enterKeyHint="next" />
        </div>
        <div className="field">
          <label>Price given by client (₹)</label>
          <input className="input" type="number" inputMode="decimal" min="0" value={form.given_price} onChange={set('given_price')} enterKeyHint="next" />
        </div>
        <div className="field">
          <label>
            Received so far (₹) <span className="opt">(optional)</span>
          </label>
          <input className="input" type="number" inputMode="decimal" min="0" value={form.received} onChange={set('received')} enterKeyHint="next" />
        </div>
        <div className="field">
          <label>Confirmed on</label>
          <input className="input" type="date" value={form.confirmed_on} onChange={set('confirmed_on')} />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>
          Notes <span className="opt">(optional)</span>
        </label>
        <textarea className="input" value={form.notes} onChange={set('notes')} />
      </div>
    </Modal>
  );
}
