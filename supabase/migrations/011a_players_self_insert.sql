-- ════════════════════════════════════════════════════
--  011a · Relajar players_insert para permitir self-onboarding
--
--  Motivo:
--  La policy actual `players_insert` exige:
--     auth.uid() IS NOT NULL
--     AND community_id = get_user_community_id()
--     AND get_user_role() = 'admin'
--  Eso rompe dos flujos cuando quitemos `public_all`:
--    1. Crear comunidad nueva (src/app/page.tsx:164)
--       El user crea comu + primer jugador admin. En ese instante
--       aún no hay enlace en public.users → get_user_community_id()
--       es NULL y get_user_role() = 'guest'.
--    2. Unirse como nuevo jugador con PIN de comu (page.tsx:563)
--       El user es guest recién llegado, nunca será admin.
--
--  Solución: relajar solo el INSERT para permitir self-onboarding:
--    - Un usuario autenticado puede crear UN jugador cuyo community_id
--      coincida con el de una comunidad existente, SIEMPRE que su
--      public.users.player_id esté aún vacío (nunca se ha asignado).
--    - Un admin de una comunidad sigue pudiendo crear jugadores
--      dentro de esa comunidad.
--
--  El UPDATE/DELETE/SELECT siguen tan estrictos como están.
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
      -- Caso 2: self-onboarding — user sin player aún, creando su
      -- primer jugador en una comunidad existente
      (
        (SELECT player_id FROM public.users WHERE id = auth.uid()) IS NULL
        AND EXISTS (SELECT 1 FROM communities WHERE id = community_id)
      )
    )
  );
