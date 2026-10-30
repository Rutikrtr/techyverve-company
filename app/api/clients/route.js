import { db } from '@/lib/supabase';
import { ok, bad, withAuth, clean, num } from '@/lib/api';

export const GET = withAuth(
  async (req, { user }) => {
    const { data, error } = await db()
      .from('clients')
      .select('*')
      .eq('company_id', user.companyId)
      .order('confirmed_on', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ok({ clients: data });
  },
  { admin: true }
);

export const POST = withAuth(
  async (req, { user }) => {
    const b = await req.json().catch(() => ({}));
    const hotel_name = clean(b.hotel_name);
    const given_price = num(b.given_price);
    const received = num(b.received) ?? 0;

    if (!hotel_name) return bad('Hotel name is required');
    if (given_price === null || Number.isNaN(given_price) || given_price < 0) return bad('Enter the price given by the client');
    if (Number.isNaN(received) || received < 0) return bad('Received amount must be a positive number');
    if (received > given_price) return bad('Received amount cannot be more than the deal price');

    const { data, error } = await db()
      .from('clients')
      .insert({
        company_id: user.companyId,
        lead_id: b.lead_id || null,
        hotel_name,
        owner_name: clean(b.owner_name),
        contact: clean(b.contact),
        given_price,
        received,
        confirmed_on: clean(b.confirmed_on) || new Date().toISOString().slice(0, 10),
        notes: clean(b.notes),
      })
      .select('id')
      .single();
    if (error) throw error;
    return ok({ id: data.id }, 201);
  },
  { admin: true }
);
