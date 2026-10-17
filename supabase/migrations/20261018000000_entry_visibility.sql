-- =========================================
-- VISIBILIDAD DE LAS ENTRADAS
-- draft                  → solo superadmin
-- published + private    → usuarios autenticados
-- published + public     → cualquiera, también sin sesión (rol anon)
-- =========================================
create type entry_visibility as enum ('public', 'private');

-- Por defecto privada: publicar algo en abierto tiene que ser una decisión explícita
alter table entries add column visibility entry_visibility not null default 'private';

create policy "cualquiera lee entradas públicas"
on entries for select
to anon, authenticated
using (status = 'published' and visibility = 'public');

-- "autenticados leen entradas publicadas" (status = 'published' or es_admin()) se mantiene:
-- las políticas se suman, así que un usuario autenticado ve las públicas y las privadas.

-- =========================================
-- DETALLES
-- La subconsulta sobre entries también pasa por su RLS, así que cada detalle es visible
-- exactamente cuando lo es su entrada, para anon y para authenticated.
-- =========================================
drop policy "lectura según entrada padre" on fly_tyings;
create policy "lectura según entrada padre" on fly_tyings for select
to anon, authenticated
using (exists (select 1 from entries e where e.id = entry_id));

drop policy "lectura según entrada padre" on training_sessions;
create policy "lectura según entrada padre" on training_sessions for select
to anon, authenticated
using (exists (select 1 from entries e where e.id = entry_id));

drop policy "lectura según entrada padre" on championships;
create policy "lectura según entrada padre" on championships for select
to anon, authenticated
using (exists (select 1 from entries e where e.id = entry_id));

drop policy "lectura según entrada padre" on free_fishing_days;
create policy "lectura según entrada padre" on free_fishing_days for select
to anon, authenticated
using (exists (select 1 from entries e where e.id = entry_id));
