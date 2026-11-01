# Techyverve CRM

Hotel lead tracking for the Techyverve team.

- **Superadmin** creates team members, creates **camps (areas)**, assigns members to camps, sees every lead, and manages the **Hishob** (confirmed clients + company expenses).
- **Team members** see only their assigned camps, add hotels with a confirmation %, and leave remarks.
- Every lead stores the phone's **live location** automatically (the form cannot be saved until location is captured).

**Stack:** Next.js 14 (frontend + API routes) on **Vercel** · PostgreSQL on **Supabase** · simple username/password login (bcrypt + signed cookie).

---

## What's inside

| Area | What it does |
|---|---|
| Login | Username + password. Superadmin is created from SQL (step 3). |
| Dashboard | Totals, pipeline by confirmation %, recent leads, team activity, hishob snapshot (admin). |
| Camps | Admin creates camps, assigns members. Members see only their camps. |
| Leads | Hotel name, **confirmation % (10 / 30 / 50 / 70 / 90 / 100)**, contact, owner (optional), price (optional), auto location, remarks timeline. |
| Team | Admin creates logins, resets passwords, enables/disables, deletes. |
| Hishob | **Summary**, **Confirmed clients** (price given, received, pending), **Expenses** (marketing, salary, travel, office, software, rent, project, other). A 100% lead can be moved to the hishob in one click. |

Required when adding a lead: camp, hotel name, **hotel photo**, confirmation %, hotel contact, **revisit date** and location. Optional: owner name, price, remark.

- **Photo:** taken with the phone camera and shrunk automatically to about 100-200 KB, then stored in the private Supabase Storage bucket `hotel-photos`. It is shown on the hotel page and as a thumbnail in lists. It can be retaken later.
- **Revisit date:** Today, Tomorrow or any date. The Hotels list puts **today's revisits at the top**, then groups the rest by date. Use the date bar to jump to a day, tick hotels (or **Select all**) to change their revisit date together, and **Export** to a CSV for selected hotels, the current list, one date, or everything. The CSV opens in Excel / Google Sheets.
- **Settings:** sign out, change password and a location test.

---

## Setup guide (do this once)

### 1. Create the Supabase project
1. Go to <https://supabase.com> and sign in with the account you want to use.
2. **New project** → give it a name (e.g. `techyverve-crm`), set a database password, pick the nearest region (Mumbai / `ap-south-1` for India) → **Create**.
3. Wait until the project finishes setting up.

### 2. Create the tables
1. In Supabase open **SQL Editor → New query**.
2. Paste the whole content of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   You should see "Success". It creates all tables and the company **Techyverve**.

> **Already set up an older version?** Run `supabase/migration_002_photos_revisit.sql` once in the SQL Editor. It adds the photo + revisit date columns and creates the private photo bucket `hotel-photos`. Safe to run twice.

### 3. Create the superadmin login
1. Open [`supabase/seed_superadmin.sql`](supabase/seed_superadmin.sql), change the username/password if you want, paste into a new SQL query and **Run**.
2. Default login: username `rutik@rtr`, password `rutik@rtr`.
   **Change this password after the first login** (see "Reset a password" below), because it was shared in plain text.

### 4. Get your Supabase keys
Supabase → **Project Settings → API**:
- **Project URL** → `SUPABASE_URL`
- **service_role** (secret) key → `SUPABASE_SERVICE_ROLE_KEY`

> The service_role key is used **only on the server**. Never put it in a `NEXT_PUBLIC_` variable, never commit it.

### 5. Run it locally (optional but recommended)
```bash
npm install
cp .env.example .env.local      # then fill in the 3 values
npm run dev                     # http://localhost:3000
```
Generate `AUTH_SECRET` with: `openssl rand -base64 32`

### 6. Put the code on GitHub
```bash
git init
git add .
git commit -m "Techyverve CRM"
git branch -M main
git remote add origin https://github.com/<your-username>/techyverve-crm.git
git push -u origin main
```
`.env.local` and `supabase/seed_superadmin.sql` are git-ignored, so your keys and password stay off GitHub.

### 7. Deploy the frontend on Vercel
1. <https://vercel.com> → **Add New → Project** → import the GitHub repo.
2. Framework is auto-detected as **Next.js**. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |
   | `AUTH_SECRET` | a long random string |

