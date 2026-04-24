-- ════════════════════════════════════════════════════
--  016 · Muro de Comunidad (V1 + V3 YouTube)
--
--  Sustituye la sección "Actividad reciente" por un feed
--  social real. Posts con texto + opcionalmente un video
--  de YouTube embebido (youtube_id, 11 chars). Reacciones
--  con un set fijo de emojis (1 fila por emoji/jugador/post).
--
--  RLS fina desde el principio — ningún public_all.
--  Helper SECURITY DEFINER wall_post_community(post_id)
--  para que wall_reactions pueda comprobar la comunidad del
--  post sin depender del RLS de wall_posts bajo subquery.
--
--  TODO los IDs son TEXT (consistente con el schema: players.id,
--  events.id, communities.id son TEXT — ver schema.sql).
--
--  Rollback:
--    DROP TABLE public.wall_reactions;
--    DROP TABLE public.wall_posts;
--    DROP FUNCTION public.wall_post_community(text);
-- ════════════════════════════════════════════════════

-- ── TABLAS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wall_posts (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id    text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  body         text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  youtube_id   text CHECK (youtube_id IS NULL OR youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wall_posts_comm_created_idx
  ON public.wall_posts (community_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.wall_reactions (
  post_id    text NOT NULL REFERENCES public.wall_posts(id) ON DELETE CASCADE,
  player_id  text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  emoji      text NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, player_id, emoji)
);

CREATE INDEX IF NOT EXISTS wall_reactions_post_idx
  ON public.wall_reactions (post_id);

-- ── HELPER SECURITY DEFINER ────────────────────────
-- Devuelve el community_id de un wall_post sin pasar por RLS.
-- Permite que wall_reactions_* comprueben pertenencia a
-- comunidad sin que el caller tenga que poder SELECT el post
-- bajo su propio RLS (patrón regla §4.1 del backend skill).

CREATE OR REPLACE FUNCTION public.wall_post_community(pid text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT community_id FROM public.wall_posts WHERE id = pid;
$$;

GRANT EXECUTE ON FUNCTION public.wall_post_community(text) TO anon, authenticated;

-- ── RLS ────────────────────────────────────────────

ALTER TABLE public.wall_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wall_reactions ENABLE ROW LEVEL SECURITY;

-- wall_posts

DROP POLICY IF EXISTS "wall_posts_select" ON public.wall_posts;
CREATE POLICY "wall_posts_select" ON public.wall_posts
  FOR SELECT
  USING (
    community_id = public.get_user_community_id()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "wall_posts_insert" ON public.wall_posts;
CREATE POLICY "wall_posts_insert" ON public.wall_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND community_id = public.get_user_community_id()
    AND author_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "wall_posts_delete" ON public.wall_posts;
CREATE POLICY "wall_posts_delete" ON public.wall_posts
  FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      community_id = public.get_user_community_id()
      AND (
        author_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
        OR public.get_user_role() = 'admin'
      )
    )
  );

-- wall_reactions

DROP POLICY IF EXISTS "wall_reactions_select" ON public.wall_reactions;
CREATE POLICY "wall_reactions_select" ON public.wall_reactions
  FOR SELECT
  USING (
    public.is_super_admin()
    OR public.wall_post_community(post_id) = public.get_user_community_id()
  );

DROP POLICY IF EXISTS "wall_reactions_insert" ON public.wall_reactions;
CREATE POLICY "wall_reactions_insert" ON public.wall_reactions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND player_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
    AND public.wall_post_community(post_id) = public.get_user_community_id()
  );

DROP POLICY IF EXISTS "wall_reactions_delete" ON public.wall_reactions;
CREATE POLICY "wall_reactions_delete" ON public.wall_reactions
  FOR DELETE
  USING (
    public.is_super_admin()
    OR player_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
  );

-- ── GRANTS ─────────────────────────────────────────
-- Solo lo estrictamente necesario (mig 012): los roles
-- authenticated/anon ya tienen DML básico por defecto al
-- crear tabla en schema public en Supabase, pero REVOCAMOS
-- explícitamente para alinear con la política del audit.

REVOKE ALL ON public.wall_posts     FROM anon, authenticated;
REVOKE ALL ON public.wall_reactions FROM anon, authenticated;

GRANT SELECT, INSERT, DELETE ON public.wall_posts     TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.wall_reactions TO authenticated;
-- anon: sin acceso. El muro requiere identificarse.
