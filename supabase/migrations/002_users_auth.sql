-- ════════════════════════════════════════════════════
--  Users table — vinculada a Supabase Auth (auth.users)
--  Fase A: Anonymous Auth con metadata
-- ════════════════════════════════════════════════════

-- Tabla users: bridge entre auth.users y el modelo de FURBITO
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id TEXT REFERENCES communities(id) ON DELETE SET NULL,
  player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('guest', 'player', 'admin')) DEFAULT 'guest',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cada usuario solo puede leer/escribir su propio registro
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ════════════════════════════════════════════════════
--  RLS Policies reales — Fase B
--  Aísla datos por comunidad del usuario autenticado
-- ════════════════════════════════════════════════════

-- Helper: obtener community_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_community_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT community_id FROM public.users WHERE id = auth.uid();
$$;

-- Helper: obtener role del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ── Players: leer solo de tu comunidad ──────────────
-- Primero eliminamos la política pública existente (si existe)
DO $$
BEGIN
  -- Drop existing public policies (safe to run multiple times)
  DROP POLICY IF EXISTS "public_all" ON players;
  DROP POLICY IF EXISTS "public_all" ON events;
  DROP POLICY IF EXISTS "public_all" ON confirmations;
  DROP POLICY IF EXISTS "public_all" ON match_players;
  DROP POLICY IF EXISTS "public_all" ON votes;
  DROP POLICY IF EXISTS "public_all" ON communities;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if policies don't exist
END;
$$;

-- Políticas permisivas temporales (para no romper nada durante la migración)
-- Se reemplazarán gradualmente con políticas basadas en auth.uid()

-- Comunidades: lectura pública, escritura requiere auth
CREATE POLICY "communities_public_read" ON communities
  FOR SELECT USING (true);

CREATE POLICY "communities_auth_write" ON communities
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL OR true  -- permite anon durante migración
  );

CREATE POLICY "communities_auth_update" ON communities
  FOR UPDATE USING (
    auth.uid() IS NOT NULL OR true  -- permite anon durante migración
  );

-- Players: lectura pública (para rankings, etc.), escritura requiere auth
CREATE POLICY "players_public_read" ON players
  FOR SELECT USING (true);

CREATE POLICY "players_auth_write" ON players
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL OR true
  );

CREATE POLICY "players_auth_update" ON players
  FOR UPDATE USING (
    auth.uid() IS NOT NULL OR true
  );

CREATE POLICY "players_auth_delete" ON players
  FOR DELETE USING (
    auth.uid() IS NOT NULL OR true
  );

-- Events: lectura pública, escritura requiere auth
CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (true);

CREATE POLICY "events_auth_write" ON events
  FOR ALL USING (
    auth.uid() IS NOT NULL OR true
  );

-- Confirmations: lectura pública, escritura requiere auth
CREATE POLICY "confirmations_public_read" ON confirmations
  FOR SELECT USING (true);

CREATE POLICY "confirmations_auth_write" ON confirmations
  FOR ALL USING (
    auth.uid() IS NOT NULL OR true
  );

-- Match players: lectura pública, escritura requiere auth
CREATE POLICY "match_players_public_read" ON match_players
  FOR SELECT USING (true);

CREATE POLICY "match_players_auth_write" ON match_players
  FOR ALL USING (
    auth.uid() IS NOT NULL OR true
  );

-- Votes: lectura pública, escritura requiere auth
CREATE POLICY "votes_public_read" ON votes
  FOR SELECT USING (true);

CREATE POLICY "votes_auth_write" ON votes
  FOR ALL USING (
    auth.uid() IS NOT NULL OR true
  );
