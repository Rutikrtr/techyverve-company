// Short vibration on Android phones (iPhone ignores it). Safe to call anywhere.
export function haptic(ms = 12) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}
