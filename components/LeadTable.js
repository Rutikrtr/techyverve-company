'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { inr, mapsUrl, timeAgo } from '@/lib/client';
import { Empty, Icon, PctBadge } from '@/components/ui';

export default function LeadTable({ leads, showCamp = true, emptyHint }) {
  const router = useRouter();

  if (!leads.length) {
    return <Empty icon="list" title="No leads yet" hint={emptyHint || 'Leads you add will show up here.'} />;
  }

  return (
    <>
      {/* Phone: tap-friendly cards */}
      <div className="only-sm">
        {leads.map((l) => (
          <Link key={l.id} href={'/leads/' + l.id} className="lead-card">
            <div className="top">
              <div style={{ minWidth: 0 }}>
                <div className="name">{l.hotel_name}</div>
                <div className="sub">
                  {[showCamp && l.areas?.name, l.owner_name, l.creator?.name].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <PctBadge value={l.confirmation} />
            </div>
            <div className="sub" style={{ marginTop: 6 }}>
              {l.contact || 'No contact'}
              {l.price ? ` · ${inr(l.price)}` : ''} · {timeAgo(l.created_at)}
            </div>
            <div className="bottom">
              {l.contact && (
                <a className="btn" href={'tel:' + l.contact} onClick={(e) => e.stopPropagation()}>
                  <Icon name="phone" size={14} /> Call
                </a>
              )}
              <a
                className="btn"
                href={mapsUrl(l.latitude, l.longitude)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon name="pin" size={14} /> Location
              </a>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="table-wrap hide-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>Hotel</th>
              <th>Confirmed</th>
              <th>Contact</th>
              {showCamp && <th>Camp</th>}
              <th>Owner</th>
              <th className="num">Price</th>
              <th>Added by</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="click" onClick={() => router.push('/leads/' + l.id)}>
                <td>
                  <div className="cell-title">{l.hotel_name}</div>
                  <div className="cell-sub">{timeAgo(l.created_at)}</div>
                </td>
                <td>
                  <PctBadge value={l.confirmation} />
                </td>
                <td className="mono">{l.contact || '—'}</td>
                {showCamp && <td>{l.areas?.name || '—'}</td>}
                <td>{l.owner_name || <span className="muted">—</span>}</td>
                <td className="num">{l.price ? inr(l.price) : <span className="muted">—</span>}</td>
                <td>{l.creator?.name || <span className="muted">—</span>}</td>
                <td className="right">
                  <a
                    className="btn icon ghost"
                    href={mapsUrl(l.latitude, l.longitude)}
                    target="_blank"
                    rel="noreferrer"
                    title="Open location in Maps"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon name="pin" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
