import bcrypt from 'bcryptjs';
import { db } from '@/lib/supabase';
import { ok, bad, withAuth, clean } from '@/lib/api';

async function loadMember(user, id) {
  const { data } = await db()
    .from('app_users')
    .select('id, role')
    .eq('id', id)
    .eq('company_id', user.companyId)
    .maybeSingle();
  return data;
}

export const PATCH = withAuth(
  async (req, { user, params }) => {
    const target = await loadMember(user, params.id);
    if (!target) return bad('Member not found', 404);
    if (target.role === 'superadmin' && target.id !== user.id) return bad('Cannot edit another superadmin', 403);

    const b = await req.json().catch(() => ({}));
    const patch = {};
    if (b.name !== undefined) {
      const name = clean(b.name);
      if (!name) return bad('Name is required');
      patch.name = name;
    }
    if (b.phone !== undefined) patch.phone = clean(b.phone);
    if (b.active !== undefined) {
      if (target.id === user.id) return bad('You cannot disable your own account');
      patch.active = Boolean(b.active);
    }
    if (b.password) {
      if (String(b.password).length < 6) return bad('Password must be at least 6 characters');
      patch.password_hash = await bcrypt.hash(String(b.password), 10);
    }
    if (!Object.keys(patch).length) return bad('Nothing to update');

    const { error } = await db().from('app_users').update(patch).eq('id', target.id);
    if (error) throw error;
    return ok({ ok: true });
  },
  { admin: true }
);

export const DELETE = withAuth(
  async (req, { user, params }) => {
    const target = await loadMember(user, params.id);
    if (!target) return bad('Member not found', 404);
    if (target.role === 'superadmin') return bad('The superadmin cannot be deleted', 403);
    const { error } = await db().from('app_users').delete().eq('id', target.id);
    if (error) throw error;
    return ok({ ok: true });
  },
  { admin: true }
);
