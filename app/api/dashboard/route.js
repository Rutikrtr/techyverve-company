import { db } from '@/lib/supabase';
import { ok, withAuth, areaIdsFor } from '@/lib/api';
import { PCTS } from '@/lib/constants';
import { isDateStr, todayStr } from '@/lib/dates';

export const GET = withAuth(async (req, { user }) => {
  const todayParam = new URL(req.url).searchParams.get('today');
  const today = isDateStr(todayParam) ? todayParam : todayStr();
  const ids = await areaIdsFor(user);

  let leads = [];
  let areaCount = 0;
  if (!ids || ids.length) {
    let lq = db()
      .from('leads')
      .select('id, hotel_name, confirmation, created_by, created_at, revisit_date, contact, areas(name), creator:app_users!created_by(name)')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (ids) lq = lq.in('area_id', ids);
    const { data, error: leadsErr } = await lq;
    if (leadsErr) throw leadsErr;
    leads = data || [];

    if (ids) areaCount = ids.length;
    else {
      const { count } = await db().from('areas').select('id', { count: 'exact', head: true }).eq('company_id', user.companyId);
      areaCount = count || 0;
    }
  }

  const pipeline = Object.fromEntries(PCTS.map((p) => [p, 0]));
  leads.forEach((l) => (pipeline[l.confirmation] += 1));

  const out = {
    stats: {
      leads: leads.length,
      camps: areaCount,
      hot: leads.filter((l) => l.confirmation >= 70).length,
      confirmed: leads.filter((l) => l.confirmation === 100).length,
      mine: leads.filter((l) => l.created_by === user.id).length,
    },
    pipeline,
    recent: leads.slice(0, 6),
    revisits: {
      today: leads.filter((l) => l.revisit_date === today).length,
      overdue: leads.filter((l) => l.revisit_date && l.revisit_date < today && l.confirmation < 100).length,
      list: leads.filter((l) => l.revisit_date === today).slice(0, 6),
      date: today,
    },
  };

  if (user.isAdmin) {
    const [{ data: members }, { data: clients }, { data: expenses }] = await Promise.all([
      db().from('app_users').select('id, name, active').eq('company_id', user.companyId).eq('role', 'member'),
      db().from('clients').select('given_price, received').eq('company_id', user.companyId),
      db().from('expenses').select('amount').eq('company_id', user.companyId),
    ]);
    const counts = {};
    leads.forEach((l) => l.created_by && (counts[l.created_by] = (counts[l.created_by] || 0) + 1));
    out.team = (members || [])
      .map((m) => ({ id: m.id, name: m.name, active: m.active, leads: counts[m.id] || 0 }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 6);

    const revenue = (clients || []).reduce((t, c) => t + Number(c.given_price), 0);
    const received = (clients || []).reduce((t, c) => t + Number(c.received), 0);
    const spent = (expenses || []).reduce((t, e) => t + Number(e.amount), 0);
    out.hishob = { revenue, received, expenses: spent, net_cash: received - spent, clients: (clients || []).length };
  }

  return ok(out);
});
