-- ════════════════════════════════════════════════════
--  012 · Revocar privilegios innecesarios de anon y authenticated
--
--  Estado actual (ver resultado de role_table_grants): anon y
--  authenticated tienen TRUNCATE, REFERENCES, TRIGGER sobre TODAS
--  las tablas del schema public. Supabase los concede por defecto
--  vía PostgREST pero son innecesarios y peligrosos:
--
--    · TRUNCATE  → vaciar tabla completa, sin pasar por RLS
--    · REFERENCES → crear FKs apuntando a tus datos (enumeración)
--    · TRIGGER   → adjuntar triggers que se disparen en cada escritura
--
--  Las policies RLS no protegen contra estos porque son privilegios
--  a nivel de tabla, no de fila.
--
--  Dejamos SELECT/INSERT/UPDATE/DELETE — esos sí los gobiernan las
--  policies RLS.
-- ════════════════════════════════════════════════════

REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;
