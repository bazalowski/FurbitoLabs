# FURBITO — Auditoría del backend

> **Objetivo**: examinar el backend real (Postgres + RLS + Edge Functions + Storage + Realtime + capa cliente-Supabase) y dejar para cada capa:
> - Qué existe hoy (archivos, tablas, funciones, políticas).
> - Fortalezas a preservar.
> - Gaps, riesgos y deuda técnica.
> - **Mejoras propuestas** priorizadas P0/P1/P2 con criterio "impacto operativo / coste".
>
> Complementa a [FEATURE_AUDIT.md](FEATURE_AUDIT.md) (funcional), [UI_AUDIT_PANTALLAS.md](UI_AUDIT_PANTALLAS.md) (UI) y [FURBITO_DESIGN_SYSTEM.md](FURBITO_DESIGN_SYSTEM.md) (design system). Debe leerse junto a [PORTABILIDAD_NATIVA.md](PORTABILIDAD_NATIVA.md) (qué se reusa en la nativa).
>
> **Convenciones**: 🟢 fortaleza · 🔴 gap · ✨ propuesta · ⚙️ técnico · 🔒 seguridad.

---

## Índice

1. [Stack y diagrama de capas](#1-stack-y-diagrama-de-capas)
2. [Esquema de datos (Postgres)](#2-esquema-de-datos-postgres)
3. [Row Level Security (RLS) y autorización](#3-row-level-security-rls-y-autorización)
4. [Autenticación (PIN + Supabase Auth anónima)](#4-autenticación-pin--supabase-auth-anónima)
5. [Edge Functions](#5-edge-functions)
6. [Realtime](#6-realtime)
7. [Storage (avatars)](#7-storage-avatars)
8. [Cron / jobs programados](#8-cron--jobs-programados)
9. [Capa cliente ↔ Supabase](#9-capa-cliente--supabase)
10. [Migraciones y versionado](#10-migraciones-y-versionado)
11. [Observabilidad, logs y errores](#11-observabilidad-logs-y-errores)
12. [Costes, cuotas y escalado](#12-costes-cuotas-y-escalado)
13. [Backup, recuperación y GDPR](#13-backup-recuperación-y-gdpr)
14. [Seguridad — cross-cutting](#14-seguridad--cross-cutting)
15. [Top 15 mejoras priorizadas](#15-top-15-mejoras-priorizadas)

---

## 1. Stack y diagrama de capas

**Capas**:

```
┌────────────────────────────────────────────────────────────┐
│  Web (Next.js 14 App Router, React 18, TS) — Vercel         │
│  + Service Worker (public/sw.js)                            │
│  + Stores: Zustand (persist: localStorage)                  │
└─────────────────────┬──────────────────────────────────────┘
                      │ HTTPS + WSS
                      ▼
┌────────────────────────────────────────────────────────────┐
│  Supabase Platform                                           │
│  ├── PostgreSQL 15 (+ extensions: pgcrypto, pg_cron, pg_net)│
│  ├── PostgREST (auto API) + Realtime (WAL → WS)             │
│  ├── GoTrue (Auth) — uso: signInAnonymously                 │
│  ├── Storage (bucket "avatars")                             │
│  └── Edge Functions (Deno) — send-push, send-reminders      │
└────────────────────────────────────────────────────────────┘
                      ▲
                      │ Web Push Protocol (VAPID)
                      │
           Navegadores de los jugadores (PWA)
```

**Librerías cliente**:
- `@supabase/ssr` + `@supabase/supabase-js` (web).
- `zustand` + `zustand/middleware` (persist → localStorage).
- Deno stdlib + `web-push@3.6.7` en Edge Functions.

### 🟢 Fortalezas

- **BaaS monolítico**: un solo proveedor cubre DB, Realtime, Auth, Storage y Functions — cero integración entre proveedores.
- **Todo en TypeScript** (incluidas las Edge Functions) — tipos y lógica reaprovechables cliente ↔ servidor.
- **Cero servidor propio**: arquitectura serverless + Postgres gestionado. No hay máquina que mantener.

### 🔴 Gaps

1. No hay una **capa de servicio** propia entre cliente y PostgREST: la lógica de dominio (cálculos de badges, XP, finalización de partido) vive 100% en cliente. Duplicable en nativa y vulnerable a un cliente malicioso.
2. Acoplamiento total a Supabase. Si por cualquier razón toca migrar (coste, límites, política de empresa), es una operación grande.
3. No hay **ambientes separados** visibles (dev/staging/prod). Un solo proyecto Supabase (inferido por el directorio y la UX de migraciones manuales).

### ✨ Propuestas

- **P1 · Separar `dev`, `staging`, `prod` como 3 proyectos Supabase** `@backend` ⚙️
  Rama `main` → prod, rama `staging` → staging, local → dev con [Supabase CLI](https://supabase.com/docs/guides/cli). Sin esto, un error de migración tumba usuarios reales. Coste: un fin de semana + ~$25/mes adicionales (tiers Free/Pro).

- **P1 · Introducir una capa de Edge Functions como fachada de dominio** `@backend` ⚙️
  Operaciones críticas (finalizar partido, cerrar MVP, detección de badges, crear/promover admin) dejan de ser llamadas directas a PostgREST y pasan por funciones Deno con `service_role_key`. Centraliza lógica, permite auditar y previene manipulación desde el cliente. Ver §5 P0.

- **P2 · Considerar alternativa a Supabase si se alcanzan límites** `@backend`
  Hoy es la decisión correcta. A partir de ~10k DAU o features que requieran queues / long-running jobs, valorar añadir algo complementario (p.ej. Upstash QStash para colas, o Fly.io/Railway para un worker propio). **No** migrar por migrar.

---

## 2. Esquema de datos (Postgres)

**Archivos**: [supabase/schema.sql](../../supabase/schema.sql), [supabase/migrations/001..008](../../supabase/migrations/).

**Tablas actuales (9)**:

| Tabla | Resumen | PK | Relaciones clave |
|-------|---------|----|-----------------|
| `communities` | Grupo + PIN + color + admins | `id` TEXT (uuid casteado) | `admin_ids TEXT[]` (max 3), `comm_admin_id` (legacy) |
| `players` | Jugador de comunidad + stats agregadas | `id` TEXT | FK `community_id` · `UNIQUE(community_id, code)` |
| `pistas` | Pista jugable con lat/lng | `id` TEXT | FK `community_id`, `added_by` → players |
| `events` | Partido/entreno con resultado embebido (`goles_a`, `goles_b`, `equipo_a[]`, `equipo_b[]`, `mvp_id`) | `id` TEXT | FK `community_id`, `pista_id` |
| `confirmations` | Asistencia `si/no/quiza` por jugador/evento | `id` TEXT | `UNIQUE(event_id, player_id)` |
| `match_players` | Stats por jugador y partido | `id` TEXT | `UNIQUE(event_id, player_id)` |
| `votes` | Valoración skills 1-5 (votante→votado) | `id` TEXT | `UNIQUE(voter_id, voted_id)` por comunidad |
| `push_subscriptions` | Endpoint + VAPID keys + prefs | `id` TEXT | FK `player_id`, `community_id`, `UNIQUE(endpoint)` |
| `mvp_votes` | Voto MVP por partido (mig 004) | `id` TEXT | `UNIQUE(event_id, voter_id)` |
| `public.users` | Bridge `auth.users` ↔ FURBITO (mig 002) | `id` UUID | `role`, `community_id`, `player_id` |

**Observaciones inmediatas**:

- Mezcla de tipos de PK: casi todas usan `TEXT DEFAULT gen_random_uuid()::text`, pero `public.users.id` es `UUID` (viene de `auth.users`). No es un bug, pero introduce dos estilos.
- Columnas denormalizadas en `players` (`partidos`, `goles`, `asistencias`, `mvps`, `partidos_cero`, `xp`, `badges[]`). Se actualizan desde cliente tras cada partido — fuente de divergencia si el cliente falla parcialmente.
- `events.equipo_a TEXT[]` / `equipo_b TEXT[]` y `badges TEXT[]` guardan IDs/keys como arrays. Funcional, pero con algunos riesgos (no integridad referencial sobre elementos del array, no índices útiles de intersección sin GIN).

### 🟢 Fortalezas

- Esquema pequeño (10 tablas), nombres claros, relaciones `ON DELETE CASCADE` bien puestas.
- Checks declarativos en BD (`status IN ('si','no','quiza')`, `ataque BETWEEN 1 AND 5`, `porteria_cero >= 0`). Prevenciones donde cuentan.
- Índices correctos para los accesos comunes (por `community_id`, `event_id`, `player_id`, `fecha`).

### 🔴 Gaps

1. **Denormalización sin reconciliación** — si cliente crashea a mitad de finalizar partido, `players.goles` queda desincronizado respecto a la suma de `match_players.goles` del mismo jugador.
2. **Sin `updated_at`** en la mayoría de tablas (solo `confirmations` lo tiene). Auditoría y debug costoso.
3. **`events.equipo_a[] / equipo_b[]`** duplica información que ya está en `match_players.equipo` (columna 'A'/'B'). Dos fuentes de verdad.
4. **Sin `soft delete`**: un admin borra un evento y se pierde irrecuperable (cascada).
5. **Ausencia de `reliability` / derived stats** — toda métrica se recalcula cliente. Con 500 partidos por comunidad el coste de recompute sube.
6. **PKs TEXT** (uuid-as-text) ocupan más que UUID nativo (~2×). Detalle menor hoy, no menor a escala.
7. **Sin particionado ni TTL** en tablas de historia (`mvp_votes`, `confirmations`) — crecerán indefinidamente.
8. **`public.users` tiene `role`** además de `admin_ids` en `communities`. Dos lugares para "soy admin de X". Invita a divergencia.

### ✨ Propuestas

- **P0 · Vista materializada (o trigger) para `players_stats_computed`** `@db` ⚙️
  Recalcular desde `match_players` la verdad de stats agregadas. Dos opciones:
  - **Vista materializada** refrescada por trigger tras `INSERT` en `match_players` (más simple).
  - **Trigger directo** que mantenga `players.*` sincronizado con cada insert/update/delete.
  Resuelve deuda de denormalización sin cambiar la API. **Elegir 1 enfoque y no ambos**.

- **P0 · `updated_at` + `updated_by` en todas las tablas mutables** `@db` ⚙️
  Trigger genérico `set_updated_at()`. Auditoría nacida gratis, base para el audit log.

- **P1 · Eliminar duplicación `events.equipo_a/b` → derivar de `match_players.equipo`** `@db` ⚙️
  La fuente de verdad son las filas de `match_players` (una por jugador-partido). Los arrays en `events` son cacheados del split "antes del partido". Opciones:
  - Mantenerlos como "split propuesto" y renombrarlos (`proposed_team_a/b`).
  - O quitarlos y derivar ambos usos (previa y final) de `match_players`.
  Recomendado: **renombrar a `proposed_team_*`** y documentar que la autoridad post-partido es `match_players`.

- **P1 · `deleted_at` (soft delete) en eventos y jugadores** `@db`
  Columna nullable + vistas `events_active` / `players_active`. Los admins pueden "archivar" en vez de borrar, y el historial se preserva.

- **P1 · `communities.admin_ids` como única fuente de admins** `@db` 🔒
  Dejar obsoleto `comm_admin_id` (mantener por back-compat 1-2 meses con trigger que lo propague al `admin_ids[0]`) y basar RLS/checks solo en `admin_ids`. Unifica el modelo.

- **P2 · Migrar PKs a `UUID` nativo** `@db` ⚙️
  Coste: no trivial (foreign keys, arrays, clientes). Beneficio real solo a gran escala. Hoy **no hacer**.

- **P2 · Índices GIN sobre arrays** (`equipo_a`, `badges`, `admin_ids`) `@db` ⚙️
  Solo si aparecen consultas por pertenencia a array en caliente. Hoy no hay evidencia. Lo dejo marcado.

- **P2 · Particionado de `mvp_votes` / `confirmations` por `created_at`** `@db` ⚙️
  No antes de ~100k filas por tabla. Lo dejo marcado.

---

## 3. Row Level Security (RLS) y autorización

**Estado actual**: prácticamente **todas las tablas de dominio tienen RLS habilitado con `public_all` (USING true / WITH CHECK true)**. Lo confirman [005_fix_communities_rls.sql](../../supabase/migrations/005_fix_communities_rls.sql) y [006_fix_remaining_rls.sql](../../supabase/migrations/006_fix_remaining_rls.sql), que **revirtieron** las políticas más restrictivas introducidas por [002_users_auth.sql](../../supabase/migrations/002_users_auth.sql) porque rompían flujos en algunos entornos.

> Cita literal del header de [005]: *"en algunos entornos dejó la tabla sin policy de INSERT. Resultado: la creación de comunidades fallaba con RLS (42501). (…) restauramos el régimen permisivo equivalente al de las demás tablas del schema base."*

Esto significa que **cualquier cliente con la `anon_key`** puede:
- Leer y escribir en `communities`, `players`, `pistas`, `events`, `confirmations`, `match_players`, `votes`, `mvp_votes`, `push_subscriptions`.
- Borrar filas libremente (las políticas permiten DELETE).
- Leer/escribir avatars (policies también permisivas).

Solo `public.users` tiene RLS restrictivo real (por `auth.uid()`).

### 🟢 Fortalezas

- Migraciones 005/006 tienen **headers explícitos** documentando el porqué de la reversión (decisión consciente, no accidente). Buena disciplina.
- La `anon_key` es pública por diseño — no es una filtración. El riesgo está en las **políticas**, no en la clave.

### 🔴 Gaps — críticos

1. 🔒 **Cualquier visitante puede borrar toda la comunidad ajena**. Un actor con la `anon_key` (visible en bundle) puede ejecutar `delete from events where community_id = '...'` y nada lo impide.
2. 🔒 **Un jugador puede inflarse stats** (`update players set goles=999`) sin nada que lo frene.
3. 🔒 **Un jugador puede votar por otros** (`insert into votes with voter_id=<ajeno>`) — el balanceador colapsa.
4. **La promoción a admin es puramente cliente**: `admin_ids[]` es un `UPDATE` sin validación.
5. **Avatars**: cualquiera puede subir/borrar avatars de cualquiera. Vector de trolling claro.
6. Sin **rate-limit** a nivel PostgREST — bruteforce de PINs (10k combinaciones) por API directa es factible.

### ✨ Propuestas

Este es el **ámbito crítico del backend**. Sin resolver nada de §14 puede salir a producción con confianza.

- **P0 · Plan de migración a RLS por `auth.uid()` + `public.users`** `@rls` 🔒
  El stub está hecho (mig 002 creó `public.users` + helpers `get_user_community_id()` / `get_user_role()`). Toca:
  1. Garantizar que **todo login** crea `auth.user` anónimo y escribe `public.users` (ya lo hace [session.ts#L29-L39](../../src/stores/session.ts) — verificar 100% casos).
  2. Re-escribir políticas tabla a tabla:
     - `communities`: `SELECT` público (para landing de PINs / descubrimiento), `INSERT` libre, `UPDATE`/`DELETE` solo si `public.get_user_role() = 'admin' AND id = public.get_user_community_id()`.
     - `players`: `SELECT` restringido a `community_id = public.get_user_community_id()`. `INSERT` libre solo para la propia identidad (creación al login). `UPDATE` solo sobre el propio `players.id = public.users.player_id` o siendo admin de esa comunidad. `DELETE` solo admin.
     - `events`, `confirmations`, `match_players`, `mvp_votes`, `votes`, `pistas`, `push_subscriptions`: todas `community_id` derivado vs `get_user_community_id()`.
  3. **Probar** con un script (2-3 test users anónimos) que las escrituras cruzadas fallan.
  4. Solo entonces **dropear `public_all`** en orden inverso (votes, match_players, confirmations, events, pistas, players, communities).

  ⚠️ **Hacerlo en staging**, con tests, antes de tocar prod. El ciclo 002 → 005/006 demuestra el riesgo de hacerlo a pelo.

- **P0 · Capa de Edge Functions para escrituras críticas** `@rls` 🔒 ⚙️
  Alternativa (o complemento) a RLS fina: las operaciones peligrosas (finalizar partido, modificar stats, promover admin, cambiar PIN) **no** se invocan desde cliente directo → pasan por Edge Function con `service_role_key` y la función valida caller. Esto pone el checkpoint en un solo sitio (el código Deno), mucho más fácil de auditar que políticas dispersas.
  **Recomendación**: combinarlo. RLS básica que bloquee escritura sin auth. Edge Function para operaciones de dominio críticas.

- **P1 · Rate-limit a nivel Edge Function** `@rls` 🔒
  Middleware simple en las funciones que cachee por IP (o por `auth.uid`) y devuelva 429 si pasa `N` reqs/min. Supabase no trae rate-limit de API por defecto.

- **P1 · Revocar `anon` sobre tablas de escritura crítica** `@rls` 🔒 ⚙️
  Cuando las Edge Functions encapsulen dominio, revocar `INSERT/UPDATE/DELETE` en `anon` sobre `events`, `match_players`, `players.xp`, `players.badges`. Solo `service_role` (desde Functions) puede tocarlas.

- **P2 · Helpers adicionales en SQL** `@rls` ⚙️
  `is_admin_of(community_id)` reutilizable en políticas. Evita repetir `EXISTS (SELECT 1 FROM communities WHERE id = ... AND auth.uid() = ANY(admin_ids))` en cada policy.

---

## 4. Autenticación (PIN + Supabase Auth anónima)

**Archivos**: [src/lib/supabase/auth.ts](../../src/lib/supabase/auth.ts), [src/stores/session.ts](../../src/stores/session.ts), [src/app/page.tsx](../../src/app/page.tsx), mig [002_users_auth.sql](../../supabase/migrations/002_users_auth.sql).

**Flujo actual**:

1. Usuario escribe PIN de comunidad (o crea comunidad con PIN) → `login()` en zustand.
2. `login()` dispara `signInAnonymously()` (fire-and-forget) → crea `auth.users` anónimo + `public.users` bridge.
3. `session` persiste en `localStorage` con clave `furbito-session`.
4. Admin PIN global (`NEXT_PUBLIC_ADMIN_PIN`) permite escalada a `role='admin'`.

### 🟢 Fortalezas

- Flujo cero-fricción: el usuario no conoce Supabase Auth — para él solo hay PINs.
- `signInAnonymously` **sí** se está usando (contra lo que uno esperaría): detrás de los PINs hay un `auth.user` real. Base limpia para RLS fina.

### 🔴 Gaps

1. 🔒 **El anon auth se hace fire-and-forget** ([session.ts#L32-L40](../../src/stores/session.ts)) — si falla, la app sigue funcionando sin `auth.user`. Significa que las políticas RLS estrictas basadas en `auth.uid()` también fallarán silenciosamente.
2. 🔒 **`NEXT_PUBLIC_ADMIN_PIN` viaja al bundle**. Cualquier inspección del JS lo revela. Cualquiera puede hacerse admin de cualquier comunidad si adivina el PIN concreto.
3. 🔒 **No hay `reauthentication`** para acciones destructivas (borrar evento, cambiar admin). Un móvil abierto robado = comunidad comprometida.
4. 🔒 **Tokens de `auth.users` anónimos** no caducan fácilmente — si alguien se apodera del `localStorage`, tiene la sesión hasta que el JWT expire (default ~1h, pero con refresh que rueda).
5. **Ausencia de `password` / `email`** elimina la posibilidad de recuperar acceso. Ya capturado como P0 en [FEATURE_AUDIT.md §1](FEATURE_AUDIT.md#1-autenticación-y-acceso) — aquí repito solo el componente backend: se necesita una columna `recovery_key_hash` en `players` y un endpoint que intercambie `recovery_key → player_id + auth anónimo nuevo`.

### ✨ Propuestas

- **P0 · Bloquear login hasta que `signInAnonymously` complete** `@auth` 🔒
  Convertir el fire-and-forget en `await` con timeout de 5s. Si falla, mostrar error, no loguear. Sin esto la RLS no funciona.

- **P0 · Mover admin PIN a columna `communities.admin_pin_hash`** `@auth` 🔒
  `bcrypt`-hash server-side (trigger + función que solo acepta set vía admin ya autenticado). El cliente envía el PIN plano → Edge Function `promote-admin` lo compara. Rotación permitida. Elimina el `NEXT_PUBLIC_*`.

- **P1 · Recovery key** `@auth`
  Columna `recovery_key_hash` en `players`. Pantalla de recovery → Edge Function verifica y devuelve un magic-link interno (o crea un nuevo `auth.user` anónimo y lo mappea al `player_id`).

- **P1 · Re-auth para acciones destructivas** `@auth` 🔒
  Modal "introduce el PIN de la comunidad de nuevo" antes de: borrar evento, cambiar `admin_ids`, cambiar PIN de la comunidad, eliminar jugador.

- **P2 · Session rotation tras cambios sensibles** `@auth` 🔒
  Cambio de admin → `supabase.auth.refreshSession()` + invalidar tokens viejos.

---

## 5. Edge Functions

**Archivos existentes**:
- [supabase/functions/send-push/index.ts](../../supabase/functions/send-push/index.ts) (Deno, `web-push` npm) — envía push a `community_id` o `target_player_id`.
- [supabase/functions/send-reminders/index.ts](../../supabase/functions/send-reminders/index.ts) — recorre eventos en ventana `NOW+23h..NOW+25h`, envía recordatorio y marca `reminder_sent_at`.

### 🟢 Fortalezas

- Código **legible, pequeño y con logging estructurado**. `send-push` responde con `{total, targeted, sent, failed, removed}` — trazable.
- **Auto-limpieza de endpoints muertos** (status 404/410 → DELETE de la suscripción). Previene envíos a endpoints fantasma que la mayoría de implementaciones no limpia.
- `preferences` por usuario ya está respetado (`prefs[type] === false` filtra al destinatario).

### 🔴 Gaps

1. **Solo existen 2 funciones**. Todo el resto de la lógica (finalizar partido, detectar badges, actualizar stats) está en cliente → duplicado al migrar a nativa + hackeable.
2. **Ventana de `send-reminders`** es `+23h..+25h`. Si el cron se salta una ejecución (down) el recordatorio se pierde. No hay "catch-up".
3. **Duplicación de código VAPID** entre las 2 funciones (setup idéntico) — deuda si añadimos más.
4. **CORS totalmente abierto** (`'Access-Control-Allow-Origin': '*'`) — aceptable para `send-push` invocado desde varios orígenes, dudoso para operaciones críticas.
5. Sin **idempotencia key** en escrituras. Si el cliente reintenta una finalización de partido, los stats se duplican.
6. Sin **pruebas automatizadas**. Coste de cambio sube con cada nueva función.

### ✨ Propuestas

- **P0 · Edge Function `finalize-match`** `@edge` 🔒
  Input: `{event_id, golesA, golesB, match_players[]}`. La función:
  1. Valida que `auth.uid()` es admin de la comunidad del evento.
  2. En transacción: inserta `match_players` (idempotente), marca `events.finalizado`, actualiza `players.*` agregados, corre `detectBadges` server-side (ver P0 siguiente), emite push `match_finished` + `badge_earned`.
  3. Devuelve breakdown (stats ganadas, badges nuevos).
  Blindada contra doble-click y contra clientes manipulados.

- **P0 · Portar `src/lib/game/` a Edge / compartido** `@edge` ⚙️
  `badges.ts`, `scoring.ts`, `levels.ts`, `teams.ts`, `mvp-finalize.ts` son puros. Extraerlos a un paquete `shared/` que web, nativa y Edge importen idéntico. Sin esto, RN repite el código y server y cliente divergen.

- **P0 · Edge Function `submit-vote`** `@edge` 🔒
  Input: `{voted_id, ataque, defensa, tecnica, velocidad, empeno}`. Valida `voter_id = public.users.player_id` (impide votar suplantando), valida `voted_id` en la misma comunidad, upserta en `votes`.

- **P1 · Edge Function `cast-mvp-vote` / `close-mvp`** `@edge` 🔒
  Mismo patrón. `close-mvp` aplica `finalizeMvpByVotes` server-side y emite push al elegido.

- **P1 · `send-weekly-digest` cron dominical** `@edge`
  Viene como P0 en [FEATURE_AUDIT §15](FEATURE_AUDIT.md#15-notificaciones-push--recordatorios). Itera comunidades activas, arma resumen, envía push. Tras implementarla, añadir tabla `weekly_digests(community_id, week_start, summary_json)` para registro.

- **P1 · `send-reminders` con catch-up y dedupe** `@edge` ⚙️
  Ampliar ventana a `NOW..NOW+25h` y confiar en `reminder_sent_at` para dedupe. Sobrevive una caída del cron.

- **P2 · Shared utilities entre funciones** `@edge` ⚙️
  Crear `supabase/functions/_shared/vapid.ts`, `_shared/supabase.ts`. Deno permite importar así sin bundler. Elimina duplicación.

- **P2 · Test harness** `@edge` ⚙️
  `deno test` + un script `supabase functions serve` local para smoke tests. Invertir 4h, ahorra días de debugging en prod.

---

## 6. Realtime

**Estado**: cada hook (`useEvents`, `useEvent`, `usePlayers`, `useVotes`) abre su propio canal con filtros por `community_id` / `event_id` y **refetcha todo** en cada cambio.

Patrón tipo en [useEvents.ts#L33-L42](../../src/hooks/useEvents.ts):

```ts
supabase.channel(`events:${communityId}`)
  .on('postgres_changes', { event: '*', table: 'events', filter: `community_id=eq.${communityId}` }, () => load())
  .on('postgres_changes', { event: '*', table: 'confirmations' }, () => load())
  .subscribe()
```

### 🟢 Fortalezas

- **Simple, correcto y trivial de razonar**: refetch completo = consistencia siempre.
- Realtime habilitado por `community_id` evita broadcast masivo entre comunidades.

### 🔴 Gaps

1. **Refetch completo por cada cambio**. Una confirmación de un jugador re-fetcha todos los eventos, todas las pistas embebidas, todas las confirmaciones. Con 50 eventos × 20 jugadores × PostgREST que hace join con 4 tablas → payload grande y frecuente.
2. **`confirmations` listener sin filtro de `community_id`** — cada cambio de confirmación de cualquier comunidad dispara `load()` en ese cliente. RLS filtra la lectura, pero el callback sigue disparándose. Hoy el impacto es pequeño; a escala es ruido continuo.
3. **No hay compartición de canal** — dos hooks que observen `players` abren dos canales distintos.
4. **Sin reconexión consciente** — si el WS cae, no hay banner ni resync garantizado (aunque la librería intenta reconectar).
5. Supabase tiene **quota de mensajes Realtime/mes**. Con refetch completo no hay control de explosión.

### ✨ Propuestas

- **P1 · Filtrar `confirmations` por community vía join** `@realtime` ⚙️
  Postgres Realtime solo filtra por columna del propio registro — `confirmations` no tiene `community_id`. Opciones:
  - Añadir columna redundante `community_id` en `confirmations` (trigger que la rellene desde el `event_id`) → permite filtrar.
  - Crear canal por `event_id` en el hook de detalle y desechar el listener de `confirmations` en la lista.
  La primera es más quirúrgica.

- **P1 · Delta-apply en hooks críticos** `@realtime` ⚙️
  Usar `payload.new`/`payload.old` para mutar el estado local sin refetch. Cuesta lógica extra pero reduce tráfico 60-80%. Recomendado primero en `useEvents` (que tiene joins pesados).

- **P1 · Indicador de conexión en Header** `@realtime`
  Sub-estado del cliente Supabase ("connected/reconnecting"). Chip visible. Crucial en campo con mala cobertura.

- **P2 · Canal compartido por comunidad** `@realtime` ⚙️
  Un singleton que escucha `community:{cid}` y distribuye eventos a suscriptores in-memory. Hoy sobra, a escala ayuda.

---

## 7. Storage (avatars)

**Archivos**: [supabase/migrations/007_avatars_storage.sql](../../supabase/migrations/007_avatars_storage.sql), [src/lib/supabase/avatars.ts](../../src/lib/supabase/avatars.ts).

**Comportamiento**:
- Bucket `avatars` público, 2 MB max, tipos JPEG/PNG/WebP.
- Path: `{community_id}/{player_id}.jpg` (sobreescribible con `upsert: true`).
- Cliente redimensiona a 512×512 + JPEG calidad 0.85 antes de subir.
- Cache-busting con `?v=<timestamp>` al guardar.
- Policies `avatars_public_*` **totalmente permisivas** (cualquiera puede subir/sobreescribir/borrar cualquiera).

### 🟢 Fortalezas

- Pre-procesado client-side ahorra bandwidth/storage y normaliza dimensiones.
- Cache-busting con query param resuelve el problema clásico de "subí foto nueva pero se ve la vieja".
- Path jerárquico `{cid}/{pid}` deja puerta abierta a limpieza por comunidad.

### 🔴 Gaps

1. 🔒 **Un usuario puede sobreescribir el avatar de otro**. Vector trolling claro. Ya señalado en comentario de la migración: *"Cuando migres a Auth real, restringir con owner = auth.uid()."*
2. **Sin moderación** ni hash-lookup para evitar contenido inapropiado.
3. **Sin versionado** — si alguien sube una foto inapropiada y se sobreescribe, se pierde evidencia.
4. **2 MB límite** es generoso para avatars 512×512 (a 0.85 salen ~50-100 KB). Podría bajar a 300 KB para dar margen a otros buckets.
5. **Solo un bucket**. Cuando haya badges compartibles, evidencias de gol, etc., no hay estrategia de buckets.

### ✨ Propuestas

- **P0 · Restringir `INSERT/UPDATE/DELETE` en `avatars` a `owner`** `@storage` 🔒
  Policy:
  ```sql
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = public.get_user_community_id()
   AND (split_part(name, '/', 2) = (auth.uid() || '.jpg') OR public.get_user_role() = 'admin'))
  ```
  (Adaptar: hoy `name` es `{cid}/{pid}.jpg` donde `pid` ≠ `auth.uid()`; hace falta resolver `player_id` vs `auth.uid()` vía `public.users`.)
  Imposible con la identidad puramente cliente — **requisito previo**: P0 de §4 (bloquear login hasta auth anónimo confirmado).

- **P1 · Bucket adicional `shares` para tarjetas generadas** `@storage`
  PNG/Webp de "mi mejor partido", "badge obtenido", "equipos del día" → subibles y compartibles vía URL. Genera viralidad (MARKETING_PLAN Fase 2-3).

- **P2 · Upload al bucket `avatars_pending`** `@storage` 🔒
  Si quieres moderación: los avatars nuevos caen a `avatars_pending`, un admin de la comunidad aprueba → se mueven a `avatars`. Opt-in por comunidad. Overkill para la mayoría, útil para comunidades grandes.

---

## 8. Cron / jobs programados

**Estado**: solo [send-reminders](../../supabase/functions/send-reminders/index.ts), programado via `pg_cron` + `pg_net` en [mig 003](../../supabase/migrations/003_push_reminders_cron.sql), cada hora en el minuto `:05`, invocando `/functions/v1/send-reminders` con el `service_role_key`.

### 🟢 Fortalezas

- Decisión correcta: `pg_cron` nativo evita dependencias externas (GitHub Actions, Upstash, etc.).
- Minuto `:05` para evitar colisión en `:00` con otros jobs.
- `reminder_sent_at` como dedupe previene spam si el cron dispara dos veces.

### 🔴 Gaps

1. **Un solo job** existe. Añadir otro requiere duplicar el bloque DO + hardcodear el nombre.
2. **No hay monitorización**: si el cron se cae no hay alerta. Se descubre cuando los usuarios se quejan.
3. **`app.settings.edge_url` y `app.settings.service_role_key`** son `current_setting` — se pierden si se resetea el proyecto. No en git.
4. **Sin DLQ**: si la Edge Function falla, `pg_net.http_post` no reintenta.

### ✨ Propuestas

- **P0 · Monitorización de cron** `@cron` ⚙️
  Tabla `cron_runs(job_name, started_at, ok, meta)`. Cada Edge Function llamada por cron inserta fila al empezar + update al terminar. Una query `where started_at > NOW() - '2h'` dice si el job está vivo. Panel admin → row verde/rojo.

- **P1 · Añadir jobs**: `send-weekly-digest` (dom 20h), `recompute-player-stats` (4am diario, reconcilia denormalización), `archive-inactive-communities` (1/semana), `cleanup-expired-auth-users` (anónimos abandonados) `@cron`

- **P1 · Documentar `app.settings.*` en un snippet reejecutable** `@cron` ⚙️
  Fichero `supabase/setup_cron_settings.sql` con `ALTER DATABASE SET ...` parametrizado, que se reejecuta al cambiar de proyecto Supabase. Evita olvidos.

- **P2 · Alert externo (webhook a Slack/email)** `@cron`
  Si un job lleva >2h sin ejecutarse correctamente, dispara alerta. Usar `cron_runs` + otro cron corto que lo chequee. O Supabase Webhooks.

---

## 9. Capa cliente ↔ Supabase

**Archivos**: [src/lib/supabase/client.ts](../../src/lib/supabase/client.ts), [src/lib/supabase/server.ts](../../src/lib/supabase/server.ts), hooks en `src/hooks/*`, [src/stores/session.ts](../../src/stores/session.ts).

**Patrón**:
- `createClient()` en cada hook (browser client via `@supabase/ssr`).
- Queries crudas de PostgREST con `.select(...)`, `.insert(...)`, `.update(...)`.
- Embeddings (`events(pista:pistas(*), confirmations(*,player:players(*)), match_players(*,player:players(*)), mvp:players!fk(*))`).

### 🟢 Fortalezas

- Embeddings de PostgREST usan bien los joins declarados → una request trae todo.
- Separación `browser` vs `server` clients es correcta para Next.js.

### 🔴 Gaps

1. Cada hook **crea su propio client** → varias instancias, sin reuso de cache.
2. **Sin react-query / swr**: estado derivado en `useState`, refetch manual. Resultado: condiciones de carrera, sin dedupe, sin stale-while-revalidate.
3. **Strings de query largos duplicados** (los embeds se repiten en `useEvents` y `useEvent`). Mantener cambios en sync es frágil.
4. **Sin tipado generado** desde el schema. Tipos en [src/types/index.ts](../../src/types/index.ts) son escritos a mano — derivarán con las migraciones.
5. **Logs de errores silenciosos** (`console.error` + continuar). Sin Sentry/equivalente, se pierden.

### ✨ Propuestas

- **P1 · `supabase gen types typescript`** `@client` ⚙️
  Script `npm run types:generate` que regenera `src/types/database.ts` desde el schema. Eliminar tipos manuales redundantes. Detecta drift en CI.

- **P1 · `@tanstack/react-query` + realtime invalidator** `@client` ⚙️
  Cachea queries, dedupe, stale-while-revalidate. Realtime solo invalida la key correspondiente → se refetchea lo mínimo. Compatible con el patrón de refetch actual (migración progresiva).

- **P1 · Centralizar query strings** `@client` ⚙️
  `src/lib/queries/events.ts` exporta `EVENT_EMBED = '*, pista:pistas(*), ...'`. Un solo sitio que tocar.

- **P1 · Client singleton o context** `@client` ⚙️
  `src/lib/supabase/provider.tsx` vía React Context + un client por página. Evita N instances.

- **P2 · Logger con niveles** `@client` ⚙️
  Reemplazar `console.*` por un `logger` que en prod vaya a Sentry/GlitchTip. Niveles: `debug/info/warn/error`. Ver §11.

---

## 10. Migraciones y versionado

**Estado**: 8 archivos SQL numerados en `supabase/migrations/` + un `schema.sql` que intenta ser fuente de verdad inicial. Dos de las migraciones (005, 006) son **rollbacks** de cambios introducidos por 002.

### 🟢 Fortalezas

- Convención de numeración (`00N_description.sql`) y comentarios de cabecera claros — cualquiera entiende el porqué leyendo el archivo.
- Migraciones 005 y 006 documentan explícitamente el motivo del rollback (disciplina excepcional).

### 🔴 Gaps

1. **Sin `supabase-cli` workflow**: no hay `seed.sql`, no hay `supabase db diff`, no hay forma objetiva de reproducir la BD desde cero y asegurar que `schema.sql + 001..008` converge al estado prod.
2. **`schema.sql` y las migraciones pueden divergir**: el schema tiene políticas `public_all` originales; tras 002 + 005/006 vuelven a ser `public_all`, pero `public.users` + helpers de 002 no están en `schema.sql`.
3. **Sin CI** que ejecute migraciones en una BD efímera y valide.
4. **Historial de rollbacks no lineal**: el ciclo 002 → 005 → 006 indica que falta un proceso de review antes de aplicar.
5. **No hay script de "resetear entorno de dev desde cero"**.

### ✨ Propuestas

- **P0 · Adoptar Supabase CLI local** `@migrations` ⚙️
  ```bash
  supabase init
  supabase start       # Postgres + PostgREST + Realtime locales
  supabase db reset    # aplica migraciones a local
  supabase db diff --schema public # vs actual prod
  ```
  Fundamental antes de crecer.

- **P0 · Reescribir `schema.sql` como snapshot generado** `@migrations` ⚙️
  Dejar de mantener a mano. `supabase db dump` tras cada migración merged. `schema.sql` es **resultado**, no fuente.

- **P1 · CI con migraciones** `@migrations` ⚙️
  GitHub Action que hace `supabase start` + aplica migraciones + corre smoke queries. Rechaza PR si las migraciones no aplican limpio.

- **P1 · Seed para dev/test** `@migrations`
  `seed.sql` con 1 comunidad de ejemplo, 10 jugadores, 5 eventos (2 finalizados), 30 confirmaciones, 50 votos. Desarrollar sobre datos reales sin ensuciar prod.

- **P2 · Proceso de review para migraciones riesgosas** `@migrations`
  Checklist en PR: "¿hay rollback?", "¿probado en staging?", "¿afecta a RLS?". Evita repetir el 002→005.

---

## 11. Observabilidad, logs y errores

**Estado actual**: **nada propio**. Supabase Dashboard ofrece logs básicos (Postgres, API, Edge Functions) y Vercel sus logs serverless. No hay APM ni aggregator.

### 🟢 Fortalezas

- Los Edge Functions **loguean de forma estructurada** (`console.log('[send-push] type=... sent=...')`) → legible en el Dashboard.
- `supabase.functions.invoke` en cliente tiene error con mensaje ([notification-service.ts#L59](../../src/lib/notifications/notification-service.ts)) — se loguea localmente.

### 🔴 Gaps

1. **No hay error tracking** en cliente. Un crash en prod desaparece salvo que el usuario lo reporte.
2. **No hay métricas de producto**. ¿Cuántos partidos se crean / finalizan / por comunidad? Solo lo sabemos con SQL manual.
3. **Los logs de Supabase no son queryables a largo plazo** (retención limitada según plan).
4. **No hay tracing** request → function → DB.
5. El **error recovery** del cliente es `console.error` + seguir. Silencioso.

### ✨ Propuestas

- **P0 · Sentry (o GlitchTip self-hosted)** `@obs`
  SDKs oficiales para Next.js + Deno Edge Functions. 30 min de setup. Detecta el 90% de los errores antes que los usuarios.

- **P0 · Plausible / Umami para analytics de funnel** `@obs`
  Ya propuesto en [FEATURE_AUDIT §19](FEATURE_AUDIT.md#19-observabilidad-seguridad-y-admin-tooling). Instrumentar: landing → PIN → crear comunidad → primer partido → primer resultado.

- **P1 · Dashboard "operaciones" en `/admin`** `@obs`
  Gráficos básicos: comunidades activas últimos 30d, partidos/semana, push entregados. Queries desde la UI admin — útil para fundador + cerca del hard launch.

- **P1 · Log aggregator de Edge Functions** `@obs`
  Opcional: forward de logs a Axiom / Better Stack. Retención y query sobre `[send-push]` etc. Solo si Supabase Dashboard resulta insuficiente (probablemente sí a partir del mes 3-6).

- **P2 · Synthetic monitoring** `@obs`
  Cron que cada 5 min verifica: login de test, crear evento, ver ranking. Si falla, alerta. Detecta caídas antes que los usuarios.

---

## 12. Costes, cuotas y escalado

**Supabase Free Tier (orientativo)**:
- 500 MB DB · 1 GB egress · 50k MAU auth · 2 GB bandwidth Storage · 500k invocations Edge · 200 concurrent Realtime · 2M msg Realtime/mes.
- **Pro**: $25/mes — 8 GB DB · 250 GB egress · 100k MAU · 100 GB Storage · 2M invocations · 500 concurrent Realtime.

**Uso previsible** (con el plan de marketing en mano):
- Fase soft-launch (beta ~100-200 usuarios, ~10-20 comunidades): **Free tier sobra**.
- Fase hard-launch (~1-3k MAU, 50-200 comunidades): **Pro con holgura**.
- Fase growth (~10k MAU): **Pro + tweaks** (particionado, índices). No cambio de proveedor.

### 🔴 Gaps

1. **Realtime es la primera quota en caer** con el refetch completo (§6). Cada confirmación en una comunidad de 20 personas con la app abierta = 20 mensajes.
2. **Storage de avatars** crece linealmente con jugadores. 1000 jugadores × 80 KB = ~80 MB — irrelevante hoy, no en 3 años.
3. **DB egress en Realtime** es donde habrá que vigilar. Los JOIN pesados via refetch son el vector.
4. **No hay alertas de cuota** configuradas (probablemente).

### ✨ Propuestas

- **P0 · Configurar alertas de cuota en Supabase Dashboard** `@cost`
  Email al fundador al 70% / 90% de cualquier recurso. 5 min de setup.

- **P1 · Delta-apply (§6)** baja egress Realtime ~60-80% → **elimina el bottleneck de quota Realtime**.

- **P1 · Lifecycle de avatars** `@cost`
  Si `players.avatar` apunta al bucket y el jugador se borra (cascade), el objeto no se elimina. Trigger `AFTER DELETE ON players` que haga `storage.delete`. Evita que el bucket engorde con huérfanos.

- **P2 · Política de retención** `@cost`
  `mvp_votes` y `confirmations` de eventos >2 años → archivar a tabla `*_archive` comprimida o eliminar. Solo si el volumen empieza a pesar.

---

## 13. Backup, recuperación y GDPR

**Estado actual**:
- Supabase Pro incluye **PITR** (Point-In-Time Recovery) últimos 7 días.
- Storage tiene versioning opcional (no habilitado).
- **No hay export manual propio** ni política documentada.
- Web app no muestra política de privacidad ni términos.

### 🔴 Gaps

1. **PITR sin probar**: tener PITR ≠ saber restaurar. Sin rehearsal, cuando pase el accidente real habrá pánico.
2. **Sin backup independiente**: todos los huevos en Supabase. Si algo raro pasa con la cuenta, el backup también.
3. **GDPR**:
   - Sin "descargar mis datos" (derecho a portabilidad).
   - Sin "borrar mi cuenta" real (borrar `players` deja `votes` huérfanos por `ON DELETE SET NULL` — razonable — pero no está explicitado al usuario).
   - Sin consentimiento explícito ni cookie banner (push notifications requieren permiso ya, pero hay más).
   - Sin política de privacidad ni términos enlazados desde la app.

### ✨ Propuestas

- **P0 · Rehearsal de PITR en staging** `@gdpr` ⚙️
  Borrar una tabla intencionalmente en staging, restaurar. Documentar el paso-a-paso en `DOCS/RUNBOOK_RECOVERY.md`. Coste: 1 tarde. Evita catástrofe.

- **P0 · Política de privacidad + términos publicados** `@gdpr` 🔒
  Páginas `/privacy` y `/terms` enlazadas desde landing + Ajustes. Requisito para stores (iOS y Google Play) — sin esto, rechazo garantizado. También requisito GDPR.

- **P1 · "Descargar mis datos" en Ajustes** `@gdpr`
  Edge Function que reúne todo del usuario (players, confirmations, match_players, votes dados y recibidos, mvp_votes, push_subscriptions) → JSON firmado al email o descargable. Cumplimiento + diferenciador.

- **P1 · "Borrar mi cuenta"** `@gdpr` 🔒
  Acción destructiva en Ajustes. Borra `players` (cascade lleva confirmations, match_players, mvp_votes). Anonymize `votes` (ya es `voter_id ON DELETE SET NULL` — bien). Marca `push_subscriptions` delete. Doble confirmación.

- **P1 · Backup externo semanal** `@gdpr` ⚙️
  Edge Function domingo 4am: `pg_dump` de tablas críticas (communities, players, events, match_players, badges) → cifrar con GPG → subir a un S3 externo (Cloudflare R2 barato). Resguardo si Supabase desaparece.

- **P2 · DPIA simplificada** `@gdpr`
  Documento breve (`DOCS/DPIA.md`) listando: qué datos procesas, base legal, retención, transferencias internacionales (Supabase → Frankfurt? verificar región), derechos. Necesario si vas a comunidades deportivas con menores de edad.

---

## 14. Seguridad — cross-cutting

Compila riesgos de §3, §4, §7, §8 en un mapa ejecutable.

| # | Riesgo | Severidad | Mitigación |
|---|--------|-----------|------------|
| S1 | Cualquier cliente con anon_key puede borrar cualquier tabla de dominio | 🔴 Crítico | RLS fina (§3 P0) + Edge Functions (§5 P0) |
| S2 | `NEXT_PUBLIC_ADMIN_PIN` en bundle | 🔴 Crítico | Mover a `admin_pin_hash` por comunidad (§4 P0) |
| S3 | `signInAnonymously` fire-and-forget → RLS no funciona | 🔴 Crítico | `await` + error bloquante (§4 P0) |
| S4 | Avatars sobrescribibles por cualquiera | 🟠 Alto | Policy owner-only (§7 P0) |
| S5 | Sin rate-limit → bruteforce PIN | 🟠 Alto | Rate-limit en Edge Function (§3 P1) |
| S6 | Stats/badges manipulables desde cliente | 🟠 Alto | `finalize-match` Edge Function (§5 P0) |
| S7 | Votos falseables (`voter_id` del cliente) | 🟠 Alto | `submit-vote` Edge Function (§5 P0) |
| S8 | CORS `*` en Edge Functions | 🟡 Medio | Whitelist dominios (furbito.app + native custom scheme) |
| S9 | No hay política de privacidad ni términos | 🟠 Alto (legal) | Publicarlas (§13 P0) |
| S10 | Sin MFA ni re-auth en acciones destructivas | 🟡 Medio | Re-prompt PIN (§4 P1) |

### Resumen

Prioridad **S1 + S2 + S3 + S6 + S7** forman un bloque único: no tiene sentido hacer uno sin los otros, porque todos comparten "o mueves la autoridad al servidor, o cualquiera puede todo". Ataque frontal:

1. **Semana 1** — §4 P0 (bloquear login hasta auth) + §4 P0 (admin PIN a DB).
2. **Semana 2** — §5 P0 (Edge Functions `finalize-match`, `submit-vote`).
3. **Semana 3** — §3 P0 (migración RLS por tabla, con tests).
4. **Semana 4** — §7 P0 (avatars owner-only) + §3 P1 (rate-limit).

Con eso el backend pasa de **juguete funcional** a **producto defendible**.

---

## 15. Top 15 mejoras priorizadas

Ordenadas por ratio "reducción de riesgo / impacto de producto" dividido por esfuerzo.

| # | Prioridad | Tag | Mejora | Por qué |
|---|-----------|-----|--------|---------|
| 1 | P0 | @rls 🔒 | Migración RLS fina por `auth.uid()` + helpers | Cierra el agujero principal — hoy cualquiera puede borrarlo todo |
| 2 | P0 | @edge 🔒 | Edge Function `finalize-match` (+ portar `src/lib/game/` a shared) | Centraliza dominio, blinda stats/badges, habilita nativa |
| 3 | P0 | @edge 🔒 | Edge Function `submit-vote` | Impide suplantación de votante (afecta al balanceador) |
| 4 | P0 | @auth 🔒 | Bloquear login hasta `signInAnonymously` OK | Sin esto, RLS del resto del plan falla silenciosamente |
| 5 | P0 | @auth 🔒 | `admin_pin_hash` por comunidad (elimina `NEXT_PUBLIC_ADMIN_PIN`) | Elimina escalada trivial a admin |
| 6 | P0 | @storage 🔒 | Policies de avatars owner-only | Trolling trivial hoy |
| 7 | P0 | @db ⚙️ | Vista/trigger `players_stats_computed` | Elimina deuda de denormalización sin cambiar API |
| 8 | P0 | @db ⚙️ | `updated_at` + `updated_by` en tablas mutables | Base del audit log, coste bajísimo |
| 9 | P0 | @migrations ⚙️ | Adoptar Supabase CLI + CI de migraciones | Sin esto, el próximo 002→005 es inevitable |
| 10 | P0 | @obs | Sentry + Plausible | Deshace la ceguera total en prod |
| 11 | P0 | @gdpr 🔒 | Política de privacidad + términos publicados | Bloqueo de stores si no, requisito legal |
| 12 | P1 | @realtime ⚙️ | Delta-apply en hooks críticos | Baja egress Realtime ~70%, base para escalado |
| 13 | P1 | @edge | `send-weekly-digest` + `recompute-player-stats` crons | Retención + reconciliación automática |
| 14 | P1 | @client ⚙️ | `supabase gen types typescript` + react-query | Reduce bugs y duplica velocidad de desarrollo |
| 15 | P1 | @gdpr | Descargar/borrar mis datos | Cumplimiento + diferenciador + lista para stores |

---

## Addendum: cómo encadena con los otros docs

- **Antes** de hacer cualquier propuesta P0/P1 de [FEATURE_AUDIT.md](FEATURE_AUDIT.md) que mueva stats o votos (casi todas), hay que resolver S1-S7 de este documento. Si no, cualquier feature nueva abre otro vector.
- La decisión "mover lógica del cliente a Edge Functions" (aquí §5 P0) **desbloquea la nativa**: la app RN/iOS/Android llama al mismo endpoint que la web. Es la clave del [PORTABILIDAD_NATIVA.md](PORTABILIDAD_NATIVA.md).
- El plan de 4 semanas de §14 debería ir **primero** en el war room — antes de cualquier sprint de features.
