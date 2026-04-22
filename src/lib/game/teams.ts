import type { Player, Vote, TeamGeneratorResult, ScoredPlayer } from '@/types'
import { getPlayerRating, playerScore } from './scoring'

// ════════════════════════════════════════════════════
//  Generador de equipos — algoritmo "equilibrado" v2
// ════════════════════════════════════════════════════
//
// Cada jugador tiene 5 atributos: ataque, defensa, técnica, velocidad, empeño.
// Relaciones de diseño (ocultas al usuario, influyen en la ecuación):
//
//   • Ataque ↔ Defensa → RIVALES.   Un equipo con mucho atk pero poca def
//     es vidrioso; mucho def sin atk es estéril. El factor rival premia el
//     balance INTERNO del equipo: 2·√(atk·def) es máximo cuando atk = def
//     (media geométrica).
//
//   • Técnica → SUELTO.             Contribución puramente aditiva, lineal.
//
//   • Velocidad ↔ Empeño → COMPLEMENTARIOS. Un equipo rápido pero sin
//     empeño corre sin cerrar; mucho empeño sin velocidad solo aguanta. Se
//     potencian mutuamente: 2·√(vel·emp) penaliza cualquier descompensación.
//
// Pesos (suman 1.0):  rival=0.45 (eje dominante), tec=0.20, sinergia=0.35.
// Por defecto (sin votos) cada atributo vale 2.5 / 5 — el jugador es "neutro".
//
// El generador intenta que `teamPower(A) ≈ teamPower(B)`: no basta con que
// las medias cuadren, también deben cuadrar las sub-sumas de atk/def/vel/emp
// porque la potencia del equipo depende de ellas por separado.

const WEIGHTS = { rival: 0.45, tec: 0.20, synergy: 0.35 } as const

interface SkillVector {
  atk: number
  def: number
  tec: number
  vel: number
  emp: number
}

const NEUTRAL: SkillVector = { atk: 2.5, def: 2.5, tec: 2.5, vel: 2.5, emp: 2.5 }

function skillsFromVotes(playerId: string, votes: Vote[]): SkillVector {
  const rating = getPlayerRating(playerId, votes)
  if (!rating) return NEUTRAL
  const get = (key: string) => rating.bySkill.find(s => s.key === key)?.avg ?? 2.5
  return {
    atk: get('ataque'),
    def: get('defensa'),
    tec: get('tecnica'),
    vel: get('velocidad'),
    emp: get('empeno'),
  }
}

function power(s: SkillVector): number {
  const rival   = 2 * Math.sqrt(Math.max(0, s.atk * s.def))
  const synergy = 2 * Math.sqrt(Math.max(0, s.vel * s.emp))
  return WEIGHTS.rival * rival + WEIGHTS.tec * s.tec + WEIGHTS.synergy * synergy
}

function teamProfile(team: ScoredPlayer[], skillsById: Map<string, SkillVector>): SkillVector {
  const acc: SkillVector = { atk: 0, def: 0, tec: 0, vel: 0, emp: 0 }
  for (const p of team) {
    const s = skillsById.get(p.id) ?? NEUTRAL
    acc.atk += s.atk; acc.def += s.def; acc.tec += s.tec; acc.vel += s.vel; acc.emp += s.emp
  }
  return acc
}

function teamPower(team: ScoredPlayer[], skillsById: Map<string, SkillVector>): number {
  return power(teamProfile(team, skillsById))
}

function buildBalance(pA: number, pB: number, teamA: ScoredPlayer[], teamB: ScoredPlayer[]): TeamGeneratorResult {
  const mx = Math.max(pA, pB, 1)
  const diffPct = Math.round((Math.abs(pA - pB) / mx) * 100)

  let bal: TeamGeneratorResult['bal']
  if (diffPct > 25)      bal = { color: '#ff5c5c', label: '🔴 Muy desnivelado', msg: 'Los equipos están muy descompensados' }
  else if (diffPct > 15) bal = { color: '#ff9030', label: '🟠 Desnivelado',     msg: 'Considera mover algún jugador' }
  else if (diffPct > 5)  bal = { color: '#facc15', label: '🟡 Aceptable',       msg: 'Puede haber algo de diferencia' }
  else                    bal = { color: '#a8ff3e', label: '🟢 Muy equilibrado', msg: '¡Partido igualado garantizado!' }

  return { teamA, teamB, sumA: pA.toFixed(1), sumB: pB.toFixed(1), diffPct, bal }
}

// ── Algoritmo equilibrado (greedy + swap pair-wise sobre teamPower) ─────
export function generateTeamsBalanced(players: Player[], votes: Vote[]): TeamGeneratorResult | null {
  if (players.length < 2) return null

  // 1. Skills y power individual para cada jugador
  const skillsById = new Map<string, SkillVector>()
  const scored: ScoredPlayer[] = players.map(p => {
    const s = skillsFromVotes(p.id, votes)
    skillsById.set(p.id, s)
    return { ...p, _score: parseFloat(power(s).toFixed(2)) }
  })

  // 2. Draft alternativo ordenado por power con ligero jitter para variedad
  //    entre regeneraciones (el usuario pulsa "🔄 Regenerar" y quiere combis
  //    diferentes, no la misma una y otra vez).
  const jittered = scored
    .map(p => ({ p, j: p._score + (Math.random() - 0.5) * 0.35 }))
    .sort((a, b) => b.j - a.j)
    .map(x => x.p)

  const teamA: ScoredPlayer[] = []
  const teamB: ScoredPlayer[] = []
  jittered.forEach((p, i) => { (i % 2 === 0 ? teamA : teamB).push(p) })

  // 3. Swap pair-wise: prueba cada par (A[i], B[j]) y acepta si reduce el
  //    |powerA − powerB|. Hasta 40 pasadas sin mejora.
  let pA = teamPower(teamA, skillsById)
  let pB = teamPower(teamB, skillsById)

  for (let it = 0; it < 40; it++) {
    let improved = false
    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        const origA = teamA[i]
        const origB = teamB[j]
        teamA[i] = origB
        teamB[j] = origA
        const nA = teamPower(teamA, skillsById)
        const nB = teamPower(teamB, skillsById)
        if (Math.abs(nA - nB) < Math.abs(pA - pB) - 0.001) {
          pA = nA; pB = nB
          improved = true
        } else {
          teamA[i] = origA
          teamB[j] = origB
        }
      }
    }
    if (!improved) break
  }

  return buildBalance(pA, pB, teamA, teamB)
}

// ── Aleatorio (Fisher-Yates) ──────────────────────────
export function generateTeamsRandom(players: Player[], votes: Vote[]): TeamGeneratorResult | null {
  if (players.length < 2) return null

  const scored = players.map(p => ({ ...p, _score: playerScore(p, votes) }))
  for (let i = scored.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[scored[i], scored[j]] = [scored[j], scored[i]]
  }

  const teamA: ScoredPlayer[] = []
  const teamB: ScoredPlayer[] = []
  scored.forEach((p, i) => {
    if (i % 2 === 0) teamA.push(p)
    else              teamB.push(p)
  })

  const sumA = teamA.reduce((s, p) => s + p._score, 0)
  const sumB = teamB.reduce((s, p) => s + p._score, 0)
  return buildBalance(sumA, sumB, teamA, teamB)
}

// ── Dispatcher ────────────────────────────────────────
export function generateTeamsByMode(
  mode: 'balanced' | 'random',
  players: Player[],
  votes: Vote[]
): TeamGeneratorResult | null {
  if (mode === 'random') return generateTeamsRandom(players, votes)
  return generateTeamsBalanced(players, votes)
}
