import { db } from '@/lib/supabase';
import { ok, bad, withAuth, clean, num } from '@/lib/api';

export const PATCH = withAuth(
  async (req, { user, params }) => {
    const b = await req.json().catch(() => ({}));
    const patch = {};
    if (b.title !== undefined) {
      const v = clean(b.title);
      if (!v) return bad('Expense title is required');
      patch.title = v;
    }
    if (b.category !== undefined) patch.category = clean(b.category) || 'Other';
    if (b.notes !== undefined) patch.notes = clean(b.notes);
    if (b.spent_on !== undefined && clean(b.spent_on)) patch.spent_on = clean(b.spent_on);
    if (b.amount !== undefined) {
      const a = num(b.amount);
      if (a === null || Number.isNaN(a) || a < 0) return bad('Enter a valid amount');
      patch.amount = a;
    }
    if (!Object.keys(patch).length) return bad('Nothing to update');

    const { error } = await db().from('expenses').update(patch).eq('id', params.id).eq('company_id', user.companyId);
    if (error) throw error;
    return ok({ ok: true });
  },
  { admin: true }
);

export const DELETE = withAuth(
  async (req, { user, params }) => {
    const { error } = await db().from('expenses').delete().eq('id', params.id).eq('company_id', user.companyId);
    if (error) throw error;
    return ok({ ok: true });
  },
  { admin: true }
);
