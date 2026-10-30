import bcrypt from 'bcryptjs';
import { db } from '@/lib/supabase';
import { ok, bad, withAuth, clean } from '@/lib/api';

export const GET = withAuth(
  async (req, { user }) => {
    const { data: members, error } = await db()
      .from('app_users')
      .select('id, name, username, phone, role, active, created_at, area_members(area_id, areas(id, name))')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const { data: leads } = await db().from('leads').select('created_by').eq('company_id', user.companyId);
    const counts = {};
    (leads || []).forEach((l) => {
      if (l.created_by) counts[l.created_by] = (counts[l.created_by] || 0) + 1;
    });

    return ok({
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        username: m.username,
        phone: m.phone,
        role: m.role,
        active: m.active,
        created_at: m.created_at,
        lead_count: counts[m.id] || 0,
        areas: (m.area_members || []).map((a) => a.areas).filter(Boolean),
      })),
    });
  },
  { admin: true }
);

export const POST = withAuth(
  async (req, { user }) => {
    const b = await req.json().catch(() => ({}));
    const name = clean(b.name);
    const username = clean(b.username)?.toLowerCase();
    const password = String(b.password || '');
    if (!name) return bad('Name is required');
    if (!username) return bad('Username is required');
    if (!/^[a-z0-9._@-]{3,40}$/.test(username)) return bad('Username: 3-40 letters, numbers or . _ @ -');
    if (password.length < 6) return bad('Password must be at least 6 characters');

    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await db()
      .from('app_users')
      .insert({ company_id: user.companyId, name, username, password_hash, phone: clean(b.phone), role: 'member' })
      .select('id, name, username')
      .single();
    if (error) {
      if (error.code === '23505') return bad('That username is already taken');
      throw error;
    }
    return ok({ member: data }, 201);
  },
  { admin: true }
);
