-- =========================================
-- FIX: entradas privadas visibles sin sesión
-- En producción el rol anon leía entradas published + private. Alguna política de lectura
-- sobre entries lo permitía: la original "público lee entradas publicadas" (sin rol, así que
-- incluía anon) si no se aplicó 20261017230000, o una creada desde el panel.
-- Se borran TODAS las políticas de SELECT de entries, tengan el nombre que tengan, y se
-- recrean solo las correctas. La de escritura del admin (for all) no se toca.
-- =========================================
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'entries' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.entries', p.policyname);
  end loop;
end $$;

-- Sin sesión: solo publicadas y públicas
create policy "cualquiera lee entradas públicas"
on entries for select
to anon, authenticated
using (status = 'published' and visibility = 'public');

-- Con sesión: todas las publicadas; el superadmin, también los borradores
create policy "autenticados leen entradas publicadas"
on entries for select
to authenticated
using (status = 'published' or es_admin());

-- Las políticas de lectura de las tablas de detalle, entry_images y storage dependen de
-- "exists (select 1 from entries ...)", que pasa por la RLS de entries: quedan corregidas con esto.

-- =========================================
-- COMPROBACIÓN: debe fallar si anon sigue viendo alguna entrada que no sea pública
-- =========================================
do $$
declare
  leaked int;
begin
  set local role anon;
  select count(*) into leaked from public.entries where not (status = 'published' and visibility = 'public');
  reset role;
  if leaked > 0 then
    raise exception 'anon todavía ve % entradas no públicas: revisa pg_policies de entries', leaked;
  end if;
end $$;
