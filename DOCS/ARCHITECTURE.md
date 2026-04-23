# FURBITO v2 — Arquitectura del Proyecto

## Stack tecnológico

| Capa        | Tecnología              | Por qué                                      |
|-------------|-------------------------|----------------------------------------------|
| Frontend    | Next.js 14 (App Router) | SSR/SSG, routing, Vercel-native              |
| Lenguaje    | TypeScript              | Tipado fuerte, menos bugs                    |
| Estilos     | Tailwind CSS + CSS vars | Utility-first + variables de diseño dinámicas|
| Base de datos | Supabase (PostgreSQL) | Relacional, real-time, RLS, gratis tier      |
| Estado      | Zustand                 | Ligero, persistente, sin boilerplate         |
| Deploy      | Vercel                  | Integración perfecta con Next.js             |
| PWA         | Service Worker manual   | Control total del cache offline              |

---

## Estructura de carpetas

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (HTML, fonts, meta)
│   │   ├── page.tsx            # Login / selección de comunidad
│   │   ├── globals.css         # Variables CSS + estilos globales
│   │   ├── [cid]/              # Rutas de comunidad (dinámicas)
│   │   │   ├── layout.tsx      # Layout con nav, role banner, toast
│   │   │   ├── page.tsx        # Home / Feed
│   │   │   ├── partidos/
│   │   │   │   ├── page.tsx         # Lista de eventos
│   │   │   │   ├── nuevo/page.tsx   # Crear evento
│   │   │   │   └── [eid]/page.tsx   # Detalle de evento
│   │   │   ├── jugadores/
│   │   │   │   ├── page.tsx         # Lista de jugadores
│   │   │   │   └── [pid]/page.tsx   # Perfil de jugador
│   │   │   ├── ranking/page.tsx     # Rankings
│   │   │   ├── pistas/page.tsx      # Mapa y lista de pistas
│   │   │   └── ajustes/page.tsx     # Configuración de sesión
│   │   └── admin/page.tsx      # Panel administrador global
│   │
│   ├── components/
│   │   ├── ui/                 # Componentes genéricos reutilizables
│   │   │   ├── Button.tsx      # Botón con variantes (primary, secondary, danger, ghost)
│   │   │   ├── Card.tsx        # Tarjeta contenedora
│   │   │   ├── Input.tsx       # Input, Textarea, Select
│   │   │   ├── Modal.tsx       # Bottom sheet / modal
│   │   │   ├── Toast.tsx       # Sistema de notificaciones
│   │   │   ├── Skeleton.tsx    # Skeleton loading
│   │   │   └── Badge.tsx       # Chips de badges/logros
│   │   ├── layout/             # Componentes de estructura
│   │   │   ├── BottomNav.tsx   # Navegación inferior (5 tabs)
│   │   │   ├── Header.tsx      # Cabecera de página
│   │   │   └── RoleBanner.tsx  # Banner de rol (admin/player/guest)
│   │   ├── events/             # Componentes de eventos/partidos
│   │   │   ├── EventCard.tsx   # Tarjeta de evento en lista
│   │   │   └── EventForm.tsx   # Formulario crear/editar evento
│   │   ├── players/            # Componentes de jugadores
│   │   │   ├── PlayerCard.tsx  # Tarjeta de jugador + avatar
│   │   │   └── TeamGenerator.tsx # Generador de equipos
│   │   └── ranking/
│   │       └── RankingTable.tsx # Tabla de rankings con tabs
│   │   # NOTA: components/pistas/ eliminado 2026-04-23 — mapa aplazado a nativa
│   │
│   ├── hooks/                  # Custom React hooks (data fetching)
│   │   ├── useCommunity.ts     # Datos de comunidad
│   │   ├── useEvents.ts        # Eventos + real-time
│   │   ├── usePlayers.ts       # Jugadores + real-time
│   │   ├── usePistas.ts        # Pistas (locations — alimenta selector en EventForm)
│   │   └── useVotes.ts         # Valoraciones
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Cliente browser (createBrowserClient)
│   │   │   └── server.ts       # Cliente server (createServerClient)
│   │   ├── game/               # Lógica de juego pura (sin efectos)
│   │   │   ├── levels.ts       # Sistema de niveles XP
│   │   │   ├── badges.ts       # Definiciones + detección de badges
│   │   │   ├── scoring.ts      # Puntuación de jugadores, ratings
│   │   │   └── teams.ts        # Algoritmos de generación de equipos
│   │   └── utils.ts            # Helpers generales (cn, uid, fmtDate...)
│   │
│   ├── stores/
│   │   └── session.ts          # Estado de sesión global (Zustand + persist)
│   │
│   └── types/
│       └── index.ts            # Tipos TypeScript globales
│
├── supabase/
│   └── schema.sql              # Schema completo de la BD
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker
│   └── icons/                  # Iconos PWA (debes añadirlos)
│       ├── icon-192.png
│       └── icon-512.png
│
└── DOCS/
    ├── SETUP.md                # Esta guía de setup
    └── ARCHITECTURE.md         # Este archivo
