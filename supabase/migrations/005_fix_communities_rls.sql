-- ════════════════════════════════════════════════════
--  Fix RLS de communities
--
--  Motivo: la migración 002 intentó partir "public_all" en
--  varias policies (read/insert/update) con un
--  `EXCEPTION WHEN OTHERS THEN NULL` que, en algunos entornos,
--  dejó la tabla sin policy de INSERT. Resultado: la creación
--  de comunidades fallaba con RLS (42501).
--
--  La app usa login por PIN (sin Supabase Auth real todavía),
--  así que restauramos el régimen permisivo equivalente al de
--  las demás tablas del schema base.
-- ════════════════════════════════════════════════════

DROP POLICY IF EXISTS "communities_public_read" ON communities;
DROP POLICY IF EXISTS "communities_auth_write"  ON communities;
DROP POLICY IF EXISTS "communities_auth_update" ON communities;
DROP POLICY IF EXISTS "public_all"              ON communities;

CREATE POLICY "public_all" ON communities
  FOR ALL USING (true) WITH CHECK (true);
