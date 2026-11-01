'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PCTS } from '@/lib/constants';
import { addDays, dayLabel, isDateStr, todayStr } from '@/lib/dates';
import { api, useFetch } from '@/lib/client';
import { useUser } from '@/components/User';
import { useToast } from '@/components/Toast';
import AddLeadModal from '@/components/AddLeadModal';
import ExportModal from '@/components/ExportModal';
import LeadList from '@/components/LeadList';
import RevisitModal from '@/components/RevisitModal';
import { Icon, Loading } from '@/components/ui';

export default function LeadsPage() {
  const user = useUser();
  const router = useRouter();
  const toast = useToast();
  const today = todayStr();

  const [pct, setPct] = useState(0);
  const [areaId, setAreaId] = useState('');
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState('');
  // ?date=YYYY-MM-DD opens the list on that day (used by the dashboard)
  const [date, setDate] = useState(() => {
    if (typeof window === 'undefined') return '';
    const d = new URLSearchParams(window.location.search).get('date');
    return isDateStr(d) ? d : '';
  });
  const [selected, setSelected] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bulkDate, setBulkDate] = useState(false);

  const areas = useFetch('/areas');
  const qs = new URLSearchParams();
  if (pct) qs.set('pct', pct);
  if (areaId) qs.set('area_id', areaId);
  if (mine) qs.set('mine', '1');
  if (date) qs.set('date', date);
  if (q.trim()) qs.set('q', q.trim());
  const leads = useFetch('/leads?' + qs.toString());

  const areaList = areas.data?.areas || [];
  const list = useMemo(() => leads.data?.leads || [], [leads.data]);
  const selectedLeads = useMemo(() => list.filter((l) => selected.has(l.id)), [list, selected]);
  const allSelected = list.length > 0 && selectedLeads.length === list.length;
  const filtered = Boolean(pct || areaId || mine || date || q.trim());

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleGroup = (items) =>
    setSelected((s) => {
      const n = new Set(s);
      const all = items.every((l) => n.has(l.id));
      items.forEach((l) => (all ? n.delete(l.id) : n.add(l.id)));
      return n;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((l) => l.id)));

  async function saveBulkDate(revisit_date) {
    const { updated } = await api('/leads/bulk', { method: 'PATCH', body: { ids: selectedLeads.map((l) => l.id), revisit_date } });
    toast(`Revisit date set for ${updated} hotel${updated === 1 ? '' : 's'}`);
    setBulkDate(false);
    setSelected(new Set());
    leads.reload();
  }

  const viewLabel = date ? `Revisit date: ${dayLabel(date, today)}` : filtered ? 'With your current filters' : 'Everything on this page';

  return (
    <div className={'page' + (selectedLeads.length ? ' has-sel' : '')}>
      <div className="page-head">
        <div>
          <h1>{user.isAdmin ? 'All hotels' : 'Hotels'}</h1>
          <p>
            {list.length} hotel{list.length === 1 ? '' : 's'} {filtered ? 'match your filters' : 'in total'}
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setExporting(true)}>
            <Icon name="download" /> Export
          </button>
          {areaList.length > 0 && (
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Icon name="plus" /> Add hotel
            </button>
          )}
        </div>
      </div>

      <div className="card flush">
        <div className="toolbar">
          <div className="chips scroll">
            <button className={'chip' + (pct === 0 ? ' on' : '')} onClick={() => setPct(0)}>All</button>
            {PCTS.map((p) => (
              <button key={p} className={'chip' + (pct === p ? ' on' : '')} onClick={() => setPct(p)}>{p}%</button>
            ))}
          </div>

          <div className="row" style={{ width: '100%' }}>
            <div className="datebar">
              <button className="btn icon" onClick={() => setDate(addDays(date || today, -1))} aria-label="Previous day">
                <Icon name="chevL" size={15} />
              </button>
              <label className={'datebar-in' + (date ? ' on' : '')}>
                <Icon name="calendar" size={14} />
                <span>{date ? dayLabel(date, today) : 'Any date'}</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by revisit date" />
              </label>
              <button className="btn icon" onClick={() => setDate(addDays(date || today, 1))} aria-label="Next day">
                <Icon name="chevR" size={15} />
              </button>
              <button className={'chip' + (date === today ? ' on' : '')} onClick={() => setDate(date === today ? '' : today)}>Today</button>
              {date && (
                <button className="btn icon ghost" onClick={() => setDate('')} aria-label="Clear date">
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
            <select className="input" style={{ width: 'auto', minWidth: 0, flex: '0 1 170px' }} value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-label="Camp">
              <option value="">All camps</option>
              {areaList.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button className={'chip' + (mine ? ' on' : '')} onClick={() => setMine((m) => !m)}>Added by me</button>
            <div className="search">
              <Icon name="search" size={14} />
              <input className="input" placeholder="Search hotel, owner, contact" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        {list.length > 0 && (
          <div className="selectall">
            <label className="cb">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all hotels" />
              <span />
            </label>
            <b>Select all</b>
            <span className="muted">
              {selectedLeads.length ? `${selectedLeads.length} of ${list.length} selected` : `${list.length} hotel${list.length === 1 ? '' : 's'}`}
            </span>
          </div>
        )}

        {leads.loading && !leads.data ? (
          <Loading />
        ) : leads.error ? (
          <div className="err" style={{ margin: 16 }}>{leads.error}</div>
        ) : (
          <LeadList
            leads={list}
            selected={selected}
            onToggle={toggle}
            onToggleGroup={toggleGroup}
            emptyHint={
              areaList.length === 0 && !user.isAdmin
                ? 'You are not assigned to a camp yet.'
                : date
                ? 'No revisits on this date. Pick another date or clear the date.'
                : 'Try clearing the filters or add a hotel.'
            }
          />
        )}
      </div>

      {selectedLeads.length > 0 && (
        <div className="selbar" role="toolbar" aria-label="Selected hotels">
          <b>{selectedLeads.length} selected</b>
          <span className="spacer" />
          <button className="btn sm" onClick={() => setBulkDate(true)}>
            <Icon name="calendar" size={14} /> Revisit date
          </button>
          <button className="btn sm primary" onClick={() => setExporting(true)}>
            <Icon name="download" size={14} /> Export
          </button>
          <button className="btn sm ghost" onClick={() => setSelected(new Set())} aria-label="Clear selection">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {areaList.length > 0 && (
        <button className="fab" onClick={() => setAdding(true)}>
          <Icon name="plus" size={18} /> Add hotel
        </button>
      )}

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
      {exporting && <ExportModal view={list} selected={selectedLeads} viewLabel={viewLabel} onClose={() => setExporting(false)} />}
      {bulkDate && (
        <RevisitModal
          title={`Revisit date for ${selectedLeads.length} hotel${selectedLeads.length === 1 ? '' : 's'}`}
          hint="All selected hotels will move to this date."
          onSave={saveBulkDate}
          onClose={() => setBulkDate(false)}
        />
      )}
    </div>
  );
}
