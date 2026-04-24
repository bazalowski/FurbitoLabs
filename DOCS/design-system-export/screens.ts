/**
 * FURBITO — Screen Inventory (portable)
 *
 * Every canonical screen of the app, described as:
 *   - surface (calm/arena/mixed)
 *   - layout structure (sections top → bottom)
 *   - key components
 *   - states (empty, loading, error)
 *
 * Feed this file to a wireframing AI (Claude Design) to generate the
 * full wireframe set without re-deriving intent from the codebase.
 */

import type { Surface } from './components'

type Section = {
  name: string
  surface: Surface | 'mixed'
  components: string[]
  notes?: string
}

type Screen = {
  route: string
  title: string
  surface: Surface | 'mixed'
  purpose: string
  sections: Section[]
  states?: {
    empty?: string
    loading?: string
    error?: string
  }
  gated?: string // auth/role/onboarding gate
}

// ─────────────────────────────────────────────────────────────
// AUTH / ONBOARDING
// ─────────────────────────────────────────────────────────────

export const auth: Screen[] = [
  {
    route: '/login',
    title: 'Login',
    surface: 'calm',
    purpose: 'Entry: select community → identify player (remembered) → PIN',
    sections: [
      { name: 'Brand header', surface: 'calm', components: ['Logo (Bebas hero)', 'tagline Barlow muted'] },
      { name: 'Community selector', surface: 'calm', components: ['SearchInput', 'CommunityCard list'],
        notes: 'Each card shows name + member count + color dot (comm-color preview).' },
      { name: 'Player identification', surface: 'calm', components: ['Avatar grid', 'SearchInput'],
        notes: 'If remembered-player in localStorage → auto-restore to PIN screen.' },
      { name: 'PIN pad', surface: 'calm', components: ['Bebas 6-digit display', 'keypad 3x4', 'Ghost "cambiar jugador"'] },
    ],
    states: {
      error: 'PIN incorrecto → animate-shake + Toast rojo + intentos restantes mono',
    },
  },
  {
    route: '/onboarding',
    title: 'Onboarding',
    surface: 'calm',
    purpose: 'First-time setup for a new community/player',
    sections: [
      { name: 'Welcome hero', surface: 'calm', components: ['Logo', 'Title Bebas', 'copy Barlow'] },
      { name: 'Steps carousel', surface: 'calm', components: ['Progress dots', 'screen cards'] },
      { name: 'CTA', surface: 'calm', components: ['Button primary="Empezar"'] },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// HOME (calm with arena beats)
// ─────────────────────────────────────────────────────────────

export const home: Screen[] = [
  {
    route: '/',
    title: 'Home',
    surface: 'mixed',
    purpose: 'Dashboard: who you are, what\'s next, community pulse',
    sections: [
      { name: 'Header', surface: 'calm', components: ['Header', 'header-underline', 'ThemeToggle'] },
      { name: 'Player card', surface: 'calm',
        components: ['Avatar lg', 'name Bebas subdisplay', 'XP bar', 'last-5 chips row'],
        notes: 'XP bar: 4px, comm-color fill, 600ms transition on change.' },
      { name: 'Next match hero', surface: 'arena',
        components: ['card-hero', 'metric-major ("14h 23m" countdown via font-mono)', 'location divider-dot date',
                     'convocatoria state chip', 'Button primary="Apuntarme"'],
        notes: 'Becomes arena when partido próximo. If no match → calm empty state.' },
      { name: 'Stats tiles', surface: 'calm',
        components: ['stat-tile x3 (Puntos · Victorias · MVPs)', 'metric-minor inside each'] },
      { name: 'Community wall', surface: 'calm',
        components: ['WallPost list (V1 text + V3 YouTube embed)', 'reply threads'],
        notes: 'Replaces the old ActivityFeed. Mig 016 — see project_wall memory.' },
      { name: 'Bottom nav', surface: 'calm', components: ['BottomNav 4-slot'] },
    ],
    states: {
      empty: 'If no next match + no wall posts → hero with CTA "Crea tu primer partido"',
      loading: '4 skeletons (avatar+name row + 3 stat-tile)',
    },
  },
]

// ─────────────────────────────────────────────────────────────
// PARTIDO (match)
// ─────────────────────────────────────────────────────────────

export const matches: Screen[] = [
  {
    route: '/partido',
    title: 'Partidos',
    surface: 'calm',
    purpose: 'List of matches (upcoming + history)',
    sections: [
      { name: 'Header', surface: 'calm', components: ['Header', 'tab: Próximos | Pasados'] },
      { name: 'Upcoming list', surface: 'calm',
        components: ['MatchRowCalm (date · pista · confirmados/capacidad)', 'inkbar[data-tone=community]'] },
      { name: 'Past list', surface: 'mixed',
        components: ['MatchRowArena (score-slab mini · MVP chip · tier indicator)', 'inkbar[data-tone=win|loss|draw]'] },
    ],
    states: {
      empty: 'Empty state + Button primary="Crear partido"',
    },
  },
  {
    route: '/partido/[id]',
    title: 'Detalle partido',
    surface: 'mixed',
    purpose: 'Pre-match prep OR post-match climax (branches on finalized flag)',
    sections: [
      // PRE-MATCH
      { name: 'Header + share', surface: 'calm', components: ['Header', 'Icon button share', 'Icon button edit (admin)'] },
      { name: 'Match meta', surface: 'calm',
        components: ['metric-minor (fecha · hora)', 'pista row with map pin', 'duration mono'] },
      { name: 'Convocados grid', surface: 'calm',
        components: ['Avatar grid (confirmados solid · pendientes ghost)', 'counter chip-pulse if live'] },
      { name: 'Team generator entry', surface: 'calm',
        components: ['Button secondary="Generar equipos"', 'nota info Barlow muted'] },

      // POST-MATCH
      { name: 'Score slab (finalized)', surface: 'arena',
        components: ['ScoreSlab', 'is-reveal on viewport', 'team names Bebas subdisplay'] },
      { name: 'MVP reveal', surface: 'arena',
        components: ['Avatar hero + aura-halo (3s reveal)', 'name Bebas', 'votes mono', 'emoji 🏆'] },
      { name: 'Team rows', surface: 'arena',
        components: ['TeamCard x2 with inkbar[win|loss|draw]', 'player rows with chip-tier + delta-chip'] },
      { name: 'Comunio summary', surface: 'arena',
        components: ['table (jugador · chip-tier · delta-chip)', 'leyenda chip animated if any'] },
      { name: 'Actions', surface: 'calm',
        components: ['Button ghost="Volver"', 'Button secondary="Ver ranking"'] },
    ],
    states: {
      loading: 'Skeletons for convocados grid + team slots',
    },
  },
  {
    route: '/partido/[id]/resultado',
    title: 'Introducir resultado',
    surface: 'mixed',
    purpose: 'Admin stepper: scores → individual stats → Comunio reveal',
    sections: [
      { name: 'Stepper header', surface: 'calm', components: ['Progress 3 dots', 'step label'] },
      { name: 'Paso 1 — Marcador', surface: 'calm',
        components: ['Input score team A', 'Input score team B', 'Button primary="Siguiente"'] },
      { name: 'Paso 2 — Stats jugadores', surface: 'calm',
        components: ['Player row: name · Input goles · Input asistencias · Switch porteria_cero · MVP radio'] },
      { name: 'Paso 3 — Reveal Comunio', surface: 'arena',
        components: ['ScoreSlab', 'ChipTier per player + DeltaChip', 'confetti svg on leyenda/excelente',
                     'Button primary="Finalizar partido" with shine-sweep'] },
    ],
  },
  {
    route: '/partido/nuevo',
    title: 'Crear partido',
    surface: 'calm',
    purpose: 'Form (admin) — date/time/pista/capacity',
    sections: [
      { name: 'EventForm', surface: 'calm',
        components: ['Input fecha/hora', 'Input pista (inline create)', 'Input capacity',
                     'Input duración', 'Button primary="Crear"'] },
    ],
  },
  {
    route: '/partido/[id]/equipos',
    title: 'TeamGenerator',
    surface: 'mixed',
    purpose: 'Balance players into teams',
    sections: [
      { name: 'Paso 1 — Selección', surface: 'calm',
        components: ['Checklist of confirmados', 'skill averages mono', 'Button primary="Generar"'] },
      { name: 'Paso 2 — Resultado', surface: 'arena',
        components: ['TeamCard x2 (surface-arena)', 'balance bar mono "Δ skill: 0.3"',
                     'Button primary="Usar estos equipos"', 'Button ghost="Re-generar"'] },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// RANKING
// ─────────────────────────────────────────────────────────────

export const ranking: Screen[] = [
  {
    route: '/ranking',
    title: 'Ranking',
    surface: 'mixed',
    purpose: 'Leaderboard: points, wins, MVPs, por rol',
    sections: [
      { name: 'Header', surface: 'calm', components: ['Header', 'window selector (mes|temporada|histórico)'] },
      { name: 'Tabs', surface: 'mixed',
        components: ['Tab row horizontal: Puntos (hero wrapped in legend-rainbow) · Victorias · MVPs · Porterías'],
        notes: 'Only Puntos tab uses legend-rainbow chrome — ratified as exception from anti-pattern.' },
      { name: 'Role filter', surface: 'calm', components: ['Chip row: TODOS · POR · DEF · MED · DEL'] },
      { name: 'Podium top 3', surface: 'arena',
        components: ['Plinth 1st (surface-arena + plinth-reflect + aura-halo if invicto)',
                     '2nd + 3rd cards', 'Avatar + ChipTier + DeltaChip'] },
      { name: 'List 4+', surface: 'calm',
        components: ['Row: index mono (#4) · Avatar sm · name · ChipTier · DeltaChip'] },
      { name: 'Sticky you', surface: 'arena',
        components: ['data-role="sticky"', 'thin strip: "Tú: #12 · DeltaChip · ChipTier"'],
        notes: 'Pinned at bottom (above BottomNav) while scrolling list.' },
    ],
    states: {
      empty: 'Si window sin datos → empty state + CTA "Ver histórico"',
    },
  },
]

// ─────────────────────────────────────────────────────────────
// PERFIL (profile)
// ─────────────────────────────────────────────────────────────

export const profile: Screen[] = [
  {
    route: '/perfil/[playerId]',
    title: 'Perfil jugador',
    surface: 'mixed',
    purpose: 'Player deep dive — stats, evolution, badges',
    sections: [
      { name: 'Hero', surface: 'calm',
        components: ['Avatar hero', 'name Bebas 32px', 'rol chip', 'joined mono "desde 2024-03"'] },
      { name: 'Skill bars', surface: 'calm',
        components: ['4 skill rows (Bebas value + Barlow label + filled bar)'] },
      { name: 'Season stats', surface: 'calm',
        components: ['Grid metric-minor (Partidos · Goles · Asist · Porterías · MVPs · Puntos)'] },
      { name: 'Points evolution chart', surface: 'arena',
        components: ['SVG chart with tier bands background', 'lollipops per match', 'hover tooltip mono'] },
      { name: 'Badge vitrina', surface: 'arena',
        components: ['Badge grid (unlocked vivid · locked monochrome)', 'aura-halo on newly unlocked'] },
      { name: 'Historial con rachas', surface: 'arena',
        components: ['Timeline rows (surface-arena)', 'streak chip mono "×3"', 'inkbar per result',
                     'ChipTier + DeltaChip'] },
      { name: 'Actions', surface: 'calm',
        components: ['Button ghost="Editar perfil" (if own)', 'Button ghost="Compartir"'] },
    ],
  },
  {
    route: '/perfil/editar',
    title: 'Editar perfil',
    surface: 'calm',
    purpose: 'Form: avatar, name, rol, preferencias',
    sections: [
      { name: 'Avatar picker', surface: 'calm', components: ['Avatar preview', 'emoji grid'] },
      { name: 'Form', surface: 'calm',
        components: ['Input name', 'Select rol', 'Switch notificaciones',
                     'Button primary="Guardar"', 'Button ghost="Cancelar"'] },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// ADMIN / SETTINGS
// ─────────────────────────────────────────────────────────────

export const admin: Screen[] = [
  {
    route: '/ajustes',
    title: 'Ajustes',
    surface: 'calm',
    purpose: 'Settings — theme, notifications, logout',
    sections: [
      { name: 'Sections list', surface: 'calm',
        components: ['ListRow (label + chevron)', 'ThemeToggle', 'Switch rows',
                     'Button danger="Cerrar sesión"'] },
    ],
  },
  {
    route: '/admin',
    title: 'Admin comunidad',
    surface: 'calm',
    purpose: 'Manage community (admins only): jugadores, pistas, parámetros juego',
    gated: 'role=admin',
    sections: [
      { name: 'Tabs', surface: 'calm', components: ['Tab: Jugadores · Pistas · Parámetros'] },
      { name: 'Jugadores', surface: 'calm',
        components: ['Row: Avatar + name + rol + Button ghost="editar" + Button danger="borrar"',
                     'Button primary="Añadir jugador"'] },
      { name: 'Pistas', surface: 'calm',
        components: ['Row: name + address + Button ghost "editar"', 'Button primary="Añadir pista"'],
        notes: 'Map view REMOVED on web — reserved for native app.' },
      { name: 'Parámetros', surface: 'calm',
        components: ['Slider rows (bonus MVP, bonus portería cero, etc.)'] },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// MODALS (overlays, not routes)
// ─────────────────────────────────────────────────────────────

export const modals = [
  { id: 'confirm-delete',    variant: 'bottom-sheet', surface: 'calm',
    content: 'Title + Barlow copy + Button danger + Button ghost' },
  { id: 'valorar-jugadores', variant: 'bottom-sheet', surface: 'calm',
    content: 'Player rows with 1-5 stars' },
  { id: 'add-player',        variant: 'window', surface: 'calm',
    content: 'Form: avatar picker + name + rol' },
  { id: 'vitrina-editor',    variant: 'window', surface: 'mixed',
    content: 'Badge preview (arena) + edit form (calm). Duplicate save CTA top & bottom.' },
  { id: 'team-generator',    variant: 'window', surface: 'mixed',
    content: '2-step wizard inside a modal (calm → arena)' },
  { id: 'badge-unlocked',    variant: 'window', surface: 'arena',
    content: 'BadgeArt hero + aura-halo + micro-float + Barlow copy + Button primary' },
  { id: 'mvp-reveal',        variant: 'window', surface: 'arena',
    content: 'Avatar hero + aura-halo 3s reveal + confetti SVG + name Bebas' },
  { id: 'community-pin',     variant: 'window', surface: 'calm',
    content: 'PIN pad inside modal for community unlock' },
]

// ─────────────────────────────────────────────────────────────
// EXPORT AGGREGATE — consume this for wireframe generation
// ─────────────────────────────────────────────────────────────

export const allScreens = {
  auth,
  home,
  matches,
  ranking,
  profile,
  admin,
  modals,
}

export const flowOrder = [
  '/login → /onboarding (first time only)',
  '/login → /  (returning)',
  '/  → /partido → /partido/[id] → /partido/[id]/equipos → /partido/[id]/resultado',
  '/  → /ranking',
  '/  → /perfil/[playerId] (tap any avatar)',
  '/  → /ajustes → (logout)',
]
