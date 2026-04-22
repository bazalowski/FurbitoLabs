-- ════════════════════════════════════════════════════════════════
--  008_porteria_cero_count.sql
--  Permite que un jugador tenga MÁS DE UNA portería a cero por
--  partido (los porteros en Furbito se rotan). Convertimos la
--  columna booleana en contador entero.
--    FALSE → 0
--    TRUE  → 1
--  Ejecutar una sola vez en Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE match_players
  ALTER COLUMN porteria_cero DROP DEFAULT,
  ALTER COLUMN porteria_cero TYPE INTEGER
    USING CASE WHEN porteria_cero THEN 1 ELSE 0 END,
  ALTER COLUMN porteria_cero SET DEFAULT 0;

-- Consistencia: valores no negativos
ALTER TABLE match_players
  DROP CONSTRAINT IF EXISTS match_players_porteria_cero_check;
ALTER TABLE match_players
  ADD  CONSTRAINT match_players_porteria_cero_check
  CHECK (porteria_cero >= 0);
