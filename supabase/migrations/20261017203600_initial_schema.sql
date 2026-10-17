-- =========================================
-- TIPOS
-- =========================================
create type entry_type as enum (
  'montaje_moscas',
  'entrenamiento',
  'campeonato',
  'pesca_libre'
);

create type entry_status as enum ('draft', 'published');

-- =========================================
-- PERFILES (administradores del blog)
-- =========================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Función auxiliar para las políticas RLS
create or replace function es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- =========================================
-- ENTRADAS (datos comunes)
-- =========================================
create table entries (
  id uuid primary key default gen_random_uuid(),
  type entry_type not null,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,                       -- contenido en Markdown
  status entry_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_type_idx on entries (type);
create index entries_status_published_idx on entries (status, published_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_set_updated_at
before update on entries
for each row execute function set_updated_at();

-- =========================================
-- DETALLE: MONTAJE DE MOSCAS
-- =========================================
create table fly_tyings (
  entry_id uuid primary key references entries(id) on delete cascade,
  fly_name text not null,
  fly_pattern text,                -- seca, ninfa, streamer, emergente...
  hook_size text,                  -- por ejemplo "14" o "12"
  target_species text,
  materials text[] not null default '{}'
);

-- =========================================
-- DETALLE: SESIONES DE ENTRENAMIENTO
-- =========================================
create table training_sessions (
  entry_id uuid primary key references entries(id) on delete cascade,
  session_date date not null,
  location text,
  duration_minutes int check (duration_minutes > 0),
  focus text                       -- lanzado, lectura de agua, nudos...
);

-- =========================================
-- DETALLE: CAMPEONATOS
-- =========================================
create table championships (
  entry_id uuid primary key references entries(id) on delete cascade,
  competition_name text not null,
  event_date date not null,
  location text,
  position int check (position > 0),
  participants int check (participants > 0),
  notes text
);

-- =========================================
-- DETALLE: DÍAS DE PESCA LIBRE
-- =========================================
create table free_fishing_days (
  entry_id uuid primary key references entries(id) on delete cascade,
  fishing_date date not null,
  location text,
  water_type text,                 -- río, embalse, lago...
  technique text,
  species text[] not null default '{}',
  fish_count int not null default 0 check (fish_count >= 0),
  weather text
);

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================
alter table profiles enable row level security;

create policy "usuarios leen su perfil"
on profiles for select
using (id = auth.uid());

alter table entries enable row level security;

create policy "público lee entradas publicadas"
on entries for select
using (status = 'published' or es_admin());

create policy "admin gestiona entradas"
on entries for all
using (es_admin())
with check (es_admin());

-- Cada tabla de detalle sigue la visibilidad de su entrada
alter table fly_tyings enable row level security;
create policy "lectura según entrada padre" on fly_tyings for select
using (exists (select 1 from entries e where e.id = entry_id and (e.status = 'published' or es_admin())));
create policy "admin gestiona montajes" on fly_tyings for all
using (es_admin()) with check (es_admin());

alter table training_sessions enable row level security;
create policy "lectura según entrada padre" on training_sessions for select
using (exists (select 1 from entries e where e.id = entry_id and (e.status = 'published' or es_admin())));
create policy "admin gestiona entrenamientos" on training_sessions for all
using (es_admin()) with check (es_admin());

alter table championships enable row level security;
create policy "lectura según entrada padre" on championships for select
using (exists (select 1 from entries e where e.id = entry_id and (e.status = 'published' or es_admin())));
create policy "admin gestiona campeonatos" on championships for all
using (es_admin()) with check (es_admin());

alter table free_fishing_days enable row level security;
create policy "lectura según entrada padre" on free_fishing_days for select
using (exists (select 1 from entries e where e.id = entry_id and (e.status = 'published' or es_admin())));
create policy "admin gestiona pesca libre" on free_fishing_days for all
using (es_admin()) with check (es_admin());