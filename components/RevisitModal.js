'use client';
import { useState } from 'react';
import { todayStr } from '@/lib/dates';
import { Modal } from '@/components/ui';
import RevisitPicker from '@/components/RevisitPicker';

/** Pick a new revisit date. onSave(date) should return a promise and throw an Error on failure. */
export default function RevisitModal({ title = 'Change revisit date', hint, initial, onSave, onClose }) {
  const [date, setDate] = useState(initial || todayStr());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    try {
      await onSave(date);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy || !date}>{busy ? 'Saving…' : 'Save date'}</button>
        </>
      }
    >
      {error && <div className="err">{error}</div>}
      {hint && <p className="muted" style={{ marginBottom: 12 }}>{hint}</p>}
      <RevisitPicker value={date} onChange={setDate} />
    </Modal>
  );
}
