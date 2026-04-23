-- ════════════════════════════════════════════════════
--  011b · Dropear public_all en todas las tablas
--
--  Llegados aquí:
--    · Mig 002: helpers auth + public.users con RLS estricto ✅
--    · Mig 009: mvp_votes tiene policies finas ✅
--    · Mig 010: storage.avatars tiene policies finas ✅
--    · Mig 011a: players_insert permite self-onboarding ✅
--    · AuthBootstrap garantiza auth.uid() antes de cualquier escritura
--
--  Ahora retiramos el paraguas `public_all` que anulaba todas las
--  policies finas por OR-logic. A partir de esta migración, las
--  policies finas son las que gobiernan.
--
--  ROLLBACK de emergencia si algo se rompe:
--     CREATE POLICY "public_all" ON <tabla> FOR ALL USING (true) WITH CHECK (true);
--  Vuelve al estado anterior a esta migración en segundos.
-- ════════════════════════════════════════════════════

DROP POLICY IF EXISTS "public_all" ON communities;
DROP POLICY IF EXISTS "public_all" ON players;
DROP POLICY IF EXISTS "public_all" ON events;
DROP POLICY IF EXISTS "public_all" ON confirmations;
DROP POLICY IF EXISTS "public_all" ON match_players;
DROP POLICY IF EXISTS "public_all" ON votes;
DROP POLICY IF EXISTS "public_all" ON mvp_votes;
-- pistas y push_subscriptions no tenían public_all (ya estaban solo con finas)
-- users ya estaba estricto desde la 002
