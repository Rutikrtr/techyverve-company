import { db } from '@/lib/supabase';
import { ok, bad, withAuth, areaIdsFor, clean, num } from '@/lib/api';
import { PCTS } from '@/lib/constants';

const SELECT = '*, areas(name), creator:app_users!created_by(name)';

export const GET = withAuth(async (req, { user }) => {
  const url = new URL(req.url);
  const ids = await areaIdsFor(user);
  if (ids && ids.length === 0) return ok({ leads: [] });

  let q = db()
    .from('leads')
    .select(SELECT)
    .eq('company_id', user.companyId)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (ids) q = q.in('area_id', ids);
  const areaId = url.searchParams.get('area_id');
  if (areaId) q = q.eq('area_id', areaId);
  const min = Number(url.searchParams.get('min'));
  if (min) q = q.gte('confirmation', min);
  const exact = Number(url.searchParams.get('pct'));
  if (exact) q = q.eq('confirmation', exact);
  if (url.searchParams.get('mine') === '1') q = q.eq('created_by', user.id);
  const search = (url.searchParams.get('q') || '').trim().replace(/[%,()]/g, ' ');
  if (search) q = q.or(`hotel_name.ilike.%${search}%,contact.ilike.%${search}%,owner_name.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return ok({ leads: data });
});

export const POST = withAuth(async (req, { user }) => {
  const b = await req.json().catch(() => ({}));

  const hotel_name = clean(b.hotel_name);
  const contact = clean(b.contact);
  const confirmation = Number(b.confirmation);
  const latitude = num(b.latitude);
  const longitude = num(b.longitude);
  const price = num(b.price);

  if (!hotel_name) return bad('Hotel name is required');
  if (!contact) return bad('Hotel contact number is required');
  if (!PCTS.includes(confirmation)) return bad('Pick a confirmation percentage (10, 30, 50, 70, 90 or 100)');
  if (!b.area_id) return bad('Pick a camp');
  if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return bad('Location is required. Turn on location on your phone and try again.');
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return bad('Invalid location');
  if (Number.isNaN(price) || (price !== null && price < 0)) return bad('Price must be a positive number');

  const ids = await areaIdsFor(user);
  if (ids && !ids.includes(b.area_id)) return bad('You are not assigned to this camp', 403);

  const { data: lead, error } = await db()
    .from('leads')
    .insert({
      company_id: user.companyId,
      area_id: b.area_id,
      created_by: user.id,
      hotel_name,
      contact,
      owner_name: clean(b.owner_name),
      price,
      confirmation,
      latitude,
      longitude,
      location_accuracy: num(b.location_accuracy),
    })
    .select('id')
    .single();
  if (error) throw error;

  const remark = clean(b.remark);
  if (remark) {
    await db().from('lead_remarks').insert({ lead_id: lead.id, user_id: user.id, body: remark, kind: 'note' });
  }
  return ok({ id: lead.id }, 201);
});
