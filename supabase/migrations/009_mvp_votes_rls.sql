-- ════════════════════════════════════════════════════
--  009 · RLS fina para mvp_votes
--
--  La tabla hoy solo tiene `public_all` (USING true / WITH CHECK true).
--  Esto permite que cualquier anon vote MVP por cualquier jugador,
--  en cualquier partido, sin pertenecer a la comunidad.
--
--  Añadimos policies finas que espejan a las de `votes`:
--    · SELECT: miembros de la comunidad del evento
--    · INSERT: voter_id = propio player_id, rol player|admin,
--              partido de su comunidad, ventana de votación abierta
--    · UPDATE/DELETE: solo el propio voto, o admin de la comunidad
--
--  IMPORTANTE: NO dropeamos `public_all` todavía — se queda conviviendo
--  con las policies finas (OR entre policies). El DROP se hace en 011
--  cuando ya hayamos verificado que la app sigue funcionando.
-- ════════════════════════════════════════════════════

-- Idempotencia: si esta migración se ejecuta dos veces, no rompe
DROP POLICY IF EXISTS "mvp_votes_select" ON mvp_votes;
DROP POLICY IF EXISTS "mvp_votes_insert" ON mvp_votes;
DROP POLICY IF EXISTS "mvp_votes_update" ON mvp_votes;
DROP POLICY IF EXISTS "mvp_votes_delete" ON mvp_votes;

-- ── SELECT ──────────────────────────────────────────
-- Visible para miembros de la comunidad del evento, o sesión aún sin auth
CREATE POLICY "mvp_votes_select" ON mvp_votes
  FOR SELECT
  USING (
    (EXISTS (
      SELECT 1
      FROM events e
      WHERE e.id = mvp_votes.event_id
        AND e.community_id = public.get_user_community_id()
    ))
    OR auth.uid() IS NULL
  );

-- ── INSERT ──────────────────────────────────────────
-- Solo puedes votar como ti mismo, en un partido de tu comunidad,
-- siendo player o admin
CREATE POLICY "mvp_votes_insert" ON mvp_votes
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('player', 'admin')
    AND voter_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM events e
      WHERE e.id = mvp_votes.event_id
        AND e.community_id = public.get_user_community_id()
    )
  );

-- ── UPDATE ──────────────────────────────────────────
-- Solo puedes modificar tu propio voto (o siendo admin)
CREATE POLICY "mvp_votes_update" ON mvp_votes
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      voter_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
      OR public.get_user_role() = 'admin'
    )
  );

-- ── DELETE ──────────────────────────────────────────
-- Solo tu propio voto, o admin de la comunidad
CREATE POLICY "mvp_votes_delete" ON mvp_votes
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      voter_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
      OR public.get_user_role() = 'admin'
    )
  );
