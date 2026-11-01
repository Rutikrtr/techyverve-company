-- ============================================================
--  Techyverve CRM  -  database schema (Supabase / PostgreSQL)
--  Run this whole file once in:  Supabase -> SQL Editor -> New query
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Company ----------
create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

insert into companies (name) values ('Techyverve') on conflict (name) do nothing;

-- ---------- Users (superadmin + team members) ----------
create table if not exists app_users (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id) on delete cascade,
  name           text not null,
  username       text not null unique,          -- always stored lowercase
  password_hash  text not null,                 -- bcrypt
  role           text not null default 'member' check (role in ('superadmin','member')),
  phone          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------- Camps (areas) ----------
create table if not exists areas (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  city        text,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);

-- which member works in which camp
create table if not exists area_members (
  area_id  uuid not null references areas(id) on delete cascade,
  user_id  uuid not null references app_users(id) on delete cascade,
  primary key (area_id, user_id)
);

-- ---------- Leads (hotels) ----------
create table if not exists leads (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references companies(id) on delete cascade,
  area_id            uuid not null references areas(id) on delete cascade,
  created_by         uuid references app_users(id) on delete set null,
  hotel_name         text not null,
  confirmation       int  not null default 10 check (confirmation in (10,30,50,70,90,100)),
  contact            text,
  owner_name         text,                       -- optional
  price              numeric(12,2),              -- optional
  latitude           double precision not null,  -- captured from the phone automatically
  longitude          double precision not null,
  location_accuracy  real,                       -- metres
  photo_path         text,                       -- file in storage bucket 'hotel-photos' (required by the app)
  revisit_date       date,                       -- when to visit again (required by the app)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists leads_area_idx    on leads (area_id);
create index if not exists leads_creator_idx on leads (created_by);
create index if not exists leads_conf_idx    on leads (confirmation);
create index if not exists leads_revisit_idx on leads (revisit_date);

-- ---------- Remarks (team notes on a lead) ----------
create table if not exists lead_remarks (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  user_id     uuid references app_users(id) on delete set null,
  body        text not null,
  kind        text not null default 'note' check (kind in ('note','system')),
  created_at  timestamptz not null default now()
);
create index if not exists remarks_lead_idx on lead_remarks (lead_id, created_at desc);

-- ---------- Hishob: confirmed clients ----------
create table if not exists clients (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  lead_id      uuid references leads(id) on delete set null,
  hotel_name   text not null,
  owner_name   text,
  contact      text,
  given_price  numeric(12,2) not null,           -- deal value
  received     numeric(12,2) not null default 0, -- amount received so far
  confirmed_on date not null default current_date,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ---------- Hishob: company / project expenses ----------
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  category    text not null default 'Other',
  title       text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  spent_on    date not null default current_date,
  notes       text,
  created_by  uuid references app_users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists expenses_date_idx on expenses (spent_on desc);

-- ---------- Photo storage ----------
-- Private bucket for hotel photos (max 2 MB each, images only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hotel-photos', 'hotel-photos', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- ---------- Security ----------
-- The app talks to the database ONLY from the server using the service-role key.
-- RLS is enabled with no policies, so the public/anon key can read and write nothing.
alter table companies    enable row level security;
alter table app_users    enable row level security;
alter table areas        enable row level security;
alter table area_members enable row level security;
alter table leads        enable row level security;
alter table lead_remarks enable row level security;
alter table clients      enable row level security;
alter table expenses     enable row level security;
