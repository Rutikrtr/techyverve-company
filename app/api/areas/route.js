import { db } from '@/lib/supabase';
import { ok, bad, withAuth, areaIdsFor, clean } from '@/lib/api';

export const GET = withAuth(async (req, { user }) => {
  const ids = await areaIdsFor(user);
  if (ids && ids.length === 0) return ok({ areas: [] });

  let q = db()
    .from('areas')
    .select('id, name, city, notes, created_at, area_members(user_id, app_users(id, name))')
    .eq('company_id', user.companyId)
    .order('created_at', { ascending: false });
  if (ids) q = q.in('id', ids);
  const { data: areas, error } = await q;
  if (error) throw error;

  let lq = db().from('leads').select('area_id, confirmation').eq('company_id', user.companyId);
  if (ids) lq = lq.in('area_id', ids);
  const { data: leads } = await lq;

  const stats = {};
  (leads || []).forEach((l) => {
    const s = (stats[l.area_id] ||= { total: 0, confirmed: 0, hot: 0 });
    s.total += 1;
    if (l.confirmation === 100) s.confirmed += 1;
    if (l.confirmation >= 70) s.hot += 1;
  });

  return ok({
    areas: areas.map((a) => ({
      id: a.id,
      name: a.name,
      city: a.city,
      notes: a.notes,
      created_at: a.created_at,
      members: (a.area_members || []).map((m) => m.app_users).filter(Boolean),
      stats: stats[a.id] || { total: 0, confirmed: 0, hot: 0 },
    })),
  });
});

export const POST = withAuth(
  async (req, { user }) => {
    const b = await req.json().catch(() => ({}));
    const name = clean(b.name);
    if (!name) return bad('Camp name is required');

    const { data: area, error } = await db()
      .from('areas')
      .insert({ company_id: user.companyId, name, city: clean(b.city), notes: clean(b.notes) })
      .select('id')
      .single();
    if (error) {
      if (error.code === '23505') return bad('A camp with this name already exists');
      throw error;
    }

    const userIds = Array.isArray(b.user_ids) ? b.user_ids : [];
    if (userIds.length) {
      const { error: e2 } = await db()
        .from('area_members')
        .insert(userIds.map((user_id) => ({ area_id: area.id, user_id })));
      if (e2) throw e2;
    }
    return ok({ id: area.id }, 201);
  },
  { admin: true }
);
