# Database tables (Supabase / PostgreSQL)

Created by `schema.sql`. 8 tables, all with Row Level Security on and no public policies (only the server key can access them).

| # | Table | What it stores | Key columns |
|---|---|---|---|
| 1 | `companies` | The company (Techyverve) | `id`, `name` |
| 2 | `app_users` | Superadmin + team logins | `name`, `username`, `password_hash`, `role` (`superadmin`/`member`), `phone`, `active` |
| 3 | `areas` | Camps | `name`, `city`, `notes`, `company_id` |
| 4 | `area_members` | Which member works in which camp | `area_id`, `user_id` |
| 5 | `leads` | Hotels | `hotel_name`, `confirmation` (10/30/50/70/90/100), `contact`, `owner_name`*, `price`*, `latitude`, `longitude`, `location_accuracy`, `area_id`, `created_by` |
| 6 | `lead_remarks` | Team remarks + confirmation-change history | `lead_id`, `user_id`, `body`, `kind` (`note`/`system`) |
| 7 | `clients` | Hishob: confirmed hotels | `hotel_name`, `owner_name`, `contact`, `given_price`, `received`, `confirmed_on`, `lead_id` |
| 8 | `expenses` | Hishob: company / project expenses | `category`, `title`, `amount`, `spent_on`, `notes`, `created_by` |

\* optional

## How they connect
```
companies ─┬─ app_users ──< area_members >── areas ──< leads ──< lead_remarks
           │                                              └──── clients (optional link)
           ├─ areas
           ├─ clients
           └─ expenses
```

## Setup order
1. `schema.sql`: creates the tables and the Techyverve company.
2. `seed_superadmin.example.sql`: copy it, set your own username and password inside, and run it to create the superadmin login.
