import { db } from '@/lib/supabase';
import { ok, bad, withAuth, areaIdsFor, clean, num } from '@/lib/api';
import { PCTS } from '@/lib/constants';
import { isDateStr, shortDate } from '@/lib/dates';
import { removePhotos, withPhotoUrls } from '@/lib/storage';

const SELECT = '*, areas(name), creator:app_users!created_by(name)';

async function loadLead(user, id) {
  const { data } = await db().from('leads').select(SELECT).eq('id', id).eq('company_id', user.companyId).maybeSingle();
  if (!data) return { error: bad('Lead not found', 404) };
  const ids = await areaIdsFor(user);
  if (ids && !ids.includes(data.area_id)) return { error: bad('Lead not found', 404) };
  return { lead: data };
}

export const GET = withAuth(async (req, { user, params }) => {
  const { lead, error } = await loadLead(user, params.id);
  if (error) return error;

  let in_hishob = false;
  if (user.isAdmin) {
    const { data } = await db().from('clients').select('id').eq('lead_id', lead.id).limit(1);
    in_hishob = Boolean(data?.length);
  }
  const [withUrl] = await withPhotoUrls([lead]);
  return ok({ lead: { ...withUrl, in_hishob } });
});

export const PATCH = withAuth(async (req, { user, params }) => {
  const { lead, error } = await loadLead(user, params.id);
  if (error) return error;

  const b = await req.json().catch(() => ({}));
  const patch = {};

  if (b.hotel_name !== undefined) {
    const v = clean(b.hotel_name);
    if (!v) return bad('Hotel name is required');
    patch.hotel_name = v;
  }
  if (b.contact !== undefined) {
    const v = clean(b.contact);
    if (!v) return bad('Contact number is required');
    patch.contact = v;
  }
  if (b.owner_name !== undefined) patch.owner_name = clean(b.owner_name);
  if (b.price !== undefined) {
    const p = num(b.price);
    if (Number.isNaN(p) || (p !== null && p < 0)) return bad('Price must be a positive number');
    patch.price = p;
  }
  if (b.confirmation !== undefined) {
    const c = Number(b.confirmation);
    if (!PCTS.includes(c)) return bad('Invalid confirmation percentage');
    patch.confirmation = c;
  }
  if (b.revisit_date !== undefined) {
    const d = clean(b.revisit_date);
    if (!d || !isDateStr(d)) return bad('Pick a valid revisit date');
    patch.revisit_date = d;
  }
  if (b.area_id !== undefined && user.isAdmin) patch.area_id = b.area_id;

  if (!Object.keys(patch).length) return bad('Nothing to update');
  patch.updated_at = new Date().toISOString();

  const { error: e } = await db().from('leads').update(patch).eq('id', lead.id);
  if (e) throw e;

  const notes = [];
  if (patch.confirmation !== undefined && patch.confirmation !== lead.confirmation) {
    notes.push(`Confirmation changed ${lead.confirmation}% → ${patch.confirmation}%`);
  }
  if (patch.revisit_date !== undefined && patch.revisit_date !== lead.revisit_date) {
    notes.push(`Revisit date ${lead.revisit_date ? shortDate(lead.revisit_date) : 'not set'} → ${shortDate(patch.revisit_date)}`);
  }
  if (notes.length) {
    await db()
      .from('lead_remarks')
      .insert(notes.map((body) => ({ lead_id: lead.id, user_id: user.id, kind: 'system', body })));
  }
  return ok({ ok: true });
});

export const DELETE = withAuth(
  async (req, { user, params }) => {
    const { data } = await db().from('leads').select('photo_path').eq('id', params.id).eq('company_id', user.companyId).maybeSingle();
    const { error } = await db().from('leads').delete().eq('id', params.id).eq('company_id', user.companyId);
    if (error) throw error;
    await removePhotos([data?.photo_path]);
    return ok({ ok: true });
  },
  { admin: true }
);
