'use client';
import Link from 'next/link';
import { PCTS } from '@/lib/constants';
import { inr, timeAgo, useFetch } from '@/lib/client';
import { todayStr } from '@/lib/dates';
import { useUser } from '@/components/User';
import { Loading, PctBadge, PCT_COLORS, Empty } from '@/components/ui';

export default function Dashboard() {
  const user = useUser();
  const { data, loading, error } = useFetch('/dashboard?today=' + todayStr());

  if (loading) return <Loading />;
  if (error) return <div className="page"><div className="err">{error}</div></div>;

  const { stats, pipeline, recent, team, hishob, revisits } = data;
  const max = Math.max(1, ...Object.values(pipeline));
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>
            {greet}, {user.name.split(' ')[0]}
          </h1>
          <p>{user.isAdmin ? 'Here is how the whole company is doing.' : 'Here is your field progress.'}</p>
        </div>
        <Link href="/leads" className="btn primary">
          View leads
        </Link>
      </div>

      <div className="grid g4">
        <div className="card kpi">
          <div className="label">{user.isAdmin ? 'Total leads' : 'Leads in my camps'}</div>
          <div className="value">{stats.leads}</div>
        </div>
        <div className="card kpi">
          <div className="label">Hot (70%+)</div>
          <div className="value">{stats.hot}</div>
        </div>
        <div className="card kpi">
          <div className="label">Confirmed (100%)</div>
          <div className="value pos">{stats.confirmed}</div>
        </div>
        <div className="card kpi">
          <div className="label">{user.isAdmin ? 'Camps' : 'Added by me'}</div>
          <div className="value">{user.isAdmin ? stats.camps : stats.mine}</div>
        </div>
      </div>

      {hishob && (
        <div className="grid g4 mt">
          <div className="card kpi accent">
            <div className="label">Deal value</div>
            <div className="value">{inr(hishob.revenue)}</div>
            <div className="hint">{hishob.clients} confirmed clients</div>
          </div>
          <div className="card kpi">
            <div className="label">Received</div>
            <div className="value">{inr(hishob.received)}</div>
          </div>
          <div className="card kpi">
            <div className="label">Expenses</div>
            <div className="value">{inr(hishob.expenses)}</div>
          </div>
          <div className="card kpi">
            <div className="label">Net (received − expenses)</div>
            <div className={'value ' + (hishob.net_cash >= 0 ? 'pos' : 'neg')}>{inr(hishob.net_cash)}</div>
          </div>
        </div>
      )}

      <div className="card flush mt">
        <div className="card-head">
          <div className="row" style={{ gap: 8 }}>
            <h2>Revisit today</h2>
            <span className="badge blue">{revisits.today}</span>
            {revisits.overdue > 0 && <span className="badge off">{revisits.overdue} overdue</span>}
          </div>
          <Link href={'/leads?date=' + revisits.date} className="btn sm ghost">
            See all
          </Link>
        </div>
        {revisits.list.length === 0 ? (
          <Empty icon="calendar" title="No revisits today" hint="Hotels with today as the revisit date appear here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {revisits.list.map((l) => (
                  <tr key={l.id} className="click" onClick={() => (window.location.href = '/leads/' + l.id)}>
                    <td>
                      <div className="cell-title">{l.hotel_name}</div>
                      <div className="cell-sub">{l.areas?.name}{l.contact ? ` · ${l.contact}` : ''}</div>
                    </td>
                    <td><PctBadge value={l.confirmation} /></td>
                    <td className="right">
                      {l.contact && (
                        <a className="btn sm" href={'tel:' + l.contact} onClick={(e) => e.stopPropagation()}>Call</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid g-main mt">
        <div className="card flush">
          <div className="card-head">
            <h2>Recent leads</h2>
            <Link href="/leads" className="btn sm ghost">
              See all
            </Link>
          </div>
          {recent.length === 0 ? (
            <Empty icon="list" title="No leads yet" hint="Open a camp and add the first hotel." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {recent.map((l) => (
                    <tr key={l.id} className="click" onClick={() => (window.location.href = '/leads/' + l.id)}>
                      <td>
                        <div className="cell-title">{l.hotel_name}</div>
                        <div className="cell-sub">
                          {l.areas?.name} · {l.creator?.name || 'Unknown'}
                        </div>
                      </td>
                      <td>
                        <PctBadge value={l.confirmation} />
                      </td>
                      <td className="right muted">{timeAgo(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <div className="card-head">
              <h2>Pipeline</h2>
            </div>
            <div className="bars">
              {PCTS.map((p) => (
                <div className="bar-row" key={p}>
                  <span style={{ color: PCT_COLORS[p], fontWeight: 600 }}>{p}%</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(pipeline[p] / max) * 100}%`, '--c': PCT_COLORS[p] }} />
                  </div>
                  <span className="v">{pipeline[p]}</span>
                </div>
              ))}
            </div>
          </div>

          {team && (
            <div className="card">
              <div className="card-head">
                <h2>Team activity</h2>
                <Link href="/team" className="btn sm ghost">
                  Manage
                </Link>
              </div>
              {team.length === 0 ? (
                <p className="muted">No team members yet.</p>
              ) : (
                <div className="bars">
                  {team.map((m) => (
                    <div className="bar-row wide" key={m.id}>
                      <span className="ink" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(m.leads / Math.max(1, team[0].leads)) * 100}%` }} />
                      </div>
                      <span className="v">{m.leads} leads</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
