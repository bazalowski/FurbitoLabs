-- ════════════════════════════════════════════════════
--  018 · Posts automáticos del sistema en el muro
--
--  Recupera lo que hacía el viejo ActivityFeed (noticias automáticas:
--  "partido creado", "resultado X-Y", "MVP de Juan") pero dentro del
--  muro V1 entregado en la mig 016. Sin esto, los jugadores que antes
--  escaneaban el feed en 2s pierden la señal cuando el muro no está
--  activo socialmente.
--
--  Cambios en `wall_posts`:
--    · Nueva columna `kind` con CHECK constraint:
--        'user'                    — post humano (default, retrocompat)
--        'system_match_created'    — al INSERTAR un evento
--        'system_match_result'     — al pasar events.finalizado false→true
--        'system_mvp'              — al pasar events.mvp_id null→value
--    · Nueva columna `payload jsonb` para datos estructurados que la UI
--      renderiza (event_id, titulo, goles_a, goles_b, mvp_name…).
--    · `author_id` ahora NULLABLE: los system posts no tienen autor.
--    · CHECK de `body` se relaja para system posts (puede ser '').
--
--  Policies ajustadas:
--    · `wall_posts_insert` SOLO acepta `kind = 'user'` desde el cliente.
--      Los system posts se insertan vía trigger SECURITY DEFINER.
--    · `wall_posts_delete` SOLO permite borrar `kind = 'user'` (excepto
--      super-admin). Los system posts son inmutables — los borra el
--      ON DELETE CASCADE del evento padre cuando se elimina.
--
--  Triggers (todos SECURITY DEFINER para bypassear `wall_posts_insert`):
--    · `wall_emit_match_created` AFTER INSERT ON events.
--    · `wall_emit_match_result`  AFTER UPDATE ON events  (finalizado).
--    · `wall_emit_mvp`           AFTER UPDATE ON events  (mvp_id).
--
--  Lo que NO se hace en esta mig (intencional):
--    · `system_level_up`: requiere comparar niveles antes/después del
--      finalize. Se podrá emitir desde `finalize-match` Edge Function
--      en una iteración futura. V1 conservador → 3 tipos basta.
--    · Ranking de posts por user>system: posibilidad documentada en el
--      PLAN_MANANA pero no aplicada — orden cronológico simple es OK
--      hasta tener datos de uso.
--
--  Rollback:
--    DROP TRIGGER wall_match_created_trigger ON events;
--    DROP TRIGGER wall_match_result_trigger  ON events;
--    DROP TRIGGER wall_mvp_trigger           ON events;
--    DROP FUNCTION wall_emit_match_created();
--    DROP FUNCTION wall_emit_match_result();
--    DROP FUNCTION wall_emit_mvp();
--    DELETE FROM wall_posts WHERE kind <> 'user';
--    ALTER TABLE wall_posts DROP COLUMN kind, DROP COLUMN payload;
--    ALTER TABLE wall_posts ALTER COLUMN author_id SET NOT NULL;
-- ════════════════════════════════════════════════════

-- ── COLUMNAS ───────────────────────────────────────

ALTER TABLE public.wall_posts
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS payload jsonb;

ALTER TABLE public.wall_posts ALTER COLUMN author_id DROP NOT NULL;

-- CHECK del kind
ALTER TABLE public.wall_posts DROP CONSTRAINT IF EXISTS wall_posts_kind_check;
ALTER TABLE public.wall_posts ADD CONSTRAINT wall_posts_kind_check
  CHECK (kind IN ('user', 'system_match_created', 'system_match_result', 'system_mvp'));

-- CHECK del body: se mantiene 1..1000 para 'user'; permitimos vacío en 'system_*'
ALTER TABLE public.wall_posts DROP CONSTRAINT IF EXISTS wall_posts_body_check;
ALTER TABLE public.wall_posts ADD CONSTRAINT wall_posts_body_check CHECK (
  (kind = 'user' AND char_length(body) BETWEEN 1 AND 1000)
  OR (kind <> 'user' AND char_length(body) <= 1000)
);

-- ── POLICIES ───────────────────────────────────────

DROP POLICY IF EXISTS "wall_posts_insert" ON public.wall_posts;
CREATE POLICY "wall_posts_insert" ON public.wall_posts
  FOR INSERT
  WITH CHECK (
    kind = 'user'
    AND auth.uid() IS NOT NULL
    AND community_id = public.get_user_community_id()
    AND author_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "wall_posts_delete" ON public.wall_posts;
CREATE POLICY "wall_posts_delete" ON public.wall_posts
  FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      kind = 'user'
      AND community_id = public.get_user_community_id()
      AND (
        author_id = (SELECT player_id FROM public.users WHERE id = auth.uid())
        OR public.get_user_role() = 'admin'
      )
    )
  );

-- ── TRIGGERS ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.wall_emit_match_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wall_posts (community_id, author_id, body, kind, payload)
  VALUES (
    NEW.community_id,
    NULL,
    '',
    'system_match_created',
    jsonb_build_object(
      'event_id', NEW.id,
      'titulo',   NEW.titulo,
      'fecha',    NEW.fecha,
      'hora',     NEW.hora,
      'tipo',     NEW.tipo
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wall_match_created_trigger ON public.events;
CREATE TRIGGER wall_match_created_trigger
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.wall_emit_match_created();


CREATE OR REPLACE FUNCTION public.wall_emit_match_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.finalizado = true AND COALESCE(OLD.finalizado, false) = false THEN
    INSERT INTO public.wall_posts (community_id, author_id, body, kind, payload)
    VALUES (
      NEW.community_id,
      NULL,
      '',
      'system_match_result',
      jsonb_build_object(
        'event_id', NEW.id,
        'titulo',   NEW.titulo,
        'goles_a',  NEW.goles_a,
        'goles_b',  NEW.goles_b
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wall_match_result_trigger ON public.events;
CREATE TRIGGER wall_match_result_trigger
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.wall_emit_match_result();


CREATE OR REPLACE FUNCTION public.wall_emit_mvp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mvp_name text;
BEGIN
  IF NEW.mvp_id IS NOT NULL AND OLD.mvp_id IS NULL THEN
    SELECT name INTO mvp_name FROM public.players WHERE id = NEW.mvp_id;
    INSERT INTO public.wall_posts (community_id, author_id, body, kind, payload)
    VALUES (
      NEW.community_id,
      NULL,
      '',
      'system_mvp',
      jsonb_build_object(
        'event_id',  NEW.id,
        'titulo',    NEW.titulo,
        'mvp_id',    NEW.mvp_id,
        'mvp_name',  mvp_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wall_mvp_trigger ON public.events;
CREATE TRIGGER wall_mvp_trigger
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.wall_emit_mvp();
