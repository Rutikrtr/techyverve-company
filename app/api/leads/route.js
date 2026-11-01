import { randomUUID } from 'crypto';
import { db } from '@/lib/supabase';
import { ok, bad, withAuth, areaIdsFor, clean, num } from '@/lib/api';
import { PCTS } from '@/lib/constants';
import { isDateStr } from '@/lib/dates';
import { removePhotos, uploadPhoto, withPhotoUrls } from '@/lib/storage';

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
  const date = url.searchParams.get('date');
  if (date) {
    if (!isDateStr(date)) return bad('Invalid date');
    q = q.eq('revisit_date', date);
  }
  if (url.searchParams.get('mine') === '1') q = q.eq('created_by', user.id);
  const search = (url.searchParams.get('q') || '').trim().replace(/[%,()]/g, ' ');
  if (search) q = q.or(`hotel_name.ilike.%${search}%,contact.ilike.%${search}%,owner_name.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return ok({ leads: await withPhotoUrls(data) });
});

// Create a lead. Sent as multipart/form-data because it carries the hotel photo.
export const POST = withAuth(async (req, { user }) => {
  let form;
  try {
    form = await req.formData();
  } catch {
    return bad('Could not read the form. Please try again.');
  }
  const f = (k) => form.get(k);

  const hotel_name = clean(f('hotel_name'));
  const contact = clean(f('contact'));
  const confirmation = Number(f('confirmation'));
  const latitude = num(f('latitude'));
  const longitude = num(f('longitude'));
  const price = num(f('price'));
  const revisit_date = clean(f('revisit_date'));
  const area_id = clean(f('area_id'));

  if (!hotel_name) return bad('Hotel name is required');
  if (!contact) return bad('Hotel contact number is required');
  if (!PCTS.includes(confirmation)) return bad('Pick a confirmation percentage (10, 30, 50, 70, 90 or 100)');
  if (!area_id) return bad('Pick a camp');
  if (!revisit_date || !isDateStr(revisit_date)) return bad('Pick a revisit date');
  if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return bad('Location is required. Turn on location on your phone and try again.');
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return bad('Invalid location');
  if (Number.isNaN(price) || (price !== null && price < 0)) return bad('Price must be a positive number');

  const ids = await areaIdsFor(user);
  if (ids && !ids.includes(area_id)) return bad('You are not assigned to this camp', 403);

  const id = randomUUID();
  const photo = await uploadPhoto(user.companyId, id, f('photo'));
  if (photo.error) return bad(photo.error);

  const { error } = await db().from('leads').insert({
    id,
    company_id: user.companyId,
    area_id,
    created_by: user.id,
    hotel_name,
    contact,
    owner_name: clean(f('owner_name')),
    price,
    confirmation,
    latitude,
    longitude,
    location_accuracy: num(f('location_accuracy')),
    photo_path: photo.path,
    revisit_date,
  });
  if (error) {
    await removePhotos([photo.path]); // don't leave an orphan photo behind
    throw error;
  }

  const remark = clean(f('remark'));
  if (remark) {
    await db().from('lead_remarks').insert({ lead_id: id, user_id: user.id, body: remark, kind: 'note' });
  }
  return ok({ id }, 201);
});
