import { db } from '@/lib/supabase';
import { ok, withAuth } from '@/lib/api';

export const GET = withAuth(async (req, { user }) => {
  const { data: company } = await db().from('companies').select('name').eq('id', user.companyId).maybeSingle();
  return ok({ user: { ...user, company: company?.name || 'Techyverve' } });
});
