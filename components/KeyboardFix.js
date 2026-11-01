'use client';
import { useEffect } from 'react';

const TEXTY = 'input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]):not([type=date]):not([type=submit]):not([type=button]), textarea';
const isEditable = (el) => el && el.matches && el.matches(TEXTY);

/**
 * Makes typing feel like a phone app:
 *  - keeps forms above the on-screen keyboard (tracks the visible area in CSS vars)
 *  - hides the bottom bar / floating buttons while typing
 *  - scrolls the field you tap into view
 *  - "Enter / Next" on the keyboard moves to the next field; on the last field it closes the keyboard (or submits the form)
 */
export default function KeyboardFix() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    let blurTimer;

    const syncViewport = () => {
      const h = vv ? vv.height : window.innerHeight;
      const t = vv ? vv.offsetTop : 0;
      root.style.setProperty('--vvh', h + 'px');
      root.style.setProperty('--vvt', t + 'px');
    };
    syncViewport();
    vv?.addEventListener('resize', syncViewport);
    vv?.addEventListener('scroll', syncViewport);
    window.addEventListener('orientationchange', syncViewport);

    const touch = window.matchMedia('(pointer: coarse)');

    const onFocusIn = (e) => {
      const el = e.target;
      if (!isEditable(el)) return;
      clearTimeout(blurTimer);
      if (touch.matches) root.classList.add('kb-open');
      // wait for the keyboard animation, then bring the field to the middle of the visible area
      setTimeout(() => {
        if (document.activeElement === el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 320);
    };
    const onFocusOut = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!isEditable(document.activeElement)) root.classList.remove('kb-open');
      }, 120);
    };

    const onKeyDown = (e) => {
      if (e.key !== 'Enter' || e.isComposing || e.shiftKey) return;
      const el = e.target;
      if (!el || el.tagName !== 'INPUT' || !isEditable(el)) return;

      if (el.hasAttribute('data-enter-blur')) {
        e.preventDefault();
        el.blur();
        return;
      }
      const box = el.closest('.modal-body, form');
      if (!box) return;
      const fields = [...box.querySelectorAll(TEXTY + ', select')].filter((f) => !f.disabled && f.offsetParent !== null);
      const next = fields[fields.indexOf(el) + 1];
      if (next) {
        e.preventDefault();
        next.focus();
      } else if (box.classList.contains('modal-body')) {
        e.preventDefault();
        el.blur(); // last field in a sheet: just close the keyboard
      } // last field of a <form>: let it submit
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      vv?.removeEventListener('resize', syncViewport);
      vv?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  return null;
}
