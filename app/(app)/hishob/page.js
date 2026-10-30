'use client';
import { useState } from 'react';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { api, fmtDate, inr, useFetch } from '@/lib/client';
import { useToast } from '@/components/Toast';
import ClientModal from '@/components/ClientModal';
import { Empty, Icon, Loading, Modal } from '@/components/ui';

/* ---------------- Summary ---------------- */
function Summary() {
  const { data, loading, error } = useFetch('/hishob/summary');
  if (loading) return <Loading />;
  if (error) return <div className="err">{error}</div>;

  const { totals: t, categories, months } = data;
  const maxCat = Math.max(1, ...categories.map((c) => c.total));
  const maxMonth = Math.max(1, ...months.flatMap((m) => [m.deals, m.expenses]));

  return (
    <>
      <div className="grid g4">
        <div className="card kpi accent">
          <div className="label">Deal value (confirmed)</div>
          <div className="value">{inr(t.revenue)}</div>
          <div className="hint">{t.clients} clients</div>
        </div>
        <div className="card kpi">
          <div className="label">Received</div>
          <div className="value">{inr(t.received)}</div>
          <div className="hint">Pending {inr(t.pending)}</div>
        </div>
        <div className="card kpi">
          <div className="label">Total expenses</div>
          <div className="value">{inr(t.expenses)}</div>
        </div>
        <div className="card kpi">
          <div className="label">Net cash (received − expenses)</div>
          <div className={'value ' + (t.net_cash >= 0 ? 'pos' : 'neg')}>{inr(t.net_cash)}</div>
          <div className="hint">Projected {inr(t.net_projected)} once all pending is collected</div>
        </div>
      </div>

      <div className="grid g2 mt">
        <div className="card">
          <div className="card-head"><h2>Expenses by category</h2></div>
          {categories.length === 0 ? (
            <p className="muted">No expenses recorded yet.</p>
          ) : (
            <div className="bars">
              {categories.map((c) => (
                <div className="bar-row wide" key={c.category}>
                  <span className="ink">{c.category}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(c.total / maxCat) * 100}%` }} />
                  </div>
                  <span className="v">{inr(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h2>Last 6 months</h2></div>
          <div className="bars">
            {months.map((m) => (
              <div key={m.key} style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 10, alignItems: 'center', fontSize: 12 }}>
                <span className="muted">{m.label}</span>
                <div style={{ display: 'grid', gap: 3 }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <div className="bar-track" style={{ flex: 1 }}>
                      <div className="bar-fill" style={{ width: `${(m.deals / maxMonth) * 100}%`, '--c': '#16a34a' }} />
                    </div>
                    <span className="mono" style={{ width: 78, textAlign: 'right' }}>{inr(m.deals)}</span>
                  </div>
                  <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <div className="bar-track" style={{ flex: 1 }}>
                      <div className="bar-fill" style={{ width: `${(m.expenses / maxMonth) * 100}%`, '--c': '#ea1013' }} />
                    </div>
                    <span className="mono" style={{ width: 78, textAlign: 'right' }}>{inr(m.expenses)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="row mt muted" style={{ fontSize: 11.5, gap: 14 }}>
            <span><span style={{ color: '#16a34a' }}>●</span> Deals confirmed</span>
            <span><span style={{ color: '#ea1013' }}>●</span> Expenses</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Clients ---------------- */
function Clients() {
  const { data, loading, error, reload } = useFetch('/clients');
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');

  if (loading) return <Loading />;
  const all = data?.clients || [];
  const list = all.filter((c) => !q.trim() || `${c.hotel_name} ${c.owner_name || ''}`.toLowerCase().includes(q.trim().toLowerCase()));
  const total = list.reduce((t, c) => t + Number(c.given_price), 0);
  const received = list.reduce((t, c) => t + Number(c.received), 0);

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="search">
          <Icon name="search" size={14} />
          <input className="input" placeholder="Search confirmed hotels" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setModal('new')}>
          <Icon name="plus" /> Add confirmed hotel
        </button>
      </div>
      {error && <div className="err">{error}</div>}

      <div className="card flush">
        {list.length === 0 ? (
          <Empty icon="book" title="No confirmed clients" hint="Add hotels that have confirmed, with the price they agreed to." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Hotel</th>
                  <th className="hide-sm">Contact</th>
                  <th className="hide-sm">Confirmed</th>
                  <th className="num">Price</th>
                  <th className="num">Received</th>
                  <th className="num">Pending</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const pending = Number(c.given_price) - Number(c.received);
                  return (
                    <tr key={c.id} className="click" onClick={() => setModal(c)}>
                      <td>
                        <div className="cell-title">{c.hotel_name}</div>
                        <div className="cell-sub">{c.owner_name || 'Owner not added'}</div>
                      </td>
                      <td className="hide-sm mono">{c.contact || '—'}</td>
                      <td className="hide-sm">{fmtDate(c.confirmed_on)}</td>
                      <td className="num ink">{inr(c.given_price)}</td>
                      <td className="num">{inr(c.received)}</td>
                      <td className={'num ' + (pending > 0 ? 'neg' : 'pos')}>{pending > 0 ? inr(pending) : 'Paid'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="hide-sm" />
                  <td className="num cell-title">{inr(total)}</td>
                  <td className="num cell-title">{inr(received)}</td>
                  <td className="num cell-title">{inr(total - received)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <ClientModal
          client={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </>
  );
}

/* ---------------- Expenses ---------------- */
function ExpenseModal({ expense, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    category: expense?.category || 'Marketing',
    title: expense?.title || '',
    amount: expense?.amount ?? '',
    spent_on: expense?.spent_on || new Date().toISOString().slice(0, 10),
    notes: expense?.notes || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setError('');
    setBusy(true);
    try {
      if (expense) await api('/expenses/' + expense.id, { method: 'PATCH', body: form });
      else await api('/expenses', { method: 'POST', body: form });
      toast(expense ? 'Expense updated' : 'Expense added');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete expense "${expense.title}"?`)) return;
    setBusy(true);
    try {
      await api('/expenses/' + expense.id, { method: 'DELETE' });
      toast('Expense deleted');
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={expense ? 'Edit expense' : 'Add expense'}
      onClose={onClose}
      footer={
        <>
          {expense && (
            <button className="btn danger" style={{ marginRight: 'auto' }} onClick={remove} disabled={busy}>
              <Icon name="trash" /> Delete
            </button>
          )}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy || !form.title.trim() || form.amount === ''}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="err">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Category</label>
          <select className="input" value={form.category} onChange={set('category')}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" value={form.spent_on} onChange={set('spent_on')} />
        </div>
      </div>
      <div className="field">
        <label>What was it for?</label>
        <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Instagram ads, office rent" autoFocus />
      </div>
      <div className="field">
        <label>Amount (₹)</label>
        <input className="input" type="number" inputMode="decimal" min="0" value={form.amount} onChange={set('amount')} />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Notes <span className="opt">(optional)</span></label>
        <textarea className="input" value={form.notes} onChange={set('notes')} />
      </div>
    </Modal>
  );
}

function Expenses() {
  const { data, loading, error, reload } = useFetch('/expenses');
  const [modal, setModal] = useState(null);
  const [cat, setCat] = useState('');

  if (loading) return <Loading />;
  const all = data?.expenses || [];
  const list = cat ? all.filter((e) => e.category === cat) : all;
  const total = list.reduce((t, e) => t + Number(e.amount), 0);
  const used = [...new Set(all.map((e) => e.category))];

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="chips">
          <button className={'chip' + (!cat ? ' on' : '')} onClick={() => setCat('')}>All</button>
          {used.map((c) => (
            <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setModal('new')}>
          <Icon name="plus" /> Add expense
        </button>
      </div>
      {error && <div className="err">{error}</div>}

      <div className="card flush">
        {list.length === 0 ? (
          <Empty icon="receipt" title="No expenses yet" hint="Track marketing, salaries, travel and other company or project costs." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th className="hide-sm">Date</th>
                  <th className="hide-sm">Added by</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className="click" onClick={() => setModal(e)}>
                    <td>
                      <div className="cell-title">{e.title}</div>
                      {e.notes && <div className="cell-sub">{e.notes}</div>}
                    </td>
                    <td><span className="badge">{e.category}</span></td>
                    <td className="hide-sm">{fmtDate(e.spent_on)}</td>
                    <td className="hide-sm">{e.by?.name || '—'}</td>
                    <td className="num ink">{inr(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} />
                  <td colSpan={2} className="hide-sm" />
                  <td className="num cell-title">{inr(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <ExpenseModal
          expense={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </>
  );
}

/* ---------------- Page ---------------- */
export default function HishobPage() {
  const [tab, setTab] = useState('summary');
  const tabs = [
    ['summary', 'Summary'],
    ['clients', 'Confirmed clients'],
    ['expenses', 'Expenses'],
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hishob</h1>
          <p>Confirmed clients, what they pay, and what the company spends.</p>
        </div>
      </div>
      <div className="tabs">
        {tabs.map(([k, label]) => (
          <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'summary' && <Summary />}
      {tab === 'clients' && <Clients />}
      {tab === 'expenses' && <Expenses />}
    </div>
  );
}
