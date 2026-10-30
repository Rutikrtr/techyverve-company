import { db } from '@/lib/supabase';
import { ok, bad, withAuth, clean, num } from '@/lib/api';

export const PATCH = withAuth(
  async (req, { user, params }) => {
    const { data: cur } = await db()
      .from('clients')
      .select('given_price, received')
      .eq('id', params.id)
      .eq('company_id', user.companyId)
      .maybeSingle();
    if (!cur) return bad('Client not found', 404);

    const b = await req.json().catch(() => ({}));
    const patch = {};
    if (b.hotel_name !== undefined) {
      const v = clean(b.hotel_name);
      if (!v) return bad('Hotel name is required');
      patch.hotel_name = v;
    }
    if (b.owner_name !== undefined) patch.owner_name = clean(b.owner_name);
    if (b.contact !== undefined) patch.contact = clean(b.contact);
    if (b.notes !== undefined) patch.notes = clean(b.notes);
    if (b.confirmed_on !== undefined && clean(b.confirmed_on)) patch.confirmed_on = clean(b.confirmed_on);
    if (b.given_price !== undefined) {
      const p = num(b.given_price);
      if (p === null || Number.isNaN(p) || p < 0) return bad('Invalid price');
      patch.given_price = p;
    }
    if (b.received !== undefined) {
      const r = num(b.received) ?? 0;
      if (Number.isNaN(r) || r < 0) return bad('Invalid received amount');
      patch.received = r;
    }
    const price = patch.given_price ?? Number(cur.given_price);
    const rec = patch.received ?? Number(cur.received);
    if (rec > price) return bad('Received amount cannot be more than the deal price');

    const { error } = await db().from('clients').update(patch).eq('id', params.id);
    if (error) throw error;
    return ok({ ok: true });
  },
  { admin: true }
);

export const DELETE = withAuth(
  async (req, { user, params }) => {
    const { error } = await db().from('clients').delete().eq('id', params.id).eq('company_id', user.companyId);
    if (error) throw error;
    return ok({ ok: true });
  },
  { admin: true }
);
