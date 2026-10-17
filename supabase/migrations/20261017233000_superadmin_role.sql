-- =========================================
-- ROLES
-- Sustituye profiles.is_admin por un rol. Solo 'superadmin' puede gestionar entradas;
-- 'reader' solo lee las entradas publicadas.
-- =========================================
create type user_role as enum ('reader', 'superadmin');

alter table profiles add column role user_role not null default 'reader';
update profiles set role = 'superadmin' where is_admin;

-- Mantiene el nombre es_admin() para que las políticas existentes no cambien
create or replace function es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

alter table profiles drop column is_admin;

-- =========================================
-- PERFIL AUTOMÁTICO
-- Cada usuario nuevo de auth.users recibe un perfil con rol 'reader'.
-- No hay política de update en profiles: nadie puede cambiarse el rol desde la app.
-- =========================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- Perfiles para los usuarios que ya existían
insert into profiles (id)
select id from auth.users
on conflict (id) do nothing;
