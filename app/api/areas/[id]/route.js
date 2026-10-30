import { db } from '@/lib/supabase';
import { ok, bad, withAuth, areaIdsFor, clean } from '@/lib/api';

export const GET = withAuth(async (req, { user, params }) => {
  const ids = await areaIdsFor(user);
  if (ids && !ids.includes(params.id)) return bad('Camp not found', 404);

  const { data: a, error } = await db()
    .from('areas')
    .select('id, name, city, notes, created_at, area_members(user_id, app_users(id, name))')
    .eq('id', params.id)
    .eq('company_id', user.companyId)
    .maybeSingle();
  if (error) throw error;
  if (!a) return bad('Camp not found', 404);

  const { data: leads } = await db().from('leads').select('confirmation').eq('area_id', a.id);
  const stats = { total: 0, confirmed: 0, hot: 0 };
  (leads || []).forEach((l) => {
    stats.total += 1;
    if (l.confirmation === 100) stats.confirmed += 1;
    if (l.confirmation >= 70) stats.hot += 1;
  });

  return ok({
    area: {
      id: a.id,
      name: a.name,
      city: a.city,
      notes: a.notes,
      members: (a.area_members || []).map((m) => m.app_users).filter(Boolean),
      stats,
    },
  });
});

export const PATCH = withAuth(
  async (req, { user, params }) => {
    const b = await req.json().catch(() => ({}));
    const patch = {};
    if (b.name !== undefined) {
      const name = clean(b.name);
      if (!name) return bad('Camp name is required');
      patch.name = name;
    }
    if (b.city !== undefined) patch.city = clean(b.city);
    if (b.notes !== undefined) patch.notes = clean(b.notes);

    if (Object.keys(patch).length) {
      const { error } = await db().from('areas').update(patch).eq('id', params.id).eq('company_id', user.companyId);
      if (error) {
        if (error.code === '23505') return bad('A camp with this name already exists');
        throw error;
      }
    }

    if (Array.isArray(b.user_ids)) {
      const { error: e1 } = await db().from('area_members').delete().eq('area_id', params.id);
      if (e1) throw e1;
      if (b.user_ids.length) {
        const { error: e2 } = await db()
          .from('area_members')
          .insert(b.user_ids.map((user_id) => ({ area_id: params.id, user_id })));
        if (e2) throw e2;
      }
    }
    return ok({ ok: true });
  },
  { admin: true }
);

export const DELETE = withAuth(
  async (req, { user, params }) => {
    const { error } = await db().from('areas').delete().eq('id', params.id).eq('company_id', user.companyId);
    if (error) throw error;
    return ok({ ok: true });
  },
  { admin: true }
);
