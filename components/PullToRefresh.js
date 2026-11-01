'use client';
import { useEffect, useRef, useState } from 'react';
import { haptic } from '@/lib/haptic';

/** Pull down from the top of the page to refresh (the installed app has no browser reload button). */
export default function PullToRefresh({ onRefresh }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const startY = useRef(null);
  const pullRef = useRef(0);
  const busyRef = useRef(false);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    const set = (v) => {
      pullRef.current = v;
      setPull(v);
    };
    const onStart = (e) => {
      if (busyRef.current || window.scrollY > 0 || document.querySelector('.overlay')) return;
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        const v = Math.min(dy * 0.5, 84);
        if (v >= 64 && pullRef.current < 64) haptic(8);
        set(v);
      } else if (dy < 0) {
        startY.current = null;
        set(0);
      }
    };
    const onEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= 64) {
        busyRef.current = true;
        setBusy(true);
        set(52);
        try {
          await cb.current();
        } finally {
          busyRef.current = false;
          setBusy(false);
          set(0);
        }
      } else {
        set(0);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  if (!pull && !busy) return null;
  return (
    <div className="ptr" style={{ transform: `translate(-50%, ${pull - 44}px)`, opacity: Math.min(1, pull / 48) }} aria-hidden="true">
      <span className={busy ? 'spin' : 'ptr-arrow'} style={!busy ? { transform: `rotate(${pull >= 64 ? 180 : 0}deg)` } : undefined}>{busy ? '' : '↓'}</span>
    </div>
  );
}
