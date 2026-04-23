-- ════════════════════════════════════════════════════
--  013 · Super-admin global (UUID fijo en Supabase Auth)
--
--  Hasta ahora /admin usaba NEXT_PUBLIC_ADMIN_PIN (visible en el bundle).
--  Lo sustituimos por un usuario real de Supabase Auth con email/password.
--  Su UUID se fija aquí y se reconoce vía helper is_super_admin().
--
--  Security model:
--    · El UUID NO es secreto (aparece en migraciones). Lo que protege
--      es la password, que solo conoce el dueño y Supabase Auth
--      (bcrypt, rate-limit nativo, MFA opcional).
--    · Ningún cliente puede "hacerse super-admin" — tendría que
--      robar credenciales o el session JWT.
--
--  Lo que desbloquea este rol:
--    · Ver y gestionar TODAS las comunidades (panel /admin).
--    · Borrar cualquier comunidad (evento raro pero necesario para
--      limpieza de test data y gestión de abuso).
--    · SELECT completo en players/events/pistas para métricas globales.
-- ════════════════════════════════════════════════════

-- UUID del super-admin (fijo, emitido por Supabase Auth)
-- Email: bazalo1595@gmail.com
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() = '1a1c6670-552c-4114-abb2-98a1483fa7fa'::uuid;
$$;

-- ── Policies extra para super-admin ────────────────
-- No reemplazamos las finas existentes; añadimos una adicional
-- que permite al super-admin pasar. En Postgres las policies son OR,
-- así que con que una diga TRUE, la acción pasa.

-- communities: gestionar cualquier comunidad
DROP POLICY IF EXISTS "communities_super_admin_all" ON communities;
CREATE POLICY "communities_super_admin_all" ON communities
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- players: ver globalmente (útil para métricas en /admin)
DROP POLICY IF EXISTS "players_super_admin_select" ON players;
CREATE POLICY "players_super_admin_select" ON players
  FOR SELECT
  USING (public.is_super_admin());

-- events: ver globalmente
DROP POLICY IF EXISTS "events_super_admin_select" ON events;
CREATE POLICY "events_super_admin_select" ON events
  FOR SELECT
  USING (public.is_super_admin());

-- pistas: ver globalmente
DROP POLICY IF EXISTS "pistas_super_admin_select" ON pistas;
CREATE POLICY "pistas_super_admin_select" ON pistas
  FOR SELECT
  USING (public.is_super_admin());
