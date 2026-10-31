'use client';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui';

/** Registers the service worker and shows a small "install the app" banner on phones. */
/* eslint-disable @next/next/no-img-element */
export default function PWA() {
  const [deferred, setDeferred] = useState(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    let dismissed = false;
    try { dismissed = localStorage.getItem('tv_install_dismissed') === '1'; } catch {}
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone || dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isMobile) return;

    if (isIos) {
      setIos(true);
      setShow(true);
      return;
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function close() {
    setShow(false);
    try { localStorage.setItem('tv_install_dismissed', '1'); } catch {}
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
    close();
  }

  if (!show) return null;
  return (
    <div className="install">
      <div className="install-ic"><img src="/brand/logo-navy.png" alt="" width="26" height="26" /></div>
      <div className="install-txt">
        <b>Install Techyverve app</b>
        {ios ? (
          <span>Tap the Share button, then “Add to Home Screen”.</span>
        ) : (
          <span>Add it to your home screen for a full-screen app.</span>
        )}
      </div>
      {!ios && (
        <button className="btn primary sm" onClick={install}>Install</button>
      )}
      <button className="btn ghost icon sm" onClick={close} aria-label="Dismiss"><Icon name="x" size={14} /></button>
    </div>
  );
}
