-- ════════════════════════════════════════════════════
--  MVP voting: votos persistidos en BD + cierre temporizado
--
--  1. Tabla mvp_votes (antes se guardaba en localStorage).
--  2. Columna events.mvp_voting_closes_at para fijar cuándo
--     deja de aceptarse votación (default: NOW + 24h al
--     finalizar el partido, o ajustable por admin).
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mvp_votes (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  voter_id   TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  voted_id   TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_mvp_votes_event  ON mvp_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_mvp_votes_voter  ON mvp_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_mvp_votes_voted  ON mvp_votes(voted_id);

ALTER TABLE mvp_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON mvp_votes FOR ALL USING (true) WITH CHECK (true);

-- Timestamp de cierre. NULL = sin límite / aún sin configurar.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS mvp_voting_closes_at TIMESTAMPTZ;
