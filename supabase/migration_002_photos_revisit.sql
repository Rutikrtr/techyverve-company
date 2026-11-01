-- ============================================================
--  Migration 002: hotel photos + revisit date
--  Run ONCE in Supabase -> SQL Editor (safe to run again).
--  If you are installing fresh, schema.sql already contains this.
-- ============================================================

alter table leads add column if not exists photo_path   text;   -- file path inside the 'hotel-photos' bucket
alter table leads add column if not exists revisit_date date;   -- when the team will visit the hotel again

create index if not exists leads_revisit_idx on leads (revisit_date);

-- Private storage bucket for hotel photos (max 2 MB each, images only).
-- Only the server (service-role key) can read/write it; the app hands out short-lived links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hotel-photos', 'hotel-photos', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = false;
