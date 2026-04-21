// ════════════════════════════════════════════════════
//  FURBITO v2 — Types
// ════════════════════════════════════════════════════

export interface Community {
  id: string
  name: string
  pin: string
  color: string
  comm_admin_id: string | null          // legacy: primer admin
  admin_ids: string[]                   // array de IDs de admins (max 3)
  created_at: string
}

export interface Player {
  id: string
  community_id: string
  name: string
  code: string
  position: 'portero' | 'defensa' | 'centrocampista' | 'delantero' | null
  avatar: string | null
  role: 'player' | 'admin'
  xp: number
  partidos: number
  goles: number
  asistencias: number
  mvps: number
  partidos_cero: number
  badges: string[]
  vitrina: string[]
  created_at: string
}

export interface Pista {
  id: string
  community_id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  added_by: string | null
  created_at: string
}

export interface Event {
  id: string
  community_id: string
  pista_id: string | null
  titulo: string
  tipo: 'partido' | 'entrenamiento' | 'otro'
  fecha: string | null
  hora: string | null
  lugar: string | null
  max_jugadores: number
  notas: string | null
  abierto: boolean
  finalizado: boolean
  goles_a: number | null
  goles_b: number | null
  equipo_a: string[]
  equipo_b: string[]
  mvp_id: string | null
  mvp_voting_closes_at: string | null
  created_at: string
  // Joins opcionales
  pista?: Pista
  confirmations?: Confirmation[]
  match_players?: MatchPlayer[]
  mvp?: Player
}

export interface MvpVote {
  id: string
  event_id: string
  voter_id: string
  voted_id: string
  created_at: string
}

export interface Confirmation {
  id: string
  event_id: string
  player_id: string
  status: 'si' | 'no' | 'quiza'
  updated_at: string
  player?: Player
}

export interface MatchPlayer {
  id: string
  event_id: string
  player_id: string
  goles: number
  asistencias: number
  porteria_cero: boolean
  parada_penalti: boolean
  chilena: boolean
  olimpico: boolean
  tacon: boolean
  xp_ganado: number
  equipo: 'A' | 'B' | null
  player?: Player
}

export interface Vote {
  id: string
  community_id: string
  voter_id: string | null
  voted_id: string
  ataque: number
  defensa: number
  tecnica: number
  velocidad: number
  empeno: number
  created_at: string
}

// ── Tipos de sesión ────────────────────────────────
export type Role = 'guest' | 'player' | 'admin'

export interface Session {
  communityId: string
  playerId: string | null
  role: Role
}

// ── Tipos de UI ────────────────────────────────────
export type NavTab = 'home' | 'partidos' | 'jugadores' | 'ranking' | 'perfil'

export interface TeamGeneratorResult {
  teamA: ScoredPlayer[]
  teamB: ScoredPlayer[]
  sumA: string
  sumB: string
  diffPct: number
  bal: {
    color: string
    label: string
    msg: string
  }
}

export interface ScoredPlayer extends Player {
  _score: number
}

export interface PlayerRating {
  avg: number
  count: number
  bySkill: { key: string; avg: number }[]
}

// ── Tipos de juego ─────────────────────────────────
export interface Level {
  level: number
  name: string
  icon: string
  min: number
  max: number
}

export interface BadgeDef {
  icon: string
  name: string
  desc: string
  xp: number
}

export type TeamMode = 'balanced' | 'random' | 'snake' | 'captains'

// ── Tipos para formularios ─────────────────────────
export interface NewEventForm {
  titulo: string
  tipo: 'partido' | 'entrenamiento' | 'otro'
  fecha: string
  hora: string
  lugar: string
  max_jugadores: number
  notas: string
  pista_id: string
  abierto: boolean
}

export interface PostMatchForm {
  goles_a: number
  goles_b: number
  equipo_a: string[]
  equipo_b: string[]
  mvp_id: string
  stats: Record<string, MatchPlayerStats>
}

export interface MatchPlayerStats {
  goles: number
  asistencias: number
  porteria_cero: boolean
  parada_penalti: boolean
  chilena: boolean
  olimpico: boolean
  tacon: boolean
}
