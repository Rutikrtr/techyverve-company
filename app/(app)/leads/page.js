'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PCTS } from '@/lib/constants';
import { addDays, dayLabel, isDateStr, todayStr } from '@/lib/dates';
import { haptic } from '@/lib/haptic';
import { api, useFetch } from '@/lib/client';
import { useUser } from '@/components/User';
import { useToast } from '@/components/Toast';
import AddLeadModal from '@/components/AddLeadModal';
import ExportModal from '@/components/ExportModal';
import LeadList from '@/components/LeadList';
import PullToRefresh from '@/components/PullToRefresh';
import RevisitModal from '@/components/RevisitModal';
import { Icon, Loading } from '@/components/ui';

export default function LeadsPage() {
  const user = useUser();
  const router = useRouter();
  const toast = useToast();
  const today = todayStr();
  const tomorrow = addDays(today, 1);

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
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bulkDate, setBulkDate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
  const customDate = date && date !== today && date !== tomorrow;
  const filterCount = (pct ? 1 : 0) + (areaId ? 1 : 0) + (mine ? 1 : 0);

  // One-time hint so people discover press-and-hold
  useEffect(() => {
    try {
      if (!list.length || localStorage.getItem('tv_hint_hold') === '1') return;
      localStorage.setItem('tv_hint_hold', '1');
      if (window.matchMedia('(max-width: 760px)').matches) toast('Tip: press and hold a hotel to select it');
    } catch {}
  }, [list.length, toast]);

  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const startSelect = (id) => {
    haptic(18);
    setSelecting(true);
    setSelected(new Set(id ? [id] : []));
  };
  const toggle = (id) => {
    haptic(8);
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleGroup = (items) =>
    setSelected((s) => {
      const n = new Set(s);
      const all = items.every((l) => n.has(l.id));
      items.forEach((l) => (all ? n.delete(l.id) : n.add(l.id)));
      return n;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((l) => l.id)));
  const refresh = useCallback(() => leads.reload(), [leads]);

  async function saveBulkDate(revisit_date) {
    const { updated } = await api('/leads/bulk', { method: 'PATCH', body: { ids: selectedLeads.map((l) => l.id), revisit_date } });
    toast(`Revisit date set for ${updated} hotel${updated === 1 ? '' : 's'}`);
    setBulkDate(false);
    exitSelect();
    leads.reload();
  }

  const viewLabel = date ? `Revisit date: ${dayLabel(date, today)}` : filtered ? 'With your current filters' : 'Everything on this page';

  return (
    <div className={'page' + (selecting ? ' has-sel' : '')}>
      <PullToRefresh onRefresh={refresh} />
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
            <button className={'chip' + (!date ? ' on' : '')} onClick={() => setDate('')}>All dates</button>
            <button className={'chip' + (date === today ? ' on' : '')} onClick={() => setDate(today)}>Today</button>
            <button className={'chip' + (date === tomorrow ? ' on' : '')} onClick={() => setDate(tomorrow)}>Tomorrow</button>
            <label className={'chip pick' + (customDate ? ' on' : '')}>
              <Icon name="calendar" size={13} /> {customDate ? dayLabel(date, today) : 'Pick date'}
              <input type="date" value={customDate ? date : ''} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a revisit date" />
            </label>
            {date && (
              <>
                <button className="chip step" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
                  <Icon name="chevL" size={14} />
                </button>
                <button className="chip step" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
                  <Icon name="chevR" size={14} />
                </button>
              </>
            )}
          </div>

          <div className="row searchrow">
            <div className="search">
              <Icon name="search" size={14} />
              <input className="input" placeholder="Search hotel, owner, contact" value={q} onChange={(e) => setQ(e.target.value)} type="search" inputMode="search" enterKeyHint="search" data-enter-blur="1" autoComplete="off" />
            </div>
            <button className={'btn filters-btn' + (filterCount ? ' active' : '')} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              <Icon name="filter" size={15} /> Filters{filterCount ? <span className="dot">{filterCount}</span> : null}
            </button>
          </div>

          <div className={'filter-panel' + (showFilters ? ' open' : '')}>
            <div className="chips scroll">
              <button className={'chip' + (pct === 0 ? ' on' : '')} onClick={() => setPct(0)}>All %</button>
              {PCTS.map((p) => (
                <button key={p} className={'chip' + (pct === p ? ' on' : '')} onClick={() => setPct(p)}>{p}%</button>
              ))}
            </div>
            <div className="row">
              <select className="input" value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-label="Camp">
                <option value="">All camps</option>
                {areaList.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <button className={'chip' + (mine ? ' on' : '')} onClick={() => setMine((m) => !m)}>Added by me</button>
            </div>
          </div>
        </div>

        {list.length > 0 && (
          <div className="metarow">
            <span>
              {selecting ? `${selectedLeads.length} of ${list.length} selected` : `${list.length} hotel${list.length === 1 ? '' : 's'}`}
            </span>
            <button className="linkbtn" onClick={() => (selecting ? exitSelect() : startSelect())}>
              {selecting ? 'Done' : 'Select'}
            </button>
          </div>
        )}

        {leads.loading && !leads.data ? (
          <Loading />
        ) : leads.error ? (
          <div className="err" style={{ margin: 16 }}>{leads.error}</div>
        ) : (
          <LeadList
            leads={list}
            selecting={selecting}
            selected={selected}
            onToggle={toggle}
            onToggleGroup={toggleGroup}
            onLongPress={startSelect}
            emptyHint={
              areaList.length === 0 && !user.isAdmin
                ? 'You are not assigned to a camp yet.'
                : date
                ? 'No revisits on this date. Pick another date or choose All dates.'
                : 'Try clearing the filters or add a hotel.'
            }
          />
        )}
      </div>

      {selecting && (
        <div className="selbar" role="toolbar" aria-label="Selected hotels">
          <button className="btn icon ghost" onClick={exitSelect} aria-label="Cancel selection">
            <Icon name="x" size={16} />
          </button>
          <b>{selectedLeads.length} selected</b>
          <span className="spacer" />
          <button className="btn sm" onClick={toggleAll}>{allSelected ? 'None' : 'Select all'}</button>
          <button className="btn sm" onClick={() => setBulkDate(true)} disabled={!selectedLeads.length} aria-label="Change revisit date">
            <Icon name="calendar" size={14} />
          </button>
          <button className="btn sm primary" onClick={() => setExporting(true)} disabled={!selectedLeads.length}>
            <Icon name="download" size={14} /> Export
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
