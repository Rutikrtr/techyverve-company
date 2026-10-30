import { NextResponse } from 'next/server';
import { getSession } from './auth';
import { db } from './supabase';

export const ok = (data, status = 200) => NextResponse.json(data, { status });
export const bad = (message, status = 400) => NextResponse.json({ error: message }, { status });

/**
 * Wraps a route handler: checks the login cookie, reloads the user from the DB
 * (so disabled accounts lose access immediately) and optionally requires superadmin.
 */
export function withAuth(handler, { admin = false } = {}) {
  return async (req, ctx = {}) => {
    try {
      const session = await getSession();
      if (!session) return bad('Please sign in', 401);

      const { data: u } = await db()
        .from('app_users')
        .select('id, company_id, name, username, phone, role, active')
        .eq('id', session.id)
        .maybeSingle();

      if (!u || !u.active) return bad('Account disabled or removed', 401);

      const user = {
        id: u.id,
        companyId: u.company_id,
        name: u.name,
        username: u.username,
        phone: u.phone,
        role: u.role,
        isAdmin: u.role === 'superadmin',
      };
      if (admin && !user.isAdmin) return bad('Only the superadmin can do this', 403);

      const params = ctx.params ? await ctx.params : {};
      return await handler(req, { user, params });
    } catch (e) {
      console.error(e);
      return bad(e.message || 'Server error', 500);
    }
  };
}

/** Camps (areas) a user may see. null = all (superadmin). */
export async function areaIdsFor(user) {
  if (user.isAdmin) return null;
  const { data } = await db().from('area_members').select('area_id').eq('user_id', user.id);
  return (data || []).map((r) => r.area_id);
}

export const clean = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

export const num = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
