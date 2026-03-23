import type { Player, Vote, TeamGeneratorResult, ScoredPlayer } from '@/types'
import { playerScore } from './scoring'

function buildBalance(sumA: number, sumB: number, teamA: ScoredPlayer[], teamB: ScoredPlayer[]): TeamGeneratorResult {
  const mx = Math.max(sumA, sumB, 1)
  const diffPct = Math.round((Math.abs(sumA - sumB) / mx) * 100)

  let bal: TeamGeneratorResult['bal']
  if (diffPct > 25)      bal = { color: '#ff5c5c', label: '🔴 Muy desnivelado', msg: 'Los equipos están muy descompensados' }
  else if (diffPct > 15) bal = { color: '#ff9030', label: '🟠 Desnivelado',     msg: 'Considera mover algún jugador' }
  else if (diffPct > 5)  bal = { color: '#facc15', label: '🟡 Aceptable',       msg: 'Puede haber algo de diferencia' }
  else                    bal = { color: '#a8ff3e', label: '🟢 Muy equilibrado', msg: '¡Partido igualado garantizado!' }

  return { teamA, teamB, sumA: sumA.toFixed(1), sumB: sumB.toFixed(1), diffPct, bal }
}

// ── Algoritmo equilibrado (greedy + swap) ─────────────
export function generateTeamsBalanced(players: Player[], votes: Vote[]): TeamGeneratorResult | null {
  if (players.length < 2) return null

  let scored: ScoredPlayer[] = players
    .map(p => ({ ...p, _score: playerScore(p, votes) }))
    .sort((a, b) => b._score - a._score)

  // Jitter para variedad
  scored = scored
    .map(p => ({ ...p, _jitter: p._score + (Math.random() - 0.5) * 0.3 }))
    .sort((a, b) => (b as any)._jitter - (a as any)._jitter)

  const teamA: ScoredPlayer[] = []
  const teamB: ScoredPlayer[] = []
  let sumA = 0, sumB = 0

  scored.forEach((p, i) => {
    if (i % 2 === 0) { teamA.push(p); sumA += p._score }
    else              { teamB.push(p); sumB += p._score }
  })

  // Swap para mejorar equilibrio (30 iteraciones)
  for (let it = 0; it < 30; it++) {
    let improved = false
    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        const prev = Math.abs(sumA - sumB)
        const nA = sumA - teamA[i]._score + teamB[j]._score
        const nB = sumB - teamB[j]._score + teamA[i]._score
        if (Math.abs(nA - nB) < prev) {
          ;[teamA[i], teamB[j]] = [teamB[j], teamA[i]]
          sumA = nA
          sumB = nB
          improved = true
        }
      }
    }
    if (!improved) break
  }

  return buildBalance(sumA, sumB, teamA, teamB)
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

// ── Snake draft (serpenteo por nivel) ────────────────
export function generateTeamsSnake(players: Player[], votes: Vote[]): TeamGeneratorResult | null {
  if (players.length < 2) return null

  const scored = players
    .map(p => ({ ...p, _score: playerScore(p, votes) }))
    .sort((a, b) => b._score - a._score)

  const teamA: ScoredPlayer[] = []
  const teamB: ScoredPlayer[] = []

  scored.forEach((p, i) => {
    const round = Math.floor(i / 2)
    const pick = i % 2
    if (round % 2 === 0) {
      if (pick === 0) teamA.push(p)
      else             teamB.push(p)
    } else {
      if (pick === 0) teamB.push(p)
      else             teamA.push(p)
    }
  })

  const sumA = teamA.reduce((s, p) => s + p._score, 0)
  const sumB = teamB.reduce((s, p) => s + p._score, 0)
  return buildBalance(sumA, sumB, teamA, teamB)
}

// ── Dispatcher ────────────────────────────────────────
export function generateTeamsByMode(
  mode: 'balanced' | 'random' | 'snake',
  players: Player[],
  votes: Vote[]
): TeamGeneratorResult | null {
  if (mode === 'random') return generateTeamsRandom(players, votes)
  if (mode === 'snake')  return generateTeamsSnake(players, votes)
  return generateTeamsBalanced(players, votes)
}
