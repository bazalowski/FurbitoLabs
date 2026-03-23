import type { Player, Vote, PlayerRating, ScoredPlayer } from '@/types'

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
