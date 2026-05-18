-- ════════════════════════════════════════════════════
--  017 · Undo 15 min tras finalizar partido
--
--  Hoy "Finalizar partido" es de un solo sentido: si el admin se
--  equivoca (gol mal asignado, MVP equivocado, alineación que se
--  movió en el último momento) no hay vuelta atrás sin tocar SQL.
--  Eso frena la adopción por admins no técnicos y obliga a operar
--  con miedo al botón.
--
--  Esta migración prepara el revertido limpio:
--
--    1. `events.finalizado_at timestamptz` — momento exacto en que
--       el partido se cerró. La Edge Function `unfinalize-match`
--       comprueba `now() - finalizado_at < 15 min` antes de revertir.
--
--    2. `event_player_snapshots` — antes de aplicar los writes de
--       stats/XP/badges en `finalize-match`, snapshoteamos el estado
--       *previo* de cada jugador. Si el admin pulsa "Deshacer",
--       restauramos cada fila a esos valores en bloque, en vez de
--       intentar reconstruir el delta (que no funciona para badges
--       y level-ups encadenados).
--
--  Rollback de la mig:
--     DROP TABLE event_player_snapshots;
--     ALTER TABLE events DROP COLUMN finalizado_at;
-- ════════════════════════════════════════════════════

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS finalizado_at timestamptz;

CREATE TABLE IF NOT EXISTS public.event_player_snapshots (
  event_id      text NOT NULL REFERENCES public.events(id)  ON DELETE CASCADE,
  player_id     text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  partidos      int  NOT NULL,
  goles         int  NOT NULL,
  asistencias   int  NOT NULL,
  partidos_cero int  NOT NULL,
  mvps          int  NOT NULL,
  xp            int  NOT NULL,
  badges        text[] NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, player_id)
);

-- RLS estricta: ninguna superficie expuesta a cliente. Solo service_role
-- (vía Edge Functions) y super-admin (para soporte / auditoría).
ALTER TABLE public.event_player_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_player_snapshots_super_admin" ON public.event_player_snapshots;
CREATE POLICY "event_player_snapshots_super_admin" ON public.event_player_snapshots
  FOR SELECT
  USING (public.is_super_admin());

REVOKE ALL ON public.event_player_snapshots FROM anon, authenticated;
