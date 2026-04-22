import type { MatchPlayerStats, Player, Vote, PlayerRating, ScoredPlayer } from '@/types'

// ════════════════════════════════════════════════════
//  Puntuación Comunio por partido
// ════════════════════════════════════════════════════
export const MATCH_POINTS = {
  partido: 3,        // por partido jugado
  gol: 2,            // por cada gol
  asistencia: 1,     // por cada asistencia
  porteria_cero: 2,  // por cada portería a cero (rotación de porteros: puede sumarse varias veces)
} as const

export interface MatchPointsBreakdown {
  partido: number
  goles: number
  asistencias: number
  porterias: number
  total: number
}

type PointsInput = Pick<MatchPlayerStats, 'goles' | 'asistencias' | 'porteria_cero'>

export function calcMatchPoints(mp: PointsInput): MatchPointsBreakdown {
  const partido      = MATCH_POINTS.partido
  const goles        = mp.goles * MATCH_POINTS.gol
  const asistencias  = mp.asistencias * MATCH_POINTS.asistencia
  const porterias    = mp.porteria_cero * MATCH_POINTS.porteria_cero
  return { partido, goles, asistencias, porterias, total: partido + goles + asistencias + porterias }
}

// ── Tiers visuales ─────────────────────────────────
export type PointsTier = 'mal' | 'regular' | 'bueno' | 'excelente' | 'leyenda'

export interface TierMeta {
  key: PointsTier
  label: string
  /** Color sólido base del tier (para bordes/chips). */
  color: string
  /** Degradado de fondo (usable como CSS `background`). */
  gradient: string
  /** Sombra/halo para el chip del total. */
  glow: string
  /** Color de texto contrastado sobre `gradient`. */
  fg: string
}

const TIERS: TierMeta[] = [
  {
    key: 'mal', label: 'Mal partido',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)',
    glow:    '0 0 0 1px #ef444466, 0 6px 18px -6px #ef444488',
    fg: '#fff5f5',
  },
  {
    key: 'regular', label: 'Partido regular',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
    glow:    '0 0 0 1px #f9731666, 0 6px 18px -6px #f9731688',
    fg: '#fff7ed',
  },
  {
    key: 'bueno', label: 'Buen partido',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #14532d 0%, #22c55e 100%)',
    glow:    '0 0 0 1px #22c55e66, 0 6px 18px -6px #22c55e88',
    fg: '#f0fdf4',
  },
  {
    key: 'excelente', label: 'Partido excelente',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
    glow:    '0 0 0 1px #06b6d466, 0 8px 22px -6px #06b6d488',
    fg: '#ecfeff',
  },
  {
    key: 'leyenda', label: 'Partido de leyenda',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #a855f7)',
    glow:    '0 0 0 1px #ffffff33, 0 10px 28px -6px #a855f788',
    fg: '#ffffff',
  },
]

const TIERS_BY_KEY: Record<PointsTier, TierMeta> = {
  mal: TIERS[0], regular: TIERS[1], bueno: TIERS[2], excelente: TIERS[3], leyenda: TIERS[4],
}

export function getPointsTier(points: number): TierMeta {
  if (points >= 20) return TIERS_BY_KEY.leyenda
  if (points >= 11) return TIERS_BY_KEY.excelente
  if (points >= 8)  return TIERS_BY_KEY.bueno
  if (points >= 5)  return TIERS_BY_KEY.regular
  return TIERS_BY_KEY.mal
}


export const SKILLS = [
  { key: 'ataque',    label: 'Ataque',    icon: '⚔️'  },
  { key: 'defensa',   label: 'Defensa',   icon: '🛡️'  },
  { key: 'tecnica',   label: 'Técnica',   icon: '🎯'  },
  { key: 'velocidad', label: 'Velocidad', icon: '⚡'  },
  { key: 'empeno',    label: 'Empeño',    icon: '💪'  },
]

export function getPlayerRating(playerId: string, votes: Vote[]): PlayerRating | null {
  const playerVotes = votes.filter(v => v.voted_id === playerId)
  if (playerVotes.length < 1) return null

  const avg =
    playerVotes.reduce(
      (sum, v) => sum + (v.ataque + v.defensa + v.tecnica + v.velocidad + v.empeno) / 5,
      0
    ) / playerVotes.length

  const bySkill = SKILLS.map(sk => ({
    key: sk.key,
    avg: parseFloat(
      (
        playerVotes.reduce((s, v) => s + (v[sk.key as keyof Vote] as number), 0) /
        playerVotes.length
      ).toFixed(2)
    ),
  }))

  return {
    avg: parseFloat(avg.toFixed(2)),
    count: playerVotes.length,
    bySkill,
  }
}

export function playerScore(player: Player, votes: Vote[]): number {
  const gpp = player.partidos > 0 ? Math.min(5, (player.goles / player.partidos) * 2.5) : 2.5
  const app = player.partidos > 0 ? Math.min(5, (player.asistencias / player.partidos) * 3.33) : 2.5
  const mvpR = player.partidos > 0 ? (player.mvps / player.partidos) * 5 : 2.5
  const statsScore = gpp * 0.4 + app * 0.3 + mvpR * 0.3

  const rating = getPlayerRating(player.id, votes)
  const ratingScore = rating ? (rating.avg - 1) * 1.25 : 2.5

  return parseFloat(((statsScore + ratingScore) / 2).toFixed(2))
}

export function scoreAllPlayers(players: Player[], votes: Vote[]): ScoredPlayer[] {
  return players.map(p => ({ ...p, _score: playerScore(p, votes) }))
}
