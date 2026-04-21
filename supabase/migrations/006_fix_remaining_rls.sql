-- ════════════════════════════════════════════════════
--  Fix RLS — resto de tablas afectadas por la 002
--
--  Motivo: el bloque DO de 002_users_auth.sql dropea
--  `public_all` en players/events/confirmations/match_players/votes
--  y crea en su lugar policies *_public_read + *_auth_write. En
--  algunos entornos esas CREATE POLICY no llegaron a aplicarse
--  y las tablas quedaron sin policy de INSERT → error 42501 al
--  crear jugador tras crear comunidad (u otros flujos).
--
--  Ya arreglamos `communities` en 005. Aquí restauramos el
--  régimen permisivo (coherente con schema base) en el resto,
--  hasta que el login por PIN migre a Supabase Auth real.
-- ════════════════════════════════════════════════════

-- ── players ─────────────────────────────────────────
DROP POLICY IF EXISTS "players_public_read"  ON players;
DROP POLICY IF EXISTS "players_auth_write"   ON players;
DROP POLICY IF EXISTS "players_auth_update"  ON players;
DROP POLICY IF EXISTS "players_auth_delete"  ON players;
DROP POLICY IF EXISTS "public_all"           ON players;
CREATE POLICY "public_all" ON players
  FOR ALL USING (true) WITH CHECK (true);

-- ── events ──────────────────────────────────────────
DROP POLICY IF EXISTS "events_public_read" ON events;
DROP POLICY IF EXISTS "events_auth_write"  ON events;
DROP POLICY IF EXISTS "public_all"         ON events;
CREATE POLICY "public_all" ON events
  FOR ALL USING (true) WITH CHECK (true);

-- ── confirmations ───────────────────────────────────
DROP POLICY IF EXISTS "confirmations_public_read" ON confirmations;
DROP POLICY IF EXISTS "confirmations_auth_write"  ON confirmations;
DROP POLICY IF EXISTS "public_all"                ON confirmations;
CREATE POLICY "public_all" ON confirmations
  FOR ALL USING (true) WITH CHECK (true);

-- ── match_players ───────────────────────────────────
DROP POLICY IF EXISTS "match_players_public_read" ON match_players;
DROP POLICY IF EXISTS "match_players_auth_write"  ON match_players;
DROP POLICY IF EXISTS "public_all"                ON match_players;
CREATE POLICY "public_all" ON match_players
  FOR ALL USING (true) WITH CHECK (true);

-- ── votes ───────────────────────────────────────────
DROP POLICY IF EXISTS "votes_public_read" ON votes;
DROP POLICY IF EXISTS "votes_auth_write"  ON votes;
DROP POLICY IF EXISTS "public_all"        ON votes;
CREATE POLICY "public_all" ON votes
  FOR ALL USING (true) WITH CHECK (true);
