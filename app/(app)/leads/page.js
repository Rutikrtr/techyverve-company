'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PCTS } from '@/lib/constants';
import { useFetch } from '@/lib/client';
import { useUser } from '@/components/User';
import AddLeadModal from '@/components/AddLeadModal';
import LeadTable from '@/components/LeadTable';
import { Icon, Loading } from '@/components/ui';

export default function LeadsPage() {
  const user = useUser();
  const router = useRouter();
  const [pct, setPct] = useState(0);
  const [areaId, setAreaId] = useState('');
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);

  const areas = useFetch('/areas');
  const qs = new URLSearchParams();
  if (pct) qs.set('pct', pct);
  if (areaId) qs.set('area_id', areaId);
  if (mine) qs.set('mine', '1');
  if (q.trim()) qs.set('q', q.trim());
  const leads = useFetch('/leads?' + qs.toString());

  const areaList = areas.data?.areas || [];
  const list = leads.data?.leads || [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{user.isAdmin ? 'All leads' : 'Leads'}</h1>
          <p>{list.length} hotel{list.length === 1 ? '' : 's'} {pct || areaId || mine || q ? 'match your filters' : 'in total'}</p>
        </div>
        {areaList.length > 0 && (
          <button className="btn primary" onClick={() => setAdding(true)}>
            <Icon name="plus" /> Add hotel
          </button>
        )}
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
          <div className="row">
            <select className="input" style={{ width: 'auto', height: 32 }} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">All camps</option>
              {areaList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {user.isAdmin && (
              <button className={'chip' + (mine ? ' on' : '')} onClick={() => setMine((m) => !m)}>
                Added by me
              </button>
            )}
            <div className="search">
              <Icon name="search" size={14} />
              <input className="input" placeholder="Search hotel, owner, contact" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>
        {leads.loading && !leads.data ? (
          <Loading />
        ) : leads.error ? (
          <div className="err" style={{ margin: 16 }}>{leads.error}</div>
        ) : (
          <LeadTable
            leads={list}
            emptyHint={areaList.length === 0 && !user.isAdmin ? 'You are not assigned to a camp yet.' : 'Try clearing the filters or add a hotel.'}
          />
        )}
      </div>

      {adding && (
        <AddLeadModal
          areas={areaList}
          defaultAreaId={areaId}
          onClose={() => setAdding(false)}
          onSaved={(id) => {
            setAdding(false);
            router.push('/leads/' + id);
          }}
        />
      )}
    </div>
  );
}
