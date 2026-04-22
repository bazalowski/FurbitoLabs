-- ════════════════════════════════════════════════════
--  Avatars — Supabase Storage bucket + policies
--
--  Bucket público "avatars". Cada jugador sube su foto a
--  {community_id}/{player_id}.{ext}. El campo players.avatar
--  guarda la URL pública resultante (o un emoji — el campo es
--  TEXT libre desde el schema inicial).
--
--  Policies permisivas, alineadas con el régimen actual
--  (public_all) que usa la app hasta migrar a Auth real.
-- ════════════════════════════════════════════════════

-- Crear bucket público si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,  -- 2 MB (subimos redimensionado desde el cliente)
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública (ya debería estarlo por public=TRUE, pero policy explícita
-- evita sorpresas si alguien flipa el flag del bucket más adelante)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Escritura/actualización/borrado permisivo (coherente con public_all del resto
-- de tablas). Cuando migres a Auth real, restringir con owner = auth.uid().
DROP POLICY IF EXISTS "avatars_public_insert" ON storage.objects;
CREATE POLICY "avatars_public_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_public_update" ON storage.objects;
CREATE POLICY "avatars_public_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_public_delete" ON storage.objects;
CREATE POLICY "avatars_public_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');