```

---

## Modelo de datos (Supabase)

```
communities          players
    │                   │
    ├──────────────────>│ (community_id)
    │                   │
    ├──> pistas         │
    │       │           │
    ├──> events         │
    │       │           │
    │       ├──> confirmations ──> players
    │       └──> match_players ──> players
    │
    └──> votes ──> players (voted_id)
                └> players (voter_id)
```

### Tablas principales

| Tabla            | Descripción                                        |
|------------------|----------------------------------------------------|
| `communities`    | Comunidades (nombre, PIN, color)                   |
| `players`        | Jugadores con stats acumuladas y badges            |
| `pistas`         | Ubicaciones con lat/lng                            |
| `events`         | Partidos/entrenamientos con resultado              |
| `confirmations`  | Asistencia por jugador por evento (si/no/quizá)    |
| `match_players`  | Stats individuales por partido (goles, asist...)   |
| `votes`          | Valoraciones 1-5 por habilidad (ataque, defensa...)  |

---

## Flujo de sesión

```
Usuario abre la app
        │
        ▼
   Pantalla Login
   (app/page.tsx)
        │
   ┌────┴────┐
   │         │
  PIN     PIN Admin
  + código    │
  jugador     ▼
   │      /admin page
   ▼
 useSession.login() ──> Zustand store (persistido en localStorage)
        │
        ▼
  router.push(`/${communityId}`)
        │
        ▼
  [cid]/layout.tsx ──> verifica sesión ──> si no hay, redirect a /
        │
        ▼
  Aplica --comm-color a :root
  Muestra RoleBanner + BottomNav
        │
        ▼
  [cid]/page.tsx (Home)
```

---

## Sistema de roles

| Rol      | Acceso                                                         |
|----------|----------------------------------------------------------------|
| `guest`  | Solo lectura: ver eventos, jugadores, ranking, pistas          |
| `player` | guest + confirmar asistencia, votar, editar su perfil         |
| `admin`  | player + crear/editar/borrar eventos, jugadores, comunidades  |

El rol se almacena en el Zustand store y se determina al login:
- PIN correcto → `guest` o `player` (si proporciona código de jugador)
- Código de jugador = `comm_admin_id` de la comunidad → `admin`
- Super-admin global (panel `/admin`) → login email/password vía Supabase Auth,
  UUID fijo reconocido por `public.is_super_admin()` (ver mig 013)

---

## Real-time (Supabase)

Los hooks `useEvents` y `usePlayers` usan Supabase Realtime para recibir actualizaciones automáticas:

```typescript
supabase
  .channel('events:cid')
  .on('postgres_changes', { event: '*', table: 'events', filter: '...' }, () => reload())
  .subscribe()
```

Esto significa que cuando un jugador confirma asistencia, todos los que tengan el evento abierto verán el cambio en tiempo real.

---

## Algoritmos de generación de equipos

En `src/lib/game/teams.ts` hay 3 modos:

1. **Balanced** (por defecto): Snake draft + 30 iteraciones de swap para minimizar la diferencia de puntuaciones.
2. **Random**: Fisher-Yates shuffle puro.
3. **Snake draft**: Distribución alternada 1-2-2-1 por ranking de nivel.

La puntuación de cada jugador (`playerScore` en `scoring.ts`) combina:
- Stats acumuladas (goles/partido, asistencias/partido, ratio MVP): 50%
- Rating de votaciones de otros jugadores: 50%

---

## Sistema de badges

`src/lib/game/badges.ts` contiene:
- `BADGE_DEFS`: Diccionario con 80+ badges, su icono, nombre, descripción y XP
- `calcXP(matchPlayer, isMVP)`: Calcula el XP ganado en un partido
- `detectBadges(player, matchPlayer, isMVP)`: Retorna array de badges nuevos ganados

Los badges se guardan en el campo `badges: string[]` de la tabla `players`.

---

## Añadir nuevas features

### Nueva página
1. Crea `src/app/[cid]/nueva-seccion/page.tsx` con `'use client'`
2. Añade el link en `src/components/layout/BottomNav.tsx` si necesita tab

### Nuevo componente
1. Crea en la carpeta de su dominio: `src/components/[dominio]/MiComponente.tsx`
2. Usa `@/components/ui/` para estilos base

### Nuevo hook de datos
1. Crea `src/hooks/useMiDato.ts`
2. Usa `createClient()` de `@/lib/supabase/client`
3. Añade real-time si los datos pueden cambiar sin acción del usuario

### Nueva tabla en Supabase
1. Añade el `CREATE TABLE` en `supabase/schema.sql`
2. Añade el tipo en `src/types/index.ts`
3. Crea el hook correspondiente
