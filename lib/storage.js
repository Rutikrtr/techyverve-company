import { db } from './supabase';

export const BUCKET = 'hotel-photos';
export const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024; // the phone sends ~150 KB; this is only a safety limit
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Validates and uploads a photo. Returns { path } or { error }. */
export async function uploadPhoto(companyId, leadId, file) {
  if (!file || typeof file === 'string' || !file.size) return { error: 'Hotel photo is required. Take a photo of the hotel.' };
  if (!EXT[file.type]) return { error: 'Photo must be a JPG, PNG or WebP image' };
  if (file.size > MAX_PHOTO_BYTES) return { error: 'Photo is too large. Please retake it.' };

  const path = `${companyId}/${leadId}-${Date.now()}.${EXT[file.type]}`;
  const body = Buffer.from(await file.arrayBuffer());
  const { error } = await db().storage.from(BUCKET).upload(path, body, { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (error) {
    const hint = /bucket/i.test(error.message) ? ' (run migration_002_photos_revisit.sql in Supabase to create the photo bucket)' : '';
    return { error: 'Could not save the photo: ' + error.message + hint };
  }
  return { path };
}

export async function removePhotos(paths) {
  const list = (paths || []).filter(Boolean);
  if (!list.length) return;
  try {
    await db().storage.from(BUCKET).remove(list);
  } catch (e) {
    console.error('photo cleanup failed', e);
  }
}

/** Adds a temporary (1 hour) photo_url to each lead that has a photo. One storage call for the whole list. */
export async function withPhotoUrls(leads) {
  const paths = [...new Set(leads.map((l) => l.photo_path).filter(Boolean))];
  const urls = {};
  if (paths.length) {
    const { data } = await db().storage.from(BUCKET).createSignedUrls(paths, 3600);
    (data || []).forEach((d) => {
      if (d.signedUrl) urls[d.path] = d.signedUrl;
    });
  }
  return leads.map((l) => ({ ...l, photo_url: l.photo_path ? urls[l.photo_path] || null : null }));
}
