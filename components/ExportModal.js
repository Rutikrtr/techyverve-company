'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { addDays, dayLabel, todayStr } from '@/lib/dates';
import { downloadCsv, exportName } from '@/lib/export';
import { Icon, Modal } from '@/components/ui';
import { useToast } from '@/components/Toast';

/** Export hotels to a CSV (opens in Excel / Google Sheets). */
export default function ExportModal({ view, selected, viewLabel, onClose }) {
  const toast = useToast();
  const today = todayStr();
  const [mode, setMode] = useState(selected.length ? 'selected' : 'view');
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setError('');
    setBusy(true);
    try {
      let list;
      let label;
      if (mode === 'selected') {
        list = selected;
        label = `selected-${today}`;
      } else if (mode === 'view') {
        list = view;
        label = `view-${today}`;
      } else if (mode === 'date') {
        list = (await api('/leads?date=' + date)).leads;
        label = date;
      } else {
        list = (await api('/leads')).leads;
        label = `all-${today}`;
      }
      if (!list.length) {
        setError('There are no hotels to export for this choice.');
        setBusy(false);
        return;
      }
      downloadCsv(list, exportName(label));
      toast(`Exported ${list.length} hotel${list.length === 1 ? '' : 's'}`);
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const Opt = ({ id, title, hint, disabled, children }) => (
    <label className={'opt-row' + (mode === id ? ' on' : '') + (disabled ? ' off' : '')}>
      <input type="radio" name="mode" checked={mode === id} disabled={disabled} onChange={() => setMode(id)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b>{title}</b>
        <small>{hint}</small>
        {children}
      </div>
    </label>
  );

  return (
    <Modal
      title="Export hotels"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={run} disabled={busy}>
            <Icon name="download" size={14} /> {busy ? 'Preparing…' : 'Download CSV'}
          </button>
        </>
      }
    >
      {error && <div className="err">{error}</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        <Opt id="selected" title={`Selected hotels (${selected.length})`} hint="Only the hotels you ticked" disabled={!selected.length} />
        <Opt id="view" title={`This list (${view.length})`} hint={viewLabel} />
        <Opt id="date" title="Hotels for a date" hint="Everything with this revisit date">
          {mode === 'date' && (
            <div className="row" style={{ marginTop: 8 }}>
              <input type="date" className="input" style={{ width: 'auto', height: 34 }} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
              <button type="button" className="chip" onClick={() => setDate(today)}>Today</button>
              <button type="button" className="chip" onClick={() => setDate(addDays(today, 1))}>Tomorrow</button>
              <span className="muted">{dayLabel(date, today)}</span>
            </div>
          )}
        </Opt>
        <Opt id="all" title="All hotels" hint="Every hotel you can see, any date" />
      </div>
      <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
        The file has hotel, camp, confirmation %, contact, owner, price, revisit date, added by, location and a Google Maps link.
      </p>
    </Modal>
  );
}
