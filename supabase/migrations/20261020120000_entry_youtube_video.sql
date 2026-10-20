-- =========================================
-- VÍDEO DE YOUTUBE EN LAS ENTRADAS
-- Se guarda solo el identificador del vídeo (11 caracteres), no la URL: la app acepta
-- cualquier formato de enlace y monta ella misma la URL del reproductor.
-- Es una columna de entries, así que hereda su RLS (lectura y escritura).
-- =========================================
alter table entries
  add column youtube_id text
  check (youtube_id ~ '^[A-Za-z0-9_-]{11}$');
