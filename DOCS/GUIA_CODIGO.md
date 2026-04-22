# FURBITO — Guía completa del código

> Documento pensado para leerlo de arriba a abajo y salir sabiendo cómo tocar
> cualquier parte del código **sin necesidad de una IA**. Última revisión:
> 2026-04-22 (tras la ronda "cierre marketing").

---

## Índice

1. [Qué es FURBITO](#1-qué-es-furbito)
2. [Stack y por qué cada pieza](#2-stack-y-por-qué-cada-pieza)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Cómo funciona una página en Next.js 14](#4-cómo-funciona-una-página-en-nextjs-14)
5. [Base de datos (Supabase) y realtime](#5-base-de-datos-supabase-y-realtime)
6. [Sesión, roles y autenticación](#6-sesión-roles-y-autenticación)
7. [Página por página](#7-página-por-página)
8. [Componentes](#8-componentes)
9. [Hooks de datos](#9-hooks-de-datos)
10. [Lógica del juego](#10-lógica-del-juego)
11. [Notificaciones push](#11-notificaciones-push)
12. [Estilos, tema y capa de polish](#12-estilos-tema-y-capa-de-polish)
13. [Flujos completos](#13-flujos-completos)
14. [Cómo añadir / modificar cosas (recetas)](#14-cómo-añadir--modificar-cosas-recetas)
15. [Glosario y convenciones](#15-glosario-y-convenciones)

---

## 1. Qué es FURBITO

App web (PWA — se instala en móvil) para organizar partidos de fútbol amateur
con amigos. Cada grupo es una **comunidad**; dentro de la comunidad se gestionan
**jugadores**, **partidos**, **pistas** y **valoraciones**.

Lo que permite hacer:

- **Comunidad cerrada por PIN**: cualquier persona con el PIN ve el contenido;
  para actuar como jugador hay que identificarse con un PIN personal de 4
  dígitos.
- **Partidos con confirmación de asistencia** (sí / quizá / no).
- **Generación automática de equipos** equilibrados por habilidades.
- **Registro de resultado** en 3 pasos: marcador → stats por jugador → resumen.
- **Puntos Furbito por partido** (estilo Comunio): 3 base + 2/gol + 1/asist
  + 2/portería a cero. Se muestran con tiers de color.
- **MVP por voto popular** (24 h): el admin ya no elige MVP, lo decide la votación.
- **XP, niveles (hasta L99) e insignias** con tiers de rareza.
- **Valoración cruzada** entre jugadores (5 habilidades) que alimenta el
  generador de equipos.
- **Mapa de pistas** (Leaflet) con geolocalización.
- **Notificaciones push** (web push) configurables por tipo de evento.
- **Superadmin global** para mantener la plataforma.

---

## 2. Stack y por qué cada pieza

| Pieza | Qué aporta |
|---|---|
| **Next.js 14 (App Router)** | Framework React full-stack. Rutas por carpetas, renderizado híbrido, optimizaciones. |
| **React 18** | UI declarativa por componentes. |
| **TypeScript 5** | Tipado estático → errores antes de ejecutar. Todo `.ts`/`.tsx`. |
| **Supabase** | Postgres gestionado + Auth opcional + Storage + Realtime + Edge Functions. |
| **Tailwind CSS 3** | Estilos utilitarios. Design tokens en `globals.css` vía CSS variables. |
| **Zustand** | Store cliente para la sesión. Ligero, sin provider. Persistido en localStorage. |
| **Leaflet** | Mapas de pistas sin clave de API. |
| **Vercel** | Deploy automático desde `main` (hook del repo de GitHub). |

Versiones exactas en `package.json`. Scripts útiles:

```bash
npm run dev         # servidor local (localhost:3000)
npm run build       # build de producción
npm run type-check  # tsc --noEmit
npm run lint        # next lint
```

---

## 3. Estructura de carpetas

```
FurbitoLabs/
├── src/
│   ├── app/                    ← páginas y rutas (App Router)
│   │   ├── page.tsx            ← Login (gate Nuevo/Existente + Entrar/Crear)
│   │   ├── layout.tsx          ← Layout raíz (fuentes, PWA, metadata)
│   │   ├── globals.css         ← Tokens + utilidades premium (.card, .aura-halo…)
│   │   ├── admin/              ← Superadmin global
│   │   └── [cid]/              ← Todas las rutas de una comunidad
│   │       ├── layout.tsx      ← Header + BottomNav + modal PIN/exit + push prompt
│   │       ├── page.tsx        ← Home de la comunidad
│   │       ├── partidos/
│   │       ├── jugadores/
│   │       ├── ranking/
│   │       ├── pistas/
│   │       ├── valorar/
│   │       ├── ajustes/
│   │       └── ayuda/          ← Tutorial (11 secciones) + insignia tutorial
│   │
│   ├── components/
│   │   ├── ui/                 ← Genéricos (Button, Card, Modal, Toast, Avatar…)
│   │   ├── layout/             ← Header, BottomNav, RoleBanner, PageTransition
│   │   ├── events/             ← EventCard, EventForm, NextMatchHero, MvpVoting…
│   │   ├── players/            ← PlayerCard, TeamGenerator, BadgeVitrina, PlayerTimeline
│   │   ├── ranking/            ← RankingTable (podio + lista)
│   │   ├── pistas/             ← PistaMap (Leaflet)
│   │   ├── feed/               ← ActivityFeed
│   │   ├── notifications/      ← NotificationPrompt (CTA para aceptar push)
│   │   ├── onboarding/         ← OnboardingOverlay (primer arranque)
│   │   └── ServiceWorkerRegister.tsx
│   │
│   ├── hooks/                  ← useEvents, usePlayers, useVotes… (+ realtime)
│   ├── lib/
│   │   ├── game/               ← badges, levels, scoring, teams, mvp-finalize, badge-art
│   │   ├── supabase/           ← client.ts (browser), server.ts (SSR), auth, avatars
│   │   ├── notifications/      ← notification-service, push-manager
│   │   └── utils.ts            ← helpers (uid, genPlayerCode, fmtDate, COMMUNITY_COLORS…)
│   ├── stores/session.ts       ← Zustand (persist)
│   └── types/index.ts          ← Tipos de dominio
│
├── supabase/
│   ├── schema.sql              ← Schema completo actual (ejecutar en SQL Editor)
│   └── migrations/             ← Parches idempotentes (orden 001 → 008)
│
├── public/                     ← icons/, manifest, service worker, og-image
├── DOCS/                       ← este documento y compañeros
├── next.config.mjs             ← config Next (PWA, headers…)
├── tailwind.config.ts          ← fuentes, radius, animaciones custom
├── tsconfig.json
└── package.json
```

### Regla clave del App Router

Cada carpeta dentro de `src/app/` es una URL. Los `[algo]` son parámetros
dinámicos:

| Archivo | URL |
|---|---|
| `src/app/page.tsx` | `/` |
| `src/app/[cid]/page.tsx` | `/abc123` |
| `src/app/[cid]/partidos/page.tsx` | `/abc123/partidos` |
| `src/app/[cid]/partidos/[eid]/page.tsx` | `/abc123/partidos/xyz789` |
| `src/app/[cid]/partidos/[eid]/resultado/page.tsx` | `/abc123/partidos/xyz789/resultado` |
| `src/app/[cid]/jugadores/[pid]/page.tsx` | `/abc123/jugadores/p001` |
| `src/app/admin/[cid]/page.tsx` | `/admin/abc123` |

Convención: `cid` = community, `eid` = event, `pid` = player.

---

## 4. Cómo funciona una página en Next.js 14

Cada `page.tsx` es una página; cada `layout.tsx` envuelve a todas sus páginas
hijas (persiste al navegar entre ellas).

```
src/app/layout.tsx                       ← HTML raíz, fuentes, <ServiceWorkerRegister/>
  ├── src/app/page.tsx                   ← Login
  └── src/app/[cid]/layout.tsx           ← BottomNav + Header + modal PIN + exit + push
        ├── src/app/[cid]/page.tsx       ← Home comunidad
        ├── src/app/[cid]/partidos/page.tsx
        ├── src/app/[cid]/partidos/[eid]/page.tsx
        ├── src/app/[cid]/partidos/[eid]/resultado/page.tsx
        └── … (jugadores, ranking, pistas, valorar, ajustes, ayuda)
```

### `'use client'`

Next.js tiene dos tipos de componentes:

- **Server Component** (por defecto): se renderiza en servidor, no puede usar
  `useState`, `useEffect` ni eventos del navegador.
- **Client Component** (`'use client'` en la primera línea): se hidrata en el
  cliente y puede usar estado e interacción.

Casi todo FURBITO es client (Supabase + realtime + interacción constante). Las
únicas excepciones son metadata / layouts muy finos.

---

## 5. Base de datos (Supabase) y realtime

Archivo fuente de la verdad: `supabase/schema.sql` + parches en
`supabase/migrations/001…008`. Para setup nuevo ejecutar `schema.sql` y después
las migraciones en orden.

### Tablas principales

| Tabla | Propósito |
|---|---|
| `communities` | Grupo cerrado. PK `id`. Campos clave: `pin`, `color`, `comm_admin_id`, `admin_ids[]`. |
| `players` | Jugadores de una comunidad. `code` (PIN personal 4 dígitos), `xp`, stats acumuladas (`partidos`, `goles`, `asistencias`, `partidos_cero`, `mvps`), `badges[]`, `vitrina[]`, `avatar`. |
| `events` | Partidos. `finalizado`, `goles_a/b`, `equipo_a[]`, `equipo_b[]`, `mvp_id`, `mvp_voting_closes_at`, `pista_id`. |
| `confirmations` | 1 fila por jugador y evento. `status`: `si` \| `quiza` \| `no`. |
| `match_players` | Stats del jugador en un evento concreto. `goles`, `asistencias`, `porteria_cero` (número), `parada_penalti`, hazañas, `equipo`, `xp_ganado`. |
| `mvp_votes` | Votos MVP. PK compuesta `(event_id, voter_id)` → 1 voto por jugador. |
| `votes` | Valoraciones 1-5 entre jugadores (5 skills). |
| `pistas` | Canchas con coordenadas. `added_by` = player que la añadió. |
| `push_subscriptions` | Endpoint + claves de web-push por player. |

### Relaciones (resumen)

```
communities ──┬── players ── match_players, votes (voter/voted), confirmations, mvp_votes
              ├── events ── match_players, confirmations, mvp_votes
              └── pistas
events ── pista (FK opcional)
```

### Realtime

Supabase emite cambios de Postgres por canal WebSocket. Patrón de uso en
hooks (ejemplo `useEvents.ts`, `useEvent` especialmente):

```ts
const channel = supabase
  .channel(`event-${eid}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eid}` }, reload)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmations', filter: `event_id=eq.${eid}` }, reload)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'match_players', filter: `event_id=eq.${eid}` }, reload)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_votes', filter: `event_id=eq.${eid}` }, reload)
  .subscribe()
return () => { supabase.removeChannel(channel) }
```

Por eso cuando otro usuario confirma, vota al MVP o el admin cierra el partido,
tu vista se actualiza sin recargar.

### Seguridad

RLS (Row Level Security) activa en todas las tablas de usuario (migraciones
005/006). Las políticas usan `SECURITY DEFINER` para autorizar por PIN de
comunidad cuando no hay auth de Supabase. Ver
[DOCS/MIGRACION_AUTH.md](MIGRACION_AUTH.md) para el estado del auth formal
(opcional).

---

## 6. Sesión, roles y autenticación

### Store de sesión (`src/stores/session.ts`)

Usa Zustand con `persist` (localStorage). Campos:

- `communityId: string | null`
- `communityColor: string`
- `playerId: string | null`
- `role: 'guest' | 'player' | 'admin'`

Helpers: `login(cid, color, role, playerId?)`, `logout()`, `isPlayerAdmin(playerId, community)`.

### Roles

| Rol | Cómo se entra | Qué puede hacer |
|---|---|---|
| **guest** | Sólo PIN de comunidad. | Ver todo, pero no modificar ni votar. |
| **player** | PIN comunidad + PIN personal (4 dígitos). | Confirmar asistencia, votar MVP, valorar, editar su propio perfil. |
| **admin** | Es player cuyo id está en `communities.admin_ids` (o `comm_admin_id`). También entra como admin el superadmin global (ADMIN_PIN). | CRUD completo de partidos, jugadores, pistas. Cerrar votación MVP. |

### Flujo de login actual (post-cambio 2026-04-22)

1. **Gate inicial** (`src/app/page.tsx`): al abrir la app por primera vez se
   muestra una pantalla con dos cards: "🆕 Usuario nuevo" y "🔑 Ya tengo un
   PIN". A partir de la 2ª visita aparece un botón "No volver a mostrar" que
   fija `localStorage['furbito_gate_dismissed'] = '1'`.
2. **"Usuario nuevo"** abre un modal que pide PIN de comunidad + nombre. Crea
   la fila en `players` con un `code` generado (`genPlayerCode()`), muestra al
   usuario su PIN de 4 dígitos y le entra como `player`.
3. **"Ya tengo un PIN"** y cualquier visita posterior al gate (si se
   desestimó) muestran el login clásico con pestañas **Entrar** y **Crear**.
   "Entrar" sólo pide el PIN de comunidad → entra como `guest`. Una vez
   dentro, el botón 🔑 del header (`[cid]/layout.tsx`) abre el modal de PIN
   personal para pasar a `player`/`admin`.
4. **"Crear"** crea la comunidad en Supabase + un primer player admin con PIN
   generado.

El PIN maestro `NEXT_PUBLIC_ADMIN_PIN` (default `FURBITO2024`) entra al
superadmin (`/admin`).

---

## 7. Página por página

### 7.1. Login — `src/app/page.tsx`

Dos modos (`gate`):

- `chooser`: las dos cards iniciales (Nuevo / Ya tengo PIN). Con
  `<NewUserModal>` interno que hace el alta en `players`.
- `auth`: login clásico (pestañas Entrar / Crear). La lista "Comunidades
  disponibles" se eliminó: ahora la única forma de entrar es el PIN.

Responsabilidad: autenticar (o registrar) y guardar sesión via
`session.login(...)`.

### 7.2. Layout de comunidad — `src/app/[cid]/layout.tsx`

- Aplica `--comm-color` en el `<html>` para que los componentes tinten con el
  color de la comunidad.
- Header fijo con iconos 🔑 (abrir modal de PIN personal) y 🚪 (salir).
- Modal de PIN con 4 slots visuales + input transparente absolute; reveal
  progresivo de 650 ms al tipear (paste no revela).
- Modal de confirmación de salida.
- `<BottomNav>` con los tabs (Home, Partidos, Jugadores, Ranking, Perfil/Acceder).
- Gestión de push notifications via `usePushNotifications` + `<NotificationPrompt>`.

### 7.3. Home — `src/app/[cid]/page.tsx`

Secciones (de arriba a abajo):

1. Tarjeta de perfil con nivel, XP y stats compactos (link a perfil propio).
2. Grid 3-col de stats de comunidad (jugadores / próximos / jugados) con tile
   premium (`.card hairline-top card-glow stat-tile`).
3. Banner "Vota al MVP" (si el jugador tiene votaciones abiertas).
4. CTA "⭐ Valorar compañeros".
5. CTA "🎓 Cómo usar Furbito" (sólo si no tiene insignia `tutorial`).
6. `<NextMatchHero>`: hero del próximo partido con Sí/No inline.
7. Atajo "Generar equipos" si no hay próximo partido (evita duplicar con el
   hero) → despliega `<TeamGenerator>` en línea.
8. `<ActivityFeed>` con las últimas 5 cosas de la comunidad.

### 7.4. Partidos — `src/app/[cid]/partidos/`

- **`page.tsx`** — lista con pestañas `Próximos` / `Historial`, CTA "+ Nuevo"
  para admin.
- **`nuevo/page.tsx`** — wrap de `<EventForm>`.
- **`[eid]/page.tsx`** — detalle con pill-tabs:
  - **Convocados**: barra de confirmación, Sí/Quizá/No coloreados, listas
    agrupadas, panel admin para marcar asistencia manualmente.
  - **Equipos** *(ver 7.4.1)* — canónico para generar y confirmar equipos.
  - **Resultado**: marcador, MVP actual, paneles Equipo A / Equipo B con
    Puntos Furbito por jugador, resumen (scorers, assisters, hazañas,
    top XP), `<MvpVoting>`, `<PostMatchRating>`, acciones admin.
- **`[eid]/resultado/page.tsx`** — stepper de 3 pasos (Marcador → Stats →
  Confirmar).

#### 7.4.1. Pestaña "Equipos" (canónica)

Desde la iteración "cierre marketing" **aquí se generan y confirman los
equipos**, no en Resultado. Admin ve un botón "⚡ Generar/Regenerar equipos"
que abre un Modal con `<TeamGenerator onConfirmTeams={...}>`. Al confirmar se
persiste a `events.equipo_a[]` / `events.equipo_b[]`. Luego en Resultado los
equipos ya aparecen precargados.

El pool de jugadores del generador son los confirmados "sí" (si hay ≥ 2) o
todos los de la comunidad como fallback.

#### 7.4.2. Stepper de resultado (3 pasos)

`src/app/[cid]/partidos/[eid]/resultado/page.tsx` — sólo admin. Pasos:

1. **Marcador**: goles A/B con +/- y lista de asignación (precargada desde
   `event.equipo_a/b`). Banner MVP "por voto popular 24 h". Link a la pestaña
   Equipos si quiere regenerar.
2. **Stats**: por cada jugador, steppers de goles/asistencias/portería a cero
   + hazañas booleanas (chilena, olímpico, tacón, penalti parado). Banner
   auto-validación (goles individuales ↔ marcador). Chip de Puntos Furbito en
   vivo con tier.
3. **Confirmar**: resumen con listado ordenado por Puntos Furbito (tier
   color). Al confirmar:
   - `UPDATE events` con goles, equipos, `mvp_id: null`, `mvp_voting_closes_at = now + 24h`.
   - Por cada jugador, `UPSERT match_players` con stats y `xp_ganado`.
   - `detectBadges()` con contexto (historial, pistas añadidas, horario) → si
     hay nuevas insignias se persisten en `players.badges` + XP bonus y se
     disparan notificaciones.
   - `notifyMatchFinished(...)` para los subscriptores push.

### 7.5. Jugadores — `src/app/[cid]/jugadores/`

- **`page.tsx`** — lista con grid de `<PlayerCard>` y modal "Añadir jugador"
  para admin.
- **`[pid]/page.tsx`** — perfil completo:
  - Header con `<Avatar>`, nombre, badge Admin si procede, nivel y XP.
  - `<BadgeVitrina>` (5 slots) con editor en modal. El botón "💾 Guardar
    expositor" está duplicado (arriba y en footer) porque el teclado móvil
    puede tapar el footer sticky.
  - Fila horizontal de 5 stats-chips (partidos, goles, asistencias, MVPs,
    badges).
  - Barras de habilidades (skills) siempre visibles (0 si no hay votos).
  - `<BadgeShowcase>` con el catálogo completo marcando desbloqueadas.
  - `<PlayerTimeline>` (historial de partidos con puntos Furbito por fila).
  - Admin ve el PIN del jugador.
  - Propio perfil: botones "✏️ Cambiar nombre", "🔑 Cambiar PIN", "🎓 Ver
    tutorial" (→ `/[cid]/ayuda`), modal cambio foto con `uploadPlayerAvatar`.

### 7.6. Ranking — `src/app/[cid]/ranking/page.tsx`

Pestañas: **Puntos Furbito (default)**, Goles, Asistencias, Porterías a cero,
Rating. Podio visual top 3 + lista desde 4º. `calcPlayerTotalPoints()` se
calcula on-the-fly desde stats acumuladas (no se persiste).

### 7.7. Pistas — `src/app/[cid]/pistas/page.tsx`

`<PistaMap>` (Leaflet dinámico, SSR off). Listado + modal de añadir con
geolocalización opcional.

### 7.8. Valorar — `src/app/[cid]/valorar/page.tsx`

Grid de jugadores para valorar masivamente. Cada tarjeta abre un bottom-sheet
con las 5 skills (atk, def, tec, vel, emp). Regla: 1 voto por par (voter, voted).

### 7.9. Ajustes — `src/app/[cid]/ajustes/page.tsx`

Tema claro/oscuro, toggles de notificaciones push por tipo, salir de la
comunidad.

### 7.10. Ayuda (tutorial) — `src/app/[cid]/ayuda/page.tsx`

11 secciones con TOC. La primera visita otorga la insignia `tutorial` (+XP).
Botón flotante "↑ Índice" al scrollear. Este es el destino del CTA "🎓 Ver
tutorial" que aparece en Home y en el perfil propio.

### 7.11. Superadmin — `src/app/admin/` y `src/app/admin/[cid]/`

Panel con métricas + buscador. `admin/[cid]` tiene tabs Comunidad / Jugadores
/ Eventos / Pistas con CRUD completo (update/delete/insert + toggle admin por
jugador).

---

## 8. Componentes

### 8.1. UI genéricos (`src/components/ui/`)

| Componente | Para qué |
|---|---|
| `Button.tsx` | Variantes `primary`, `secondary`, `danger`, `ghost`. En primary/danger lleva `.gloss-overlay` + `.shine-sweep` + `.btn-tone`. |
| `Card.tsx` | `.card hairline-top` + `card-glow` opcional para interactivos. |
| `Input.tsx` | Input controlado con label y error. |
| `Modal.tsx` | Dos variantes: `sheet` (auto) y `window` (90vh móvil). Body scrollable + footer sticky opcional. |
| `Toast.tsx` | `ToastProvider` + `showToast()` global. |
| `Skeleton.tsx` | Placeholder animado para estados de carga. |
| `Badge.tsx`, `BadgeArt.tsx` | Render SVG de insignias y listado (`BadgeShowcase`). |
| `Avatar.tsx` | Avatar circular con iniciales o foto subida. |
| `Icon.tsx`, `ThemeToggle.tsx` | Auxiliares. |

### 8.2. Layout (`src/components/layout/`)

- `Header.tsx` + `Logo`.
- `BottomNav.tsx` — tabs reactivos, pill-halo con `.nav-icon-wrap[data-active]`.
- `RoleBanner.tsx`, `PageTransition.tsx`.

### 8.3. Eventos (`src/components/events/`)

- `EventCard.tsx` — tarjeta compacta en lista.
- `EventForm.tsx` — form reutilizable crear/editar.
- `NextMatchHero.tsx` — hero en Home (toggle por click, Sí/No inline).
- `MvpVoting.tsx` — panel de votación (1 voto por jugador, realtime).
- `PostMatchRating.tsx` — tras el partido, valora a los compañeros que
  jugaron.

### 8.4. Jugadores (`src/components/players/`)

- `PlayerCard.tsx` + `PlayerAvatar` — tarjeta y avatar reutilizable.
- `PlayerTimeline.tsx` — historial de partidos con Puntos Furbito por fila.
- `BadgeVitrina.tsx` — 5 slots con editor en modal.
- `TeamGenerator.tsx` — UI de selección + modos + resultado; prop opcional
  `onConfirmTeams(result)` para persistir.

### 8.5. Otros

- `ranking/RankingTable.tsx` — podio + lista, pestañas.
- `pistas/PistaMap.tsx` — mapa Leaflet lazy-loaded.
- `feed/ActivityFeed.tsx` — últimas actividades derivadas.
- `notifications/NotificationPrompt.tsx` — CTA aceptar push.
- `onboarding/OnboardingOverlay.tsx` — splash primer arranque (3 slides).
- `ServiceWorkerRegister.tsx` — registra `/sw.js` para PWA + push.

---

## 9. Hooks de datos

Todos en `src/hooks/`. Patrón común: `useX(id)` devuelve `{ data, loading, reload }`
y se resubscribe a realtime cuando aplica.

| Hook | Devuelve | Realtime |
|---|---|---|
| `useCommunity(cid)` | `{ community, loading }` | No |
| `useEvents(cid)` | `{ events, upcoming, past, loading, reload }` | Sí (events) |
| `useEvent(eid)` | `{ event, loading, reload }` — event incluye `confirmations`, `match_players`, `pista`, `mvp` | Sí (events + confirmations + match_players + mvp_votes) |
| `usePlayers(cid)` | `{ players, loading, reload }` | Sí |
| `usePlayer(pid)` | `{ player, loading, reload }` | No |
| `usePistas(cid)` | `{ pistas, loading, reload }` | No |
| `useVotes(cid)` | `{ votes, reload }` | No |
| `useMvpVotes(eid)` | `{ votes }` (con realtime) | Sí |
| `usePendingMvpVotes(cid, pid)` | `{ pendingCount }` | Sí indirecto |
| `usePlayerMatches(pid)` | Timeline del perfil | No |
| `usePushNotifications(pid, cid)` | Flujo de suscripción (prompt, subscribe, unsubscribe, toggles) | No |

### Anatomía de un hook con realtime

```ts
export function useEvents(cid: string) {
  const [events, setEvents] = useState<EventFull[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('*, confirmations(*), pista:pistas(*), mvp:players!events_mvp_id_fkey(*)')
      .eq('community_id', cid)
      .order('fecha', { ascending: true })
    setEvents((data ?? []) as EventFull[])
    setLoading(false)
  }, [cid])

  useEffect(() => {
    reload()
    const supabase = createClient()
    const channel = supabase
      .channel(`events-${cid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `community_id=eq.${cid}` }, reload)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [cid, reload])

  const upcoming = useMemo(() => events.filter(e => !e.finalizado), [events])
  const past     = useMemo(() => events.filter(e =>  e.finalizado), [events])
  return { events, upcoming, past, loading, reload }
}
```

Cualquier página puede llamar `reload()` del hook después de hacer un
`INSERT/UPDATE/DELETE` para refrescar antes de esperar al evento realtime.

---

## 10. Lógica del juego

Toda en `src/lib/game/` — funciones puras (no tocan Supabase). Se prueban y
razonan aisladas.

### 10.1. Niveles — `levels.ts`

Curva cuadrática hasta **L99** (≈ 321 k XP en L99).

```ts
xpForLevel(n)     → XP acumulada para alcanzar el nivel n
getLevel(xp)      → { level, name, icon, min, next }
xpPercent(xp)     → 0-100 (progreso al siguiente)
getNextLevel(xp)  → nivel siguiente o null si es L99
```

### 10.2. Puntos Furbito — `scoring.ts`

Fuente única de verdad: constante `MATCH_POINTS = { partido: 3, gol: 2, asistencia: 1, porteria_cero: 2 }`.

```ts
calcMatchPoints(stats)   → breakdown { goles, asistencias, porterias, total }
getPointsTier(total)     → { key, label, color, gradient, fg, glow }
calcPlayerTotalPoints(p) → partidos*3 + goles*2 + asistencias*1 + partidos_cero*2
getPlayerRating(pid, votes) → avg + bySkill[] a partir de los `votes`
playerScore(p, votes)    → score bruto que usa el generador
```

Tiers (usados en ranking y en la UI de resultado):

| Rango | Label | Color |
|---|---|---|
| <5 | Mal partido | rojo |
| 5–7 | Regular | naranja |
| 8–10 | Bueno | verde |
| 11–19 | Excelente | cian |
| 20+ | Leyenda | arcoíris animado (`.legend-rainbow` + `.legend-halo`) |

### 10.3. Generador de equipos — `teams.ts`

`generateTeamsByMode(mode, players, votes)` → `TeamGeneratorResult`.

Modos:

- `balanced`: usa vectores (atk, def, tec, vel, emp) del rating de `votes`.
  Relaciones ocultas:
  - atk ↔ def son rivales → factor `2·√(atk·def)` (máximo si atk = def). Peso 0.45.
  - tec va suelto → lineal. Peso 0.20.
  - vel ↔ emp complementarios → factor `2·√(vel·emp)`. Peso 0.35.
  Score = `power(skills)`. Optimiza `|teamPower(A) − teamPower(B)|` hasta 40
  iteraciones sin mejora.
- `random`: Fisher-Yates puro.

El balance resultante viene con `bal = { label, msg, color }` (4 niveles).

### 10.4. Insignias — `badges.ts`

`BADGE_DEFS` es el diccionario completo (cientos de entradas). Cada entrada:
`{ icon, name, desc, xp, category }`.

Tiers de rareza (calibrados a la curva L99):

| Tier | XP |
|---|---|
| Trivial | 10–25 |
| Común | 40–80 |
| Notable | 100–200 |
| Dedicado | 250–500 |
| Élite | 600–1200 |
| Legendario | 1500–3000 |
| Mito | 4000+ |

Las insignias `xp_*` y `nivel_*` están en XP 0 (son marcadores).

`detectBadges(player, matchPlayer, isMVP, context)` recibe el estado
post-partido y devuelve las keys nuevas. `context` incluye:

- `matchScore`: goles A/B y equipo del jugador.
- `matchMeta`: fecha, hora, `pistaId`.
- `history`: `HistoryMatch[]` previos (para rachas, MVP acumulados…).
- `pistasStats.addedByPlayer`: cuántas pistas añadió este jugador (badge
  "explorador").

`calcXP(mp, isMVP)` calcula el XP base del partido (goles, asistencias,
hazañas, MVP…). El XP de badges se suma aparte en el guardado.

### 10.5. Finalización MVP — `mvp-finalize.ts`

Cuando el admin guarda resultado: `mvp_id = null`, `mvp_voting_closes_at =
now + 24h`. El detalle del partido llama `finalizeMvpByVotes(eid)` cuando el
plazo cumple **y** hay votos (también disparable manualmente por admin con
"🔒 Cerrar votación"). La función:

1. Cuenta votos en `mvp_votes`, toma el más votado.
2. `UPDATE events SET mvp_id = winner`.
3. `UPDATE players SET mvps = mvps + 1, xp = xp + 10` para el ganador.
4. Re-ejecuta `detectBadges()` sobre el ganador con flag `isMVP = true` para
   desbloquear `primer_mvp`, `mvp_3`, `mvp_goleada`, `partido_perfecto`…
5. Notifica al ganador.

Es **idempotente**: si `mvp_id` ya está puesto, no hace nada.

---

## 11. Notificaciones push

Stack: VAPID + Service Worker + tabla `push_subscriptions` + cron Supabase
para recordatorios (`003_push_reminders_cron.sql`).

- `src/lib/notifications/push-manager.ts` — lógica nativa de suscripción/unsub,
  helpers de permisos.
- `src/lib/notifications/notification-service.ts` — API para disparar notificaciones
  lógicas: `notifyMatchCreated`, `notifyMatchFinished`, `notifyBadgeEarned`,
  `notifyMvpWinner`.
- `src/hooks/usePushNotifications.ts` — orquesta todo desde el layout de
  comunidad (prompt, suscribir, toggles por tipo).
- `public/sw.js` — service worker que recibe el push y muestra la
  notificación.

El admin o backend no dispara pushes por ahora: se disparan desde el cliente
del actor (quien guarda el resultado, quien desbloquea un badge…) hacia los
endpoints de los demás. Es un diseño cliente-cliente intencionado.

---

## 12. Estilos, tema y capa de polish

### 12.1. Tokens (`src/app/globals.css`)

CSS vars clave:

```css
--bg, --bg2, --card, --card2    /* Fondos en orden de profundidad */
--fg, --text, --muted            /* Texto */
--border                         /* Bordes */
--accent                         /* Verde neon global */
--comm-color                     /* Color dinámico de la comunidad actual */
--red, --gold
--header-h, --nav-h, --safe-bottom
--radius-s, --radius-m, --radius-l
--shadow-depth-1/2/3
```

Se aplica `--comm-color` en `[cid]/layout.tsx` via
`document.documentElement.style.setProperty(...)`.

### 12.2. Utilities "premium" (iteración polish)

Definidas en `globals.css`, opt-in por clase:

| Clase | Efecto |
|---|---|
| `.card` | Glass con hairline (base). |
| `.hairline-top` | Filo metálico superior. |
| `.card-glow` | Hover: border y shadow tintados community. |
| `.gloss-overlay` | Gloss interior en botones primary/danger. |
| `.shine-sweep` | Barrido diagonal en hover no-touch. |
| `.btn-tone[data-tone="accent\|danger\|glass"]` | Sombra tintada por variante. |
| `.nav-icon-wrap[data-active]` | Pill halo detrás del icono activo. |
| `.header-underline` | Gradiente sutil centrado bajo el header. |
| `.aura-halo` | Radial breathing halo (usa `--aura-color`). |
| `.micro-float` | Flotación 3.2 s. |
| `.plinth-reflect` | Mirror overlay del podio. |
| `.stat-tile` | Tile con gradiente sutil. |
| `.legend-rainbow`, `.legend-halo` | Solo para tier "leyenda" (20+ pts). |

### 12.3. Tailwind

`tailwind.config.ts` extiende:

- Colores mapeados a CSS vars (`text`, `bg`, `bg2`, `accent`…).
- `fontFamily.bebas` para los números gordos de score/nivel.
- `borderRadius.s|m|l`.
- Animaciones: `float`, `shake`, `slide-up`, `fade-in`, `legendShift`.

Para UI nueva, usar siempre el patrón `.card hairline-top card-glow` si es
interactivo, pill-chevron para `›` (7×7 con borde community-tinted).

---

## 13. Flujos completos

### 13.1. Crear comunidad

1. `/` → Entrar (o salir del gate) → pestaña **Crear**.
2. Nombre + PIN + color + nombre admin → submit.
3. `INSERT communities` + `INSERT players` (admin con `code` generado).
4. `alert()` muestra el PIN al admin.
5. `session.login(cid, color, 'admin', playerId)` → redirect a `/[cid]`.

### 13.2. Nuevo usuario (autoalta)

1. `/` (gate chooser) → "🆕 Usuario nuevo".
2. Modal: PIN comunidad + nombre → submit.
3. Busca community por PIN. Si no existe → error.
4. `INSERT players (community_id, name, code generado)`.
5. Muestra el PIN en pantalla (usuario debe guardarlo).
6. Click "Entrar a la comunidad" → `session.login(...)` → `/[cid]`.

### 13.3. Confirmar asistencia

1. Player entra a `/[cid]/partidos/[eid]` (tab Convocados).
2. Click Sí / Quizá / No.
3. Si había fila previa: `UPDATE confirmations SET status=...`. Si no: `INSERT`.
4. Realtime: todos los demás abiertos ven el cambio sin recargar.

### 13.4. Generar y confirmar equipos

1. Admin en tab Equipos → "⚡ Generar equipos".
2. Modal `<TeamGenerator>` con pool = confirmados "sí" (fallback: toda la
   comunidad).
3. Ajustar selección + modo → "🎯 Generar".
4. Ver reparto + balance chip. Opciones: "🔄 Regenerar" o "✅ Confirmar equipos".
5. `UPDATE events SET equipo_a = [...], equipo_b = [...]`.
6. Toast, cierra modal, `reloadEvent()`.

### 13.5. Registrar resultado (admin)

1. Detalle del partido → "🏁 Registrar resultado".
2. **Paso 1** — Marcador, equipos ya precargados desde `event.equipo_a/b`.
3. **Paso 2** — Stats por jugador (steppers + toggles de hazaña). Banner
   auto-validación (goles individuales vs marcador).
4. **Paso 3** — Resumen ordenado por Puntos Furbito con tier colores. Confirmar.
5. Guardado (ver 7.4.2 para el detalle exacto).
6. `notifyMatchFinished(...)` → push a toda la comunidad.

### 13.6. Votar MVP

1. Partido finalizado → tab Resultado → `<MvpVoting>`.
2. Cada jugador elige 1 voto (no puede votarse a sí mismo).
3. `INSERT mvp_votes (event_id, voter_id, voted_id)` con PK compuesta →
   un solo voto por jugador.
4. A las 24 h (o manualmente por admin) → `finalizeMvpByVotes()`.

### 13.7. Valorar compañeros

1. Home → "⭐ Valorar compañeros" → `/[cid]/valorar`.
2. O perfil ajeno → botón "⭐ Valorar".
3. Sheet con 5 sliders (atk, def, tec, vel, emp) 1–5.
4. `INSERT votes` (PK única: `voter_id, voted_id`).

### 13.8. Notificación push

1. Layout de comunidad detecta permisos → muestra `<NotificationPrompt>` si
   procede.
2. Accept → `push-manager.subscribe()` crea PushSubscription del navegador y
   `INSERT push_subscriptions` con endpoint + keys.
3. Cuando otro cliente llama `notifyX(...)`, se envía el payload via
   web-push al endpoint del subscriptor.
4. `public/sw.js` recibe el evento y muestra la notificación.

---

## 14. Cómo añadir / modificar cosas (recetas)

### 14.1. Añadir una página nueva

1. Crear carpeta/archivo: `src/app/[cid]/algo/page.tsx`.
2. Empezar con `'use client'` si necesitas interacción.
3. Importar `useSession`, hooks de datos, `<Header>`.
4. Añadir un tab en `BottomNav.tsx` si procede (o enlazar desde Home).

### 14.2. Añadir un componente UI

1. Crear en `src/components/ui/NombreNuevo.tsx`.
2. Tipar props con `interface ...Props`.
3. Usar el patrón premium: `.card hairline-top` + CSS vars.
4. Exportar named: `export function NombreNuevo(...)`.

### 14.3. Añadir un hook de datos

1. Crear `src/hooks/useAlgo.ts`.
2. `const [data, setData] = useState(...)`, `reload` con `useCallback`.
3. Si es realtime: suscribir canal en `useEffect`, filtrar por la FK que
   aplique, `removeChannel` en el cleanup.
4. Devolver `{ data, loading, reload }` o similar.

### 14.4. Añadir una tabla o columna en Supabase

1. Crear `supabase/migrations/00X_nombre.sql` con DDL idempotente
   (`create table if not exists`, `alter table … add column if not exists`,
   etc.).
2. Actualizar `supabase/schema.sql` (fuente de verdad para nuevos setups).
3. Ejecutar manualmente en el SQL Editor de Supabase (hasta que se automatice).
4. Actualizar `src/types/index.ts` con los nuevos campos.
5. Actualizar hooks/componentes que la usen.

### 14.5. Añadir una insignia

1. Añadir entrada a `BADGE_DEFS` en `src/lib/game/badges.ts` con `icon`,
   `name`, `desc`, `xp` (respetando tiers), `category`.
2. Añadir lógica de detección en `detectBadges(...)` (si es derivable de
   stats/context actuales).
3. Probar manualmente: forzar condiciones en SQL o debug local.

### 14.6. Cambiar los puntos del partido

Editar `MATCH_POINTS` en `src/lib/game/scoring.ts`. Todo lo demás (UI, ranking,
timeline) deriva de ahí — no hay doble fuente.

### 14.7. Añadir un modo nuevo al generador de equipos

1. Nuevo valor en el tipo `TeamMode` (`src/types/index.ts`).
2. Implementar `generateTeamsXxx(players, votes)` en `src/lib/game/teams.ts`.
3. Añadirlo al switch de `generateTeamsByMode(...)`.
4. Añadirlo al array `modes` dentro de `<TeamGenerator>`.

### 14.8. Añadir un tipo de notificación push

1. En `notification-service.ts`: `export function notifyAlgo(...)`.
2. Dispararla desde donde ocurra el evento lógico.
3. (Opcional) añadir toggle en Ajustes para que el usuario la desactive.

### 14.9. Depurar un realtime que no dispara

- Revisa que la **RLS** permita SELECT al rol que escucha (anon key).
- Revisa el filtro: `filter: "event_id=eq.xyz"` — si el nombre de la columna
  está mal, falla en silencio.
- Abre la pestaña Network → WS para ver el canal subscrito.
- Última opción: fuerza `reload()` manual tras cada escritura y deja que el
  realtime sea solo "nice to have".

---

## 15. Glosario y convenciones

| Término | Significado |
|---|---|
| **Component** | Función React que devuelve JSX. Reutilizable. |
| **Hook** | Función que empieza con `use`, maneja estado/efectos. |
| **Props** | Parámetros de un componente. |
| **State** | Datos que cambian y fuerzan re-render. |
| **SSR / CSR** | Server-Side / Client-Side Rendering. Nosotros vamos casi siempre CSR (`'use client'`). |
| **RLS** | Row Level Security de Postgres. Reglas por fila. |
| **Realtime** | Suscripción a cambios vía WebSocket de Supabase. |
| **PWA** | Progressive Web App. Se instala como app. |
| **VAPID** | Keys para identificar al servidor ante el navegador en web-push. |
| **Zustand** | Store cliente minimalista. |
| **Tailwind** | Framework CSS utilitario. |
| **cid / eid / pid** | community / event / player id (convención de rutas). |
| **Puntos Furbito** | Puntuación por partido (3+2+1+2). |
| **Tier** | Banda de color según Puntos Furbito. |
| **Vitrina** | Expositor de 5 insignias favoritas en el perfil. |
| **MVP por voto** | No lo elige el admin, lo decide la votación popular en 24 h. |

### Convenciones de código

- **Archivos**: `PascalCase.tsx` para componentes, `camelCase.ts` para hooks y
  libs. Rutas de App Router siguen la convención Next (`page.tsx`, `layout.tsx`).
- **Sin comentarios superfluos**: sólo comentar el *por qué* si no es obvio.
- **Sin docstrings largos**: el código habla por sí mismo.
- **Commits**: estilo `feat:`, `fix:`, `chore:` en español claro. Ver historia
  reciente con `git log --oneline`.
- **No tocar RLS sin migración**: cualquier cambio de política va a `00X_*.sql`.
- **Siempre tipar**: nada de `any` salvo en casts puntuales justificados.

---

## Ver también

- `DOCS/ARCHITECTURE.md` — arquitectura resumida.
- `DOCS/SETUP.md` — levantar el proyecto desde cero.
- `DOCS/DEPLOY.md` — deploy a Vercel + Supabase.
- `DOCS/PARAMETROS_JUEGO.md` — constantes de gamificación.
- `DOCS/MIGRACION_AUTH.md` — estado del auth formal.
- `DOCS/WARROOM_ROADMAP_30D.md` — prioridades.
- `supabase/schema.sql` — schema de referencia.
