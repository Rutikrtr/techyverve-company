'use client';
import { addDays, dayLabel, todayStr } from '@/lib/dates';

/** Revisit date: Today / Tomorrow shortcuts + any date. value = "YYYY-MM-DD" or "". */
export default function RevisitPicker({ value, onChange, min }) {
  const today = todayStr();
  const tomorrow = addDays(today, 1);
  const custom = value && value !== today && value !== tomorrow;

  return (
    <div>
      <div className="seg">
        <button type="button" className={value === today ? 'on' : ''} onClick={() => onChange(today)}>
          Today
        </button>
        <button type="button" className={value === tomorrow ? 'on' : ''} onClick={() => onChange(tomorrow)}>
          Tomorrow
        </button>
        <label className={'seg-date' + (custom ? ' on' : '')}>
          <span>{custom ? dayLabel(value, today) : 'Pick date'}</span>
          <input type="date" value={value || ''} min={min} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label="Pick revisit date" />
        </label>
      </div>
    </div>
  );
}