3. **Deploy**. Open the Vercel URL and sign in with the superadmin login.

> Because the API lives inside the same Next.js app, **Vercel hosts the frontend and the API routes; Supabase hosts the database.** There is no separate backend server to run.

---

## Using a different Supabase account

The app is not tied to any Supabase account. Moving it (or starting on a new one) only needs 3 values:

1. Sign in to the Supabase account you want → create a project (step 1).
2. Run `schema.sql`, then `seed_superadmin.sql` in **that** project's SQL Editor (steps 2-3).
3. Copy that project's **Project URL** and **service_role key** (step 4).
4. Replace the values:
   - **Local:** edit `.env.local`
   - **Vercel:** Project → **Settings → Environment Variables** → edit `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` → then **Deployments → ⋯ → Redeploy**.

Everyone is signed out automatically only if you also change `AUTH_SECRET`. Existing data does **not** move between accounts; to migrate it, use **Database → Backups** or `pg_dump` / `psql` from the old project to the new one.

---

## Install as a phone app

Open the Vercel link on the phone:
- **Android (Chrome):** tap **Install** on the banner, or ⋮ menu → **Install app**.
- **iPhone (Safari):** tap **Share** → **Add to Home Screen**.

It then opens full screen like a normal app, with no browser bar, and pinch-zoom is turned off. Location must be allowed for the site (or app) the first time you add a hotel.

> Vercel region is set to Mumbai (`bom1`) in `vercel.json`. If your Supabase project is in another region, change it to the nearest one (for example `dub1` for Ireland).

## Daily use

**Superadmin**
1. **Team → New member**: create a username + password for each person.
2. **Camps → New camp**: name the area and tick the members who work there (you can edit this any time).
3. Watch leads come in under **Camps**, **All leads** and the **Dashboard**.
4. When a hotel reaches 100%, open it and tap **Move to hishob**, or go to **Hishob → Confirmed clients → Add confirmed hotel**.
5. **Hishob → Expenses** to log marketing, salaries, travel and other costs. **Summary** shows deal value, received, pending, expenses and net.

**Team member (on the phone)**
1. Sign in → **My camps** → open a camp → **Add hotel**.
2. Allow location when the browser asks and keep GPS on. The green "Location captured" bar must appear before **Save lead** works.
3. Pick the confirmation % (10-100), enter hotel name + contact (owner, price, remark optional).
4. Open a lead any time to change the %, add remarks, or open it in Google Maps.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Wrong username or password" | Re-run `seed_superadmin.sql` (it resets the password). Username is case-insensitive. |
| "Missing SUPABASE_URL…" / 500 errors | Env vars are not set (locally in `.env.local`, on Vercel in Settings → Environment Variables). Redeploy after changing them. |
| "AUTH_SECRET is missing or too short" | Set `AUTH_SECRET` to a random string of 16+ characters. |
| Location stays blocked | Browser address bar → lock icon → **Location → Allow**, turn on phone GPS, tap **Retry**. Location only works on **https** (Vercel is https) or `localhost`. |
| A member sees no camps | Superadmin: Camps → edit camp → tick the member. |
| Relationship / column errors | `schema.sql` was not run fully. Run it again (it is safe to re-run). |

### Reset a password (SQL)
```sql
update app_users
set password_hash = crypt('NEW-PASSWORD', gen_salt('bf', 10))
where username = 'rutik@rtr';
```
(Members' passwords can also be reset from **Team → Edit**.)

---

## Security notes
- All database access goes through the server with the service-role key. Row-level security is on with **no public policies**, so the public/anon key cannot read or write anything.
- Passwords are bcrypt-hashed. Sessions are an `httpOnly` signed cookie (7 days). Disabling a member blocks them immediately.
- Members can only read and write leads in their own camps; the hishob, team and delete actions are superadmin-only and enforced in the API, not just hidden in the UI.

## Project structure
```
app/                 pages + API routes (Next.js App Router)
  (app)/             signed-in pages: dashboard, camps, leads, team, hishob
  api/               REST endpoints
components/          UI pieces (modals, lead form with location, tables)
lib/                 supabase client, auth, helpers
supabase/schema.sql  database tables (see supabase/TABLES.md for the list)
supabase/seed_superadmin.sql
```
