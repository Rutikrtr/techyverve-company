import { db } from '@/lib/supabase';
import { ok, bad, withAuth, areaIdsFor, clean } from '@/lib/api';
import { isDateStr, shortDate } from '@/lib/dates';

// Change the revisit date of many selected hotels at once.
export const PATCH = withAuth(async (req, { user }) => {
  const b = await req.json().catch(() => ({}));
  const ids = Array.isArray(b.ids) ? [...new Set(b.ids.map(String))].slice(0, 500) : [];
  const date = clean(b.revisit_date);
  if (!ids.length) return bad('Select at least one hotel');
  if (!date || !isDateStr(date)) return bad('Pick a valid revisit date');

  const allowed = await areaIdsFor(user);
  if (allowed && allowed.length === 0) return bad('No hotels found', 404);

  let q = db().from('leads').select('id, revisit_date').in('id', ids).eq('company_id', user.companyId);
  if (allowed) q = q.in('area_id', allowed);
  const { data: found, error } = await q;
  if (error) throw error;
  if (!found?.length) return bad('No hotels found', 404);

  const { error: e2 } = await db()
    .from('leads')
    .update({ revisit_date: date, updated_at: new Date().toISOString() })
    .in('id', found.map((l) => l.id));
  if (e2) throw e2;

  const changed = found.filter((l) => l.revisit_date !== date);
  if (changed.length) {
    await db().from('lead_remarks').insert(
      changed.map((l) => ({
        lead_id: l.id,
        user_id: user.id,
        kind: 'system',
        body: `Revisit date ${l.revisit_date ? shortDate(l.revisit_date) : 'not set'} → ${shortDate(date)}`,
      }))
    );
  }
  return ok({ updated: found.length });
});
