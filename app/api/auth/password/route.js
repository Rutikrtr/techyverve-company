import bcrypt from 'bcryptjs';
import { db } from '@/lib/supabase';
import { ok, bad, withAuth } from '@/lib/api';

export const POST = withAuth(async (req, { user }) => {
  const b = await req.json().catch(() => ({}));
  const current = String(b.current || '');
  const next = String(b.next || '');
  if (!current) return bad('Enter your current password');
  if (next.length < 6) return bad('New password must be at least 6 characters');
  if (next === current) return bad('New password must be different');

  const { data: u } = await db().from('app_users').select('password_hash').eq('id', user.id).maybeSingle();
  if (!u || !(await bcrypt.compare(current, u.password_hash))) return bad('Current password is wrong', 400);

  const password_hash = await bcrypt.hash(next, 10);
  const { error } = await db().from('app_users').update({ password_hash }).eq('id', user.id);
  if (error) throw error;
  return ok({ ok: true });
});
