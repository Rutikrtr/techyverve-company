'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PCTS } from '@/lib/constants';
import { initials, useFetch } from '@/lib/client';
import AddLeadModal from '@/components/AddLeadModal';
import LeadList from '@/components/LeadList';
import { Icon, Loading } from '@/components/ui';

export default function CampDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [pct, setPct] = useState(0);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);

  const camp = useFetch('/areas/' + id);
  const qs = new URLSearchParams({ area_id: id });
  if (pct) qs.set('pct', pct);
  if (q.trim()) qs.set('q', q.trim());
  const leads = useFetch('/leads?' + qs.toString());

  if (camp.loading) return <Loading />;
  if (camp.error)
    return (
      <div className="page">
        <div className="err">{camp.error}</div>
        <Link href="/camps" className="btn">Back to camps</Link>
      </div>
    );

  const a = camp.data.area;

  return (
    <div className="page">
      <Link href="/camps" className="crumb">
        <Icon name="back" size={13} /> Camps
      </Link>
      <div className="page-head">
        <div>
          <h1>{a.name}</h1>
          <p>
            {a.city || 'No city set'}
            {a.notes ? ` · ${a.notes}` : ''}
          </p>
        </div>
        <button className="btn primary" onClick={() => setAdding(true)}>
          <Icon name="plus" /> Add hotel
        </button>
      </div>

      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div className="label">Leads</div>
          <div className="value">{a.stats.total}</div>
        </div>
        <div className="card kpi">
          <div className="label">Hot (70%+)</div>
          <div className="value">{a.stats.hot}</div>
        </div>
        <div className="card kpi">
          <div className="label">Confirmed</div>
          <div className="value pos">{a.stats.confirmed}</div>
        </div>
        <div className="card kpi">
          <div className="label">Team</div>
          <div className="row" style={{ marginTop: 6 }}>
            {a.members.length === 0 && <span className="muted">No one assigned</span>}
            <div className="stack">
              {a.members.slice(0, 5).map((m) => (
                <span key={m.id} className="avatar sm" title={m.name}>
                  {initials(m.name)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card flush">
        <div className="card-head" style={{ flexWrap: 'wrap' }}>
          <div className="chips">
            <button className={'chip' + (pct === 0 ? ' on' : '')} onClick={() => setPct(0)}>
              All
            </button>
            {PCTS.map((p) => (
              <button key={p} className={'chip' + (pct === p ? ' on' : '')} onClick={() => setPct(p)}>
                {p}%
              </button>
            ))}
          </div>
          <div className="search">
            <Icon name="search" size={14} />
            <input className="input" placeholder="Search hotel, owner, contact" value={q} onChange={(e) => setQ(e.target.value)} type="search" inputMode="search" enterKeyHint="search" data-enter-blur="1" autoComplete="off" />
          </div>
        </div>
        {leads.loading && !leads.data ? (
          <Loading />
        ) : (
          <LeadList leads={leads.data?.leads || []} showCamp={false} emptyHint="Tap “Add hotel” to log the first one." />
        )}
      </div>


      <button className="fab" onClick={() => setAdding(true)}>
        <Icon name="plus" size={18} /> Add hotel
      </button>

      {adding && (
        <AddLeadModal
          areas={[{ id: a.id, name: a.name, city: a.city }]}
          defaultAreaId={a.id}
          onClose={() => setAdding(false)}
          onSaved={(leadId) => {
            setAdding(false);
            router.push('/leads/' + leadId);
          }}
        />
      )}
    </div>
  );
}
