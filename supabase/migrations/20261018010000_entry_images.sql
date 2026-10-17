-- =========================================
-- FOTOS DE LAS ENTRADAS
-- Los archivos van al bucket privado 'entry-images' con la ruta '<entry_id>/<archivo>'.
-- entry_images guarda el orden; la de menor position es la portada.
-- La visibilidad de cada foto es la de su entrada (borrador / privada / pública).
-- =========================================
create table entry_images (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  path text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index entry_images_entry_idx on entry_images (entry_id, position);

alter table entry_images enable row level security;

-- La subconsulta sobre entries pasa por su RLS: se ve la foto si se ve la entrada
create policy "lectura según entrada padre" on entry_images for select
to anon, authenticated
using (exists (select 1 from entries e where e.id = entry_id));

create policy "admin gestiona fotos" on entry_images for all
using (es_admin()) with check (es_admin());

-- =========================================
-- STORAGE
-- Bucket privado: los archivos solo se sirven con URLs firmadas, y firmar exige poder leerlos.
-- =========================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('entry-images', 'entry-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "leer fotos de entradas visibles" on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'entry-images'
  and exists (select 1 from public.entries e where e.id::text = (storage.foldername(name))[1])
);

create policy "superadmin sube fotos" on storage.objects for insert
to authenticated
with check (bucket_id = 'entry-images' and public.es_admin());

create policy "superadmin borra fotos" on storage.objects for delete
to authenticated
using (bucket_id = 'entry-images' and public.es_admin());
