'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Icon, Modal, PctPicker } from '@/components/ui';
import PhotoPicker from '@/components/PhotoPicker';
import RevisitPicker from '@/components/RevisitPicker';
import { todayStr } from '@/lib/dates';
import { useToast } from '@/components/Toast';

/** Asks the phone for its location. Lead can't be saved until it succeeds. */
function useLocation() {
  const [state, setState] = useState({ status: 'loading' });

  const capture = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'error', message: 'This device or browser does not support location.' });
      return;
    }
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: 'ok',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const message =
          err.code === 1
            ? 'Location is blocked. Allow location for this site (tap the lock icon in the address bar → Permissions → Location → Allow) and turn on GPS, then tap Retry.'
            : err.code === 3
            ? 'Could not get a location in time. Move to open sky or turn on GPS, then tap Retry.'
            : 'Could not read your location. Turn on GPS and tap Retry.';
        setState({ status: 'error', message });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    capture();
  }, [capture]);

  return { ...state, retry: capture };
}

export default function AddLeadModal({ areas, defaultAreaId, onClose, onSaved }) {
  const toast = useToast();
  const loc = useLocation();
  const [form, setForm] = useState({
    area_id: defaultAreaId || (areas.length === 1 ? areas[0].id : ''),
    hotel_name: '',
    confirmation: 10,
    contact: '',
    owner_name: '',
    price: '',
    remark: '',
    revisit_date: todayStr(),
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const ready = loc.status === 'ok' && form.area_id && form.hotel_name.trim() && form.contact.trim() && photo && form.revisit_date;

  async function save() {
    setError('');
    setBusy(true);
    try {
      const body = new FormData();
      Object.entries({ ...form, latitude: loc.latitude, longitude: loc.longitude, location_accuracy: loc.accuracy }).forEach(([k, v]) =>
        body.append(k, v ?? '')
      );
      body.append('photo', photo);
      const { id } = await api('/leads', { method: 'POST', body });
      toast('Lead added');
      onSaved(id);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Add hotel lead"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={!ready || busy} onClick={save}>
            {busy ? 'Saving…' : 'Save lead'}
          </button>
        </>
      }
    >
      {/* Location status */}
      {loc.status === 'loading' && (
        <div className="loc loading">
          <div className="ic">
            <Icon name="pin" size={14} />
          </div>
          <div>
            <b>Getting your location…</b>
            <small>Allow location if your phone asks. It is saved with this hotel automatically.</small>
          </div>
        </div>
      )}
      {loc.status === 'ok' && (
        <div className="loc ok">
          <div className="ic">
            <Icon name="check" size={14} />
          </div>
          <div>
            <b>Location captured</b>
            <small>
              {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · accuracy ±{Math.round(loc.accuracy)} m
            </small>
          </div>
        </div>
      )}
      {loc.status === 'error' && (
        <div className="loc bad">
          <div className="ic">
            <Icon name="pin" size={14} />
          </div>
          <div style={{ flex: 1 }}>
            <b>Location is off</b>
            <small>{loc.message}</small>
          </div>
          <button className="btn sm" onClick={loc.retry}>
            Retry
          </button>
        </div>
      )}

      {error && <div className="err">{error}</div>}

      {areas.length !== 1 && (
        <div className="field">
          <label htmlFor="lc">Camp</label>
          <select id="lc" className="input" value={form.area_id} onChange={set('area_id')}>
            <option value="">Select camp…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.city ? ` · ${a.city}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="hn">Hotel name</label>
        <input id="hn" className="input" value={form.hotel_name} onChange={set('hotel_name')} placeholder="e.g. Hotel Sai Palace" autoFocus />
      </div>

      <div className="field">
        <span className="label-txt">Hotel photo</span>
        <PhotoPicker value={photo} onChange={setPhoto} />
      </div>

      <div className="field">
        <span className="label-txt">How sure is the confirmation?</span>
        <PctPicker value={form.confirmation} onChange={(confirmation) => setForm((f) => ({ ...f, confirmation }))} />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="ct">Hotel contact</label>
          <input id="ct" className="input" type="tel" inputMode="tel" value={form.contact} onChange={set('contact')} placeholder="Mobile number" />
        </div>
        <div className="field">
          <label htmlFor="ow">
            Owner name <span className="opt">(optional)</span>
          </label>
          <input id="ow" className="input" value={form.owner_name} onChange={set('owner_name')} />
        </div>
      </div>

      <div className="field">
        <span className="label-txt">Revisit date</span>
        <RevisitPicker value={form.revisit_date} onChange={(revisit_date) => setForm((f) => ({ ...f, revisit_date }))} min={todayStr()} />
      </div>

      <div className="field">
        <label htmlFor="pr">
          Price <span className="opt">(optional)</span>
        </label>
        <input id="pr" className="input" type="number" inputMode="decimal" min="0" value={form.price} onChange={set('price')} placeholder="₹" />
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="rm">
          Remark <span className="opt">(optional)</span>
        </label>
        <textarea id="rm" className="input" value={form.remark} onChange={set('remark')} placeholder="What did the hotel say?" />
      </div>
    </Modal>
  );
}
