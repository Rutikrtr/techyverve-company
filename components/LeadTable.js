'use client';
import { useRouter } from 'next/navigation';
import { inr, mapsUrl, timeAgo } from '@/lib/client';
import { Empty, Icon, PctBadge } from '@/components/ui';

export default function LeadTable({ leads, showCamp = true, emptyHint }) {
  const router = useRouter();

  if (!leads.length) {
    return <Empty icon="list" title="No leads yet" hint={emptyHint || 'Leads you add will show up here.'} />;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Hotel</th>
            <th>Confirmed</th>
            <th>Contact</th>
            {showCamp && <th className="hide-sm">Camp</th>}
            <th className="hide-sm">Owner</th>
            <th className="num hide-sm">Price</th>
            <th className="hide-sm">Added by</th>
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
              {showCamp && <td className="hide-sm">{l.areas?.name || '—'}</td>}
              <td className="hide-sm">{l.owner_name || <span className="muted">—</span>}</td>
              <td className="num hide-sm">{l.price ? inr(l.price) : <span className="muted">—</span>}</td>
              <td className="hide-sm">{l.creator?.name || <span className="muted">—</span>}</td>
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
  );
}
