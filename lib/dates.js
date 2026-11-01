// Date helpers. Dates travel as plain "YYYY-MM-DD" strings (no timezone surprises).
const pad = (n) => String(n).padStart(2, '0');

export const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toStr(new Date()); // the phone's own "today"
export const parseDate = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
};
export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}
export function isDateStr(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  return toStr(parseDate(s)) === s;
}

export function dayLabel(s, today = todayStr()) {
  if (!s) return 'No revisit date';
  if (s === today) return 'Today';
  if (s === addDays(today, 1)) return 'Tomorrow';
  if (s === addDays(today, -1)) return 'Yesterday';
  return shortDate(s, today);
}

export function shortDate(s, today = todayStr()) {
  if (!s) return '';
  const d = parseDate(s);
  const sameYear = d.getFullYear() === parseDate(today).getFullYear();
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

/**
 * Groups leads by revisit date: Today first, then upcoming (soonest first),
 * then earlier dates (most recent first), then leads with no date.
 */
export function groupLeads(leads, today = todayStr()) {
  const map = new Map();
  for (const l of leads) {
    const k = l.revisit_date || '';
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(l);
  }
  const keys = [...map.keys()];
  const upcoming = keys.filter((k) => k && k > today).sort();
  const earlier = keys.filter((k) => k && k < today).sort().reverse();
  const order = [...(map.has(today) ? [today] : []), ...upcoming, ...earlier, ...(map.has('') ? [''] : [])];
  return order.map((k) => ({
    key: k || 'none',
    date: k,
    label: dayLabel(k, today),
    sub: k && k !== today ? shortDate(k, today) : k === today ? shortDate(k, today) : '',
    state: !k ? 'none' : k === today ? 'today' : k > today ? 'upcoming' : 'earlier',
    leads: map.get(k),
  }));
}
