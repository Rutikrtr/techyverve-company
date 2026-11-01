import { db } from '@/lib/supabase';
import { ok, bad, withAuth, areaIdsFor } from '@/lib/api';
import { removePhotos, uploadPhoto } from '@/lib/storage';

// Replace (retake) the hotel photo.
export const POST = withAuth(async (req, { user, params }) => {
  const { data: lead } = await db()
    .from('leads')
    .select('id, area_id, photo_path')
    .eq('id', params.id)
    .eq('company_id', user.companyId)
    .maybeSingle();
  if (!lead) return bad('Lead not found', 404);
  const ids = await areaIdsFor(user);
  if (ids && !ids.includes(lead.area_id)) return bad('Lead not found', 404);

  let form;
  try {
    form = await req.formData();
  } catch {
    return bad('Could not read the photo. Please try again.');
  }
  const photo = await uploadPhoto(user.companyId, lead.id, form.get('photo'));
  if (photo.error) return bad(photo.error);

  const { error } = await db().from('leads').update({ photo_path: photo.path, updated_at: new Date().toISOString() }).eq('id', lead.id);
  if (error) {
    await removePhotos([photo.path]);
    throw error;
  }
  await removePhotos([lead.photo_path]);
  await db().from('lead_remarks').insert({ lead_id: lead.id, user_id: user.id, kind: 'system', body: 'Hotel photo updated' });
  return ok({ ok: true });
});
