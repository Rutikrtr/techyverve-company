'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { compressImage } from '@/lib/image';
import { Icon } from '@/components/ui';

/**
 * Opens the phone camera, shrinks the photo to ~150 KB and hands back a File.
 * value = File | null
 */
export default function PhotoPicker({ value, onChange, compact = false }) {
  const input = useRef(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!value) return setPreview('');
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow taking the same photo again
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onChange(await compressImage(file));
    } catch (err) {
      setError(err.message || 'Could not use this photo');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={'photo' + (value ? ' has' : '') + (compact ? ' compact' : '')}>
      <input ref={input} type="file" accept="image/*" capture="environment" onChange={pick} hidden />
      {value && preview ? (
        <>
          <img src={preview} alt="Hotel" className="photo-img" />
          <div className="photo-bar">
            <span>
              <Icon name="check" size={13} /> Photo ready · {Math.max(1, Math.round(value.size / 1024))} KB
            </span>
            <button type="button" className="btn sm" onClick={() => input.current?.click()} disabled={busy}>
              Retake
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="photo-empty" onClick={() => input.current?.click()} disabled={busy}>
          <span className="photo-ic">{busy ? <span className="spin" /> : <Icon name="camera" size={22} />}</span>
          <b>{busy ? 'Preparing photo…' : 'Take hotel photo'}</b>
          <small>Required. Any quality is fine, it is made small automatically.</small>
        </button>
      )}
      {error && <div className="err" style={{ marginTop: 8, marginBottom: 0 }}>{error}</div>}
    </div>
  );
}
