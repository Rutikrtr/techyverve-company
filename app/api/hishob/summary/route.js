import { db } from '@/lib/supabase';
import { ok, withAuth } from '@/lib/api';

const sum = (rows, key) => rows.reduce((t, r) => t + Number(r[key] || 0), 0);

export const GET = withAuth(
  async (req, { user }) => {
    const [{ data: clients }, { data: expenses }] = await Promise.all([
      db().from('clients').select('given_price, received, confirmed_on').eq('company_id', user.companyId),
      db().from('expenses').select('amount, category, spent_on').eq('company_id', user.companyId),
    ]);
    const cl = clients || [];
    const ex = expenses || [];

    const revenue = sum(cl, 'given_price');
    const received = sum(cl, 'received');
    const expenseTotal = sum(ex, 'amount');

    // expenses by category
    const byCat = {};
    ex.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount)));
    const categories = Object.entries(byCat)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    // last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        deals: sum(cl.filter((c) => String(c.confirmed_on).startsWith(key)), 'given_price'),
        received: sum(cl.filter((c) => String(c.confirmed_on).startsWith(key)), 'received'),
        expenses: sum(ex.filter((e) => String(e.spent_on).startsWith(key)), 'amount'),
      });
    }

    return ok({
      totals: {
        clients: cl.length,
        revenue,
        received,
        pending: revenue - received,
        expenses: expenseTotal,
        net_cash: received - expenseTotal,
        net_projected: revenue - expenseTotal,
      },
      categories,
      months,
    });
  },
  { admin: true }
);
