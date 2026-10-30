import { db } from '@/lib/supabase';
import { ok, bad, withAuth, clean, num } from '@/lib/api';

export const GET = withAuth(
  async (req, { user }) => {
    const { data, error } = await db()
      .from('expenses')
      .select('*, by:app_users!created_by(name)')
      .eq('company_id', user.companyId)
      .order('spent_on', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ok({ expenses: data });
  },
  { admin: true }
);

export const POST = withAuth(
  async (req, { user }) => {
    const b = await req.json().catch(() => ({}));
    const title = clean(b.title);
    const amount = num(b.amount);
    if (!title) return bad('Expense title is required');
    if (amount === null || Number.isNaN(amount) || amount < 0) return bad('Enter a valid amount');

    const { data, error } = await db()
      .from('expenses')
      .insert({
        company_id: user.companyId,
        category: clean(b.category) || 'Other',
        title,
        amount,
        spent_on: clean(b.spent_on) || new Date().toISOString().slice(0, 10),
        notes: clean(b.notes),
        created_by: user.id,
      })
      .select('id')
      .single();
    if (error) throw error;
    return ok({ id: data.id }, 201);
  },
  { admin: true }
);
