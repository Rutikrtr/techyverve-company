'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { groupLeads, shortDate, todayStr } from '@/lib/dates';
import { inr, mapsUrl, timeAgo } from '@/lib/client';
import { Empty, Icon, PctBadge } from '@/components/ui';

function Thumb({ lead }) {
  return lead.photo_url ? (
    <img className="thumb" src={lead.photo_url} alt="" loading="lazy" />
  ) : (
    <span className="thumb none"><Icon name="camera" size={14} /></span>
  );
}

function Check({ checked, indeterminate, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate) && !checked;
  }, [indeterminate, checked]);
  return (
    <label className="cb" onClick={(e) => e.stopPropagation()}>
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} />
      <span />
    </label>
  );
}

/**
 * Hotels grouped by revisit date (Today first). Pass `selected` + `onToggle`
 * (+ `onToggleGroup`) to enable checkboxes.
 */
export default function LeadList({ leads, showCamp = true, selected, onToggle, onToggleGroup, emptyHint }) {
  const router = useRouter();
  const today = todayStr();
  const groups = useMemo(() => groupLeads(leads, today), [leads, today]);
  const selectable = Boolean(selected && onToggle);

  if (!leads.length) {
    return <Empty icon="list" title="No hotels here" hint={emptyHint || 'Hotels you add will show up here.'} />;
  }

  const groupHead = (g) => {
    const n = g.leads.filter((l) => selected?.has(l.id)).length;
    return (
      <div className={'grp-head ' + g.state}>
        {selectable && (
          <Check
            checked={n === g.leads.length}
            indeterminate={n > 0}
            onChange={() => onToggleGroup?.(g.leads)}
            label={`Select all for ${g.label}`}
          />
        )}
        <b>{g.label}</b>
        {g.sub && g.label !== g.sub && <span className="muted">{g.sub}</span>}
        {g.state === 'earlier' && <span className="badge off">Earlier</span>}
        <span className="spacer" />
        <span className="muted">{g.leads.length} hotel{g.leads.length === 1 ? '' : 's'}</span>
      </div>
    );
  };

  return (
    <>
      {/* Phone: cards */}
      <div className="only-sm">
        {groups.map((g) => (
          <div key={g.key}>
            {groupHead(g)}
            {g.leads.map((l) => (
              <div key={l.id} className={'lc' + (selected?.has(l.id) ? ' sel' : '')}>
                {selectable && <Check checked={selected.has(l.id)} onChange={() => onToggle(l.id)} label={`Select ${l.hotel_name}`} />}
                <Link href={'/leads/' + l.id} className="lc-main">
                  <Thumb lead={l} />
                  <div className="lc-body">
                    <div className="top">
                      <div className="name">{l.hotel_name}</div>
                      <PctBadge value={l.confirmation} />
                    </div>
                    <div className="sub">
                      {[showCamp && l.areas?.name, l.owner_name].filter(Boolean).join(' · ') || l.creator?.name || ' '}
                    </div>
                    <div className="sub">
                      {l.contact || 'No contact'}
                      {l.price ? ` · ${inr(l.price)}` : ''}
                    </div>
                  </div>
                </Link>
                <div className="lc-act">
                  {l.contact && (
                    <a className="btn icon" href={'tel:' + l.contact} aria-label={`Call ${l.hotel_name}`}>
                      <Icon name="phone" size={15} />
                    </a>
                  )}
                  <a className="btn icon" href={mapsUrl(l.latitude, l.longitude)} target="_blank" rel="noreferrer" aria-label="Open location">
                    <Icon name="pin" size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="table-wrap hide-mobile">
        <table className="table">
          <thead>
            <tr>
              {selectable && <th style={{ width: 36 }} />}
              <th>Hotel</th>
              <th>Confirmed</th>
              <th>Contact</th>
              {showCamp && <th>Camp</th>}
              <th>Revisit</th>
              <th className="num">Price</th>
              <th>Added by</th>
              <th />
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.key}>
              <tr className={'grp-row ' + g.state}>
                <td colSpan={(selectable ? 1 : 0) + (showCamp ? 8 : 7)}>{groupHead(g)}</td>
              </tr>
              {g.leads.map((l) => (
                <tr key={l.id} className={'click' + (selected?.has(l.id) ? ' sel' : '')} onClick={() => router.push('/leads/' + l.id)}>
                  {selectable && (
                    <td>
                      <Check checked={selected.has(l.id)} onChange={() => onToggle(l.id)} label={`Select ${l.hotel_name}`} />
                    </td>
                  )}
                  <td>
                    <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                      <Thumb lead={l} />
                      <div>
                        <div className="cell-title">{l.hotel_name}</div>
                        <div className="cell-sub">{l.owner_name || timeAgo(l.created_at)}</div>
                      </div>
                    </div>
                  </td>
                  <td><PctBadge value={l.confirmation} /></td>
                  <td className="mono">{l.contact || '—'}</td>
                  {showCamp && <td>{l.areas?.name || '—'}</td>}
                  <td>{l.revisit_date ? shortDate(l.revisit_date, today) : <span className="muted">—</span>}</td>
                  <td className="num">{l.price ? inr(l.price) : <span className="muted">—</span>}</td>
                  <td>{l.creator?.name || <span className="muted">—</span>}</td>
                  <td className="right">
                    <a className="btn icon ghost" href={mapsUrl(l.latitude, l.longitude)} target="_blank" rel="noreferrer" title="Open location in Maps" onClick={(e) => e.stopPropagation()}>
                      <Icon name="pin" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}
