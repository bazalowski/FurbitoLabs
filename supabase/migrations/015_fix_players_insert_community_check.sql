-- ════════════════════════════════════════════════════
--  015 · Fix players_insert — comprobar comunidad via SECURITY DEFINER
--
--  Bug post-mig 014: al endurecer communities_select a
--  `id = get_user_community_id()`, un user que acaba de crear una
--  comunidad NO puede verla todavía (aún no está en public.users).
--  Eso rompía la subquery `EXISTS (SELECT 1 FROM communities ...)`
--  dentro de la policy players_insert caso 2 (self-onboarding).
--
--  Fix: función SECURITY DEFINER que comprueba existencia de una
--  comunidad sin pasar por el RLS de communities.
-- ════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.community_exists(cid text)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM communities WHERE id = cid);
$$;

GRANT EXECUTE ON FUNCTION public.community_exists(text) TO anon, authenticated;

DROP POLICY IF EXISTS "players_insert" ON players;

CREATE POLICY "players_insert" ON players
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Caso 1: admin de la comunidad
      (
        community_id = public.get_user_community_id()
        AND public.get_user_role() = 'admin'
      )
      OR
      -- Caso 2: self-onboarding. Usa community_exists() SECURITY DEFINER
      -- para no depender de que el caller pueda ver communities bajo RLS.
      (
        NOT EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND player_id IS NOT NULL
        )
        AND public.community_exists(community_id)
      )
    )
  );
