import { db } from '@/lib/supabase';
import { ok, bad, withAuth, areaIdsFor, clean } from '@/lib/api';

async function canSee(user, leadId) {
  const { data } = await db().from('leads').select('id, area_id').eq('id', leadId).eq('company_id', user.companyId).maybeSingle();
  if (!data) return false;
  const ids = await areaIdsFor(user);
  return !ids || ids.includes(data.area_id);
}

export const GET = withAuth(async (req, { user, params }) => {
  if (!(await canSee(user, params.id))) return bad('Lead not found', 404);
  const { data, error } = await db()
    .from('lead_remarks')
    .select('id, body, kind, created_at, author:app_users!user_id(name)')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ok({ remarks: data });
});

export const POST = withAuth(async (req, { user, params }) => {
  if (!(await canSee(user, params.id))) return bad('Lead not found', 404);
  const b = await req.json().catch(() => ({}));
  const body = clean(b.body);
  if (!body) return bad('Write a remark first');
  if (body.length > 2000) return bad('Remark is too long (max 2000 characters)');

  const { error } = await db().from('lead_remarks').insert({ lead_id: params.id, user_id: user.id, body, kind: 'note' });
  if (error) throw error;
  return ok({ ok: true }, 201);
});
