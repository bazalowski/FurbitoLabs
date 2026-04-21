-- ════════════════════════════════════════════════════
--  Recordatorios de partido (24h antes)
--
--  1. Añade columna reminder_sent_at a events para no spamear.
--  2. Programa pg_cron para invocar la Edge Function `send-reminders`
--     cada hora. Requiere pg_cron + pg_net activados en el proyecto
--     (Dashboard → Database → Extensions).
--
--  Nota: `app.settings.*` permite leer valores desde custom settings
--  sin hardcodear claves. Antes de aplicar ajusta en el SQL Editor:
--    alter database postgres set app.settings.edge_url = 'https://<proj>.supabase.co';
--    alter database postgres set app.settings.service_role_key = '<service-role-key>';
-- ════════════════════════════════════════════════════

-- 1. Columna para marcar recordatorios ya enviados
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Índice parcial: sólo queremos iterar sobre eventos pendientes
CREATE INDEX IF NOT EXISTS idx_events_reminder_pending
  ON events (fecha, hora)
  WHERE finalizado = FALSE AND reminder_sent_at IS NULL;

-- 2. Activar extensiones si están disponibles. Si no lo están,
--    hay que activarlas desde el dashboard y re-ejecutar esta migración.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Programar la Edge Function cada hora, en el minuto :05
--    (así evitamos colisionar con otros jobs en el :00).
DO $$
DECLARE
  edge_url TEXT := current_setting('app.settings.edge_url', true);
  service_key TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  IF edge_url IS NULL OR service_key IS NULL THEN
    RAISE NOTICE 'Skipping cron schedule — set app.settings.edge_url and app.settings.service_role_key first';
    RETURN;
  END IF;

  -- Des-programa el job si ya existía (idempotente)
  PERFORM cron.unschedule('furbito-send-reminders')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'furbito-send-reminders');

  PERFORM cron.schedule(
    'furbito-send-reminders',
    '5 * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L
        ),
        body := '{}'::jsonb
      );
      $cmd$,
      edge_url || '/functions/v1/send-reminders',
      service_key
    )
  );
END;
$$;
