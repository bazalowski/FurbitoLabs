-- ════════════════════════════════════════════════════════════════
--  FURBITO v2 — Supabase Schema
--  Ejecuta este archivo en: Supabase → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Limpiar tablas anteriores (útil para re-ejecutar en dev) ──────
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS confirmations CASCADE;
DROP TABLE IF EXISTS match_players CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS pistas CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- ════════════════════════════════════════════════════════════════
--  COMMUNITIES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE communities (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT NOT NULL,
  pin           TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT '#a8ff3e',
  comm_admin_id TEXT,                   -- id del jugador con rol admin (legacy, primer admin)
  admin_ids     TEXT[] DEFAULT '{}',   -- array de IDs de admins (max 3)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
--  PLAYERS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE players (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  code         TEXT NOT NULL,           -- código 4 chars para login del jugador
  position     TEXT,                    -- portero, defensa, centrocampista, delantero
  avatar       TEXT,                    -- emoji o URL
  -- Stats acumuladas
  xp           INTEGER DEFAULT 0,
  partidos     INTEGER DEFAULT 0,
  goles        INTEGER DEFAULT 0,
  asistencias  INTEGER DEFAULT 0,
  mvps         INTEGER DEFAULT 0,
  partidos_cero INTEGER DEFAULT 0,      -- partidos con portería a cero
  -- Meta
  badges       TEXT[]  DEFAULT '{}',
  vitrina      TEXT[]  DEFAULT '{}',    -- máx 3 badges seleccionados para mostrar
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, code)
);

-- ════════════════════════════════════════════════════════════════
--  PISTAS (LOCATIONS)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE pistas (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  address      TEXT,
  lat          FLOAT,
  lng          FLOAT,
  added_by     TEXT REFERENCES players(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
--  EVENTS (PARTIDOS / ENTRENAMIENTOS / ETC.)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE events (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id   TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  pista_id       TEXT REFERENCES pistas(id) ON DELETE SET NULL,
  titulo         TEXT NOT NULL,
  tipo           TEXT NOT NULL DEFAULT 'partido',   -- partido | entrenamiento | otro
  fecha          DATE,
  hora           TEXT,                              -- "HH:MM"
  lugar          TEXT,                              -- texto libre si no hay pista vinculada
  max_jugadores  INTEGER DEFAULT 10,
  notas          TEXT,
  abierto        BOOLEAN DEFAULT FALSE,             -- disponible para otras comunidades
  -- Resultado (se rellena post-partido)
  finalizado     BOOLEAN DEFAULT FALSE,
  goles_a        INTEGER,
  goles_b        INTEGER,
  equipo_a       TEXT[] DEFAULT '{}',               -- array de player ids
  equipo_b       TEXT[] DEFAULT '{}',
  mvp_id         TEXT REFERENCES players(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
--  CONFIRMATIONS (ASISTENCIA A EVENTO)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE confirmations (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status     TEXT CHECK (status IN ('si', 'no', 'quiza')) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

-- ════════════════════════════════════════════════════════════════
--  MATCH_PLAYERS (ESTADÍSTICAS POR PARTIDO)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE match_players (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id     TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goles         INTEGER DEFAULT 0,
  asistencias   INTEGER DEFAULT 0,
  porteria_cero BOOLEAN DEFAULT FALSE,
  parada_penalti BOOLEAN DEFAULT FALSE,
  chilena       BOOLEAN DEFAULT FALSE,
  olimpico      BOOLEAN DEFAULT FALSE,
  tacon         BOOLEAN DEFAULT FALSE,
  xp_ganado     INTEGER DEFAULT 0,
  equipo        TEXT CHECK (equipo IN ('A', 'B')),
  UNIQUE(event_id, player_id)
);

-- ════════════════════════════════════════════════════════════════
--  VOTES (VALORACIONES DE JUGADORES)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE votes (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  voter_id     TEXT REFERENCES players(id) ON DELETE SET NULL,   -- null si es invitado
  voted_id     TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ataque       FLOAT NOT NULL CHECK (ataque BETWEEN 1 AND 5),
  defensa      FLOAT NOT NULL CHECK (defensa BETWEEN 1 AND 5),
  tecnica      FLOAT NOT NULL CHECK (tecnica BETWEEN 1 AND 5),
  velocidad    FLOAT NOT NULL CHECK (velocidad BETWEEN 1 AND 5),
  empeno       FLOAT NOT NULL CHECK (empeno BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  -- Un jugador identificado solo puede votar una vez a cada jugador
  UNIQUE(voter_id, voted_id)
);

-- ════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Por ahora: acceso público (read/write) para todas las tablas.
--  TODO: restringir con auth cuando implementes Supabase Auth.
-- ════════════════════════════════════════════════════════════════
ALTER TABLE communities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pistas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes         ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para todas las operaciones (acceso público por PIN)
CREATE POLICY "public_all" ON communities   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON players       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON pistas        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON events        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON confirmations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON match_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON votes         FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════
--  ÍNDICES (performance)
-- ════════════════════════════════════════════════════════════════
CREATE INDEX idx_players_community       ON players(community_id);
CREATE INDEX idx_pistas_community        ON pistas(community_id);
CREATE INDEX idx_events_community        ON events(community_id);
CREATE INDEX idx_events_fecha            ON events(fecha);
CREATE INDEX idx_confirmations_event     ON confirmations(event_id);
CREATE INDEX idx_confirmations_player    ON confirmations(player_id);
CREATE INDEX idx_match_players_event     ON match_players(event_id);
CREATE INDEX idx_match_players_player    ON match_players(player_id);
CREATE INDEX idx_votes_voted             ON votes(voted_id);
CREATE INDEX idx_votes_community         ON votes(community_id);

-- ════════════════════════════════════════════════════════════════
--  REALTIME (opcional — activa canales para actualizaciones en vivo)
-- ════════════════════════════════════════════════════════════════
-- Activa en: Supabase → Database → Replication → enable para:
-- events, confirmations, match_players

-- ════════════════════════════════════════════════════════════════
--  MIGRATION: admin_ids (ejecutar si ya tienes la BD creada)
-- ════════════════════════════════════════════════════════════════
-- ALTER TABLE communities ADD COLUMN IF NOT EXISTS admin_ids TEXT[] DEFAULT '{}';
-- UPDATE communities SET admin_ids = ARRAY[comm_admin_id] WHERE comm_admin_id IS NOT NULL AND admin_ids = '{}';
