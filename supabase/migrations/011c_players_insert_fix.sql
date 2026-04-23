-- ════════════════════════════════════════════════════
--  011c · Fix players_insert — manejar public.users inexistente
--
--  Bug descubierto tras 011b: al crear comunidad nueva desde cero,
--  el user aún no tiene fila en public.users (se crea al hacer login
--  DESPUÉS del INSERT del player). La subquery
--    (SELECT player_id FROM public.users WHERE id = auth.uid())
--  devuelve 0 filas → el IS NULL evaluado sobre ausencia de filas
--  da UNKNOWN (no TRUE) → la policy rechaza.
--
--  Fix: usar NOT EXISTS que cubre ambos casos:
--    · Fila de users inexistente (primer login)
--    · Fila existe con player_id = NULL (onboarding intermedio)
-- ════════════════════════════════════════════════════

DROP POLICY IF EXISTS "players_insert" ON players;

CREATE POLICY "players_insert" ON players
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Caso 1: admin creando jugador en su comunidad
      (
        community_id = public.get_user_community_id()
        AND public.get_user_role() = 'admin'
      )
      OR
      -- Caso 2: self-onboarding — el user no tiene player asignado
      -- todavía (o ni siquiera tiene fila en public.users)
      (
        NOT EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
            AND player_id IS NOT NULL
        )
        AND EXISTS (SELECT 1 FROM communities WHERE id = community_id)
      )
    )
  );
