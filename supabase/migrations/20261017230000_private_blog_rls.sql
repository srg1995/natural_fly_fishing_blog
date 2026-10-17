-- =========================================
-- BLOG PRIVADO
-- Las políticas de lectura pasan de "cualquiera" a solo usuarios autenticados.
-- Sin sesión (rol anon) no se puede leer nada aunque se tenga la publishable key.
-- =========================================

drop policy "público lee entradas publicadas" on entries;
create policy "autenticados leen entradas publicadas"
on entries for select
to authenticated
using (status = 'published' or es_admin());

drop policy "lectura según entrada padre" on fly_tyings;
create policy "lectura según entrada padre" on fly_tyings for select
to authenticated
using (exists (select 1 from entries e where e.id = entry_id and (e.status = 'published' or es_admin())));

drop policy "lectura según entrada padre" on training_sessions;
create policy "lectura según entrada padre" on training_sessions for select
to authenticated
using (exists (select 1 from entries e where e.id = entry_id and (e.status = 'published' or es_admin())));

drop policy "lectura según entrada padre" on championships;
create policy "lectura según entrada padre" on championships for select
to authenticated
using (exists (select 1 from entries e where e.id = entry_id and (e.status = 'published' or es_admin())));

drop policy "lectura según entrada padre" on free_fishing_days;
create policy "lectura según entrada padre" on free_fishing_days for select
to authenticated
using (exists (select 1 from entries e where e.id = entry_id and (e.status = 'published' or es_admin())));

drop policy "usuarios leen su perfil" on profiles;
create policy "usuarios leen su perfil"
on profiles for select
to authenticated
using (id = auth.uid());
