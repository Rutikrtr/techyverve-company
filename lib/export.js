import { shortDate } from './dates';

// Stops spreadsheet "formula injection" from hotel names etc. that start with = + - @
function esc(v, { phone = false } = {}) {
  let s = v === undefined || v === null ? '' : String(v);
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !(phone || /^[+-]?[\d\s().-]+$/.test(s)))) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

const COLUMNS = [
  ['Hotel', (l) => esc(l.hotel_name)],
  ['Camp', (l) => esc(l.areas?.name)],
  ['Confirmation %', (l) => l.confirmation],
  ['Contact', (l) => esc(l.contact, { phone: true })],
  ['Owner', (l) => esc(l.owner_name)],
  ['Price', (l) => (l.price === null || l.price === undefined ? '' : l.price)],
  ['Revisit date', (l) => l.revisit_date || ''],
  ['Added by', (l) => esc(l.creator?.name)],
  ['Added on', (l) => (l.created_at ? l.created_at.slice(0, 10) : '')],
  ['Latitude', (l) => l.latitude],
  ['Longitude', (l) => l.longitude],
  ['Google Maps', (l) => `https://www.google.com/maps?q=${l.latitude},${l.longitude}`],
];

export function leadsToCsv(leads) {
  const head = COLUMNS.map(([h]) => h).join(',');
  const rows = leads.map((l) => COLUMNS.map(([, f]) => f(l)).join(','));
  return [head, ...rows].join('\r\n');
}

/** Downloads a CSV that opens correctly in Excel / Google Sheets (UTF-8 with BOM). */
export function downloadCsv(leads, name) {
  const blob = new Blob(['﻿' + leadsToCsv(leads)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const exportName = (label) => `techyverve-hotels-${label}.csv`;
export { shortDate };
