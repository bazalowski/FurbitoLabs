-- ════════════════════════════════════════════════════
--  010 · RLS fina para storage.objects (bucket 'avatars')
--
--  Estado actual: 4 policies `avatars_public_*` que solo filtran por
--  bucket_id. Cualquier anon puede subir/borrar/sobrescribir avatars
--  ajenos → vector de trolling.
--
--  Nueva regla: el path es `{community_id}/{player_id}.{ext}` (ver
--  src/lib/supabase/avatars.ts). Un usuario solo puede escribir/borrar
--  avatars cuyo path coincida con SU community_id y SU player_id.
--  Los admins de la comunidad pueden tocar cualquier avatar de su comu.
--
--  SELECT sigue siendo público — el bucket es public=TRUE por diseño
--  y las URLs aparecen en players.avatar sin auth.
--
--  Helpers usados:
--    · storage.foldername(name) → array de carpetas del path
--      Para path 'abc/xyz.jpg' devuelve ARRAY['abc']
--    · public.get_user_community_id() / get_user_role() (mig 002)
-- ════════════════════════════════════════════════════

-- Idempotencia
DROP POLICY IF EXISTS "avatars_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_update"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete"        ON storage.objects;

-- ── SELECT: público (el bucket es público y las URLs van sin auth) ──
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- ── INSERT: el path tiene que empezar por tu community_id y el
-- archivo tiene que llamarse como tu player_id. Admin puede subir
-- en nombre de cualquier jugador de su comunidad. ──
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_user_community_id()
    AND (
      -- El filename (sin extensión) es tu propio player_id
      split_part(
        regexp_replace(name, '^.*/', ''),
        '.',
        1
      ) = (SELECT player_id FROM public.users WHERE id = auth.uid())
      OR public.get_user_role() = 'admin'
    )
  );

-- ── UPDATE: mismo criterio (upsert reemplaza imagen existente) ──
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_user_community_id()
    AND (
      split_part(regexp_replace(name, '^.*/', ''), '.', 1)
        = (SELECT player_id FROM public.users WHERE id = auth.uid())
      OR public.get_user_role() = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = public.get_user_community_id()
  );

-- ── DELETE: solo el dueño del avatar o admin de la comunidad ──
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_user_community_id()
    AND (
      split_part(regexp_replace(name, '^.*/', ''), '.', 1)
        = (SELECT player_id FROM public.users WHERE id = auth.uid())
      OR public.get_user_role() = 'admin'
    )
  );
