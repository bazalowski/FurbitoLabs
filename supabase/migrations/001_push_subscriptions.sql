-- ════════════════════════════════════════════════════
--  Push Subscriptions — Web Push API
--  Almacena suscripciones push por jugador/comunidad
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  key_auth TEXT NOT NULL,
  key_p256dh TEXT NOT NULL,
  preferences JSONB DEFAULT '{
    "event_created": true,
    "event_reminder": true,
    "match_finished": true,
    "badge_earned": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar suscripciones por comunidad (enviar push a todos)
CREATE INDEX IF NOT EXISTS idx_push_subs_community ON push_subscriptions(community_id);

-- Índice para buscar suscripciones por jugador
CREATE INDEX IF NOT EXISTS idx_push_subs_player ON push_subscriptions(player_id);

-- RLS (público por ahora — se migrará con Supabase Auth)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
