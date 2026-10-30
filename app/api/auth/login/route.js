import bcrypt from 'bcryptjs';
import { db } from '@/lib/supabase';
import { createSession } from '@/lib/auth';
import { ok, bad } from '@/lib/api';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!username || !password) return bad('Enter your username and password');

    const { data: u, error } = await db()
      .from('app_users')
      .select('id, name, username, role, active, password_hash')
      .eq('username', username)
      .maybeSingle();
    if (error) throw error;

    const valid = u ? await bcrypt.compare(password, u.password_hash) : false;
    if (!valid) return bad('Wrong username or password', 401);
    if (!u.active) return bad('This account is disabled. Ask your superadmin.', 403);

    await createSession(u);
    return ok({ user: { id: u.id, name: u.name, role: u.role } });
  } catch (e) {
    console.error(e);
    return bad(e.message || 'Server error', 500);
  }
}
