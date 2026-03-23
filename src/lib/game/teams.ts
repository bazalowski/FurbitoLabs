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

// ── Captains (snake draft con los 2 mejores como capitanes) ──
export function generateTeamsCaptains(players: Player[], votes: Vote[]): TeamGeneratorResult | null {
  if (players.length < 2) return null

  const scored = players
    .map(p => ({ ...p, _score: playerScore(p, votes) }))
    .sort((a, b) => b._score - a._score)

  // Top 2 are captains
  const teamA: ScoredPlayer[] = [scored[0]]
  const teamB: ScoredPlayer[] = [scored[1]]

  // Remaining players sorted by score (already sorted)
  const remaining = scored.slice(2)

  // Snake draft: Captain A pick 1, Captain B picks 2-3, Captain A picks 4-5, etc.
  // After captains are assigned, remaining picks alternate in snake fashion
  // Round 0: B gets pick (since A already got the better captain)
  // Round 1: A, B
  // Round 2: B, A
  // etc. — standard snake starting with B
  let pickA = true // first remaining pick goes to A? No — B gets first pick to compensate
  // Actually: Captain A = best player (pick 1). Captain B = 2nd best (pick 2).
  // Then Captain B gets picks 3-4 (two in a row), Captain A gets picks 5-6, etc.
  // Snake: A gets odd rounds, B gets even rounds — but since A already has better captain,
  // B picks first from remaining, then A-A, B-B, A-A...
  remaining.forEach((p, i) => {
    // i=0: B picks (to compensate for A having best player)
    // i=1,2: A picks
    // i=3,4: B picks
    // i=5,6: A picks ...
    // After first pick by B, it becomes standard snake in pairs
    if (i === 0) {
      teamB.push(p)
    } else {
      // Adjust index: i-1 gives 0,1,2,3,4,5...
      // Pairs: 0-1 -> A, 2-3 -> B, 4-5 -> A...
      const pair = Math.floor((i - 1) / 2)
      if (pair % 2 === 0) teamA.push(p)
      else                 teamB.push(p)
    }
  })

  const sumA = teamA.reduce((s, p) => s + p._score, 0)
  const sumB = teamB.reduce((s, p) => s + p._score, 0)
  return buildBalance(sumA, sumB, teamA, teamB)
}

// ── Dispatcher ────────────────────────────────────────
export function generateTeamsByMode(
  mode: 'balanced' | 'random' | 'snake' | 'captains',
  players: Player[],
  votes: Vote[]
): TeamGeneratorResult | null {
  if (mode === 'random')   return generateTeamsRandom(players, votes)
  if (mode === 'snake')    return generateTeamsSnake(players, votes)
  if (mode === 'captains') return generateTeamsCaptains(players, votes)
  return generateTeamsBalanced(players, votes)
}
