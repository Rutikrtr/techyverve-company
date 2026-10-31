-- ============================================================
--  Creates (or resets) the Techyverve superadmin login.
--  Run AFTER schema.sql, in Supabase -> SQL Editor.
--  Change the two values below if you want a different login.
--  Copy this file, put your own username and password below, then run it. Never commit the real password.
-- ============================================================
do $$
declare
  v_username text := lower('rutik@rtr');
  v_password text := 'rutik@rtr';
  v_company  uuid;
begin
  select id into v_company from companies where name = 'Techyverve';

  insert into app_users (company_id, name, username, password_hash, role)
  values (v_company, 'Rutik', v_username, crypt(v_password, gen_salt('bf', 10)), 'superadmin')
  on conflict (username) do update
    set password_hash = excluded.password_hash,
        role = 'superadmin',
        active = true;
end $$;
