'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { showToast } from '@/components/ui/Toast'
import { useMvpVotes } from '@/hooks/useMvpVotes'
import type { Player, MatchPlayer } from '@/types'

interface MvpVotingProps {
  eventId: string
  currentPlayerId: string | null
  matchPlayers: MatchPlayer[]
  allPlayers: Player[]
  communityColor: string
  officialMvp?: Player | null
  closesAt?: string | null  // ISO timestamp; null = sin límite
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'cerrada'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h >= 1) return `${h}h ${m}m`
  return `${m}m`
}

export function MvpVoting({
  eventId,
  currentPlayerId,
  matchPlayers,
  allPlayers,
  communityColor,
  officialMvp,
  closesAt,
}: MvpVotingProps) {
  const { votes, reload } = useMvpVotes(eventId)
  const [submitting, setSubmitting] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Tick cada minuto para refrescar el cuentaatrás y el estado abierto/cerrado
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const closesAtMs = closesAt ? new Date(closesAt).getTime() : null
  const isClosed = closesAtMs !== null && now >= closesAtMs
  const remainingMs = closesAtMs !== null ? closesAtMs - now : null

  const participantIds = useMemo(() => matchPlayers.map(mp => mp.player_id), [matchPlayers])
  const isParticipant = currentPlayerId !== null && participantIds.includes(currentPlayerId)

  const myVote = useMemo(
    () => votes.find(v => v.voter_id === currentPlayerId)?.voted_id ?? null,
    [votes, currentPlayerId],
  )

  const voteCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of votes) m[v.voted_id] = (m[v.voted_id] ?? 0) + 1
    return m
  }, [votes])

  const sortedParticipants = useMemo(() => {
    return matchPlayers
      .filter(mp => mp.player_id !== currentPlayerId)
      .map(mp => {
        const player = mp.player ?? allPlayers.find(p => p.id === mp.player_id)
        return { mp, player, votes: voteCounts[mp.player_id] ?? 0 }
      })
      .sort((a, b) => b.votes - a.votes)
  }, [matchPlayers, allPlayers, voteCounts, currentPlayerId])

  // Ganador del voto popular (solo relevante cuando está cerrada)
  const voteWinner = useMemo(() => {
    if (votes.length === 0) return null
    const ranked = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])
    if (!ranked.length) return null
    return { playerId: ranked[0][0], count: ranked[0][1] }
  }, [votes, voteCounts])
  const winnerPlayer = voteWinner
    ? allPlayers.find(p => p.id === voteWinner.playerId) ?? null
    : null

  async function handleVote(votedPlayerId: string) {
    if (!currentPlayerId || submitting || isClosed) return
    setSubmitting(true)
    const supabase = createClient()

    // Toggle: si ya votaste a ese jugador, retira el voto
    if (myVote === votedPlayerId) {
      await supabase
        .from('mvp_votes')
        .delete()
        .eq('event_id', eventId)
        .eq('voter_id', currentPlayerId)
      showToast('Voto retirado')
    } else {
      // upsert por (event_id, voter_id)
      await supabase
        .from('mvp_votes')
        .upsert(
          { event_id: eventId, voter_id: currentPlayerId, voted_id: votedPlayerId },
          { onConflict: 'event_id,voter_id' },
        )
      showToast('Voto registrado')
    }
    await reload()
    setSubmitting(false)
  }

  const myVotedPlayer = myVote ? allPlayers.find(p => p.id === myVote) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--gold, #ffd700)' }}>
          🏆 {isClosed ? 'Votación MVP cerrada' : 'Vota al MVP'}
        </p>
        {!isClosed && remainingMs !== null && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--card2)', color: 'var(--muted)' }}>
            ⏱ {formatRemaining(remainingMs)}
          </span>
        )}
      </div>

      {officialMvp && (
        <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
          MVP oficial: <strong style={{ color: 'var(--gold, #ffd700)' }}>{officialMvp.name}</strong> (elegido por admin)
        </p>
      )}

      {isClosed && winnerPlayer && (
        <div
          className="flex items-center gap-2 p-2.5 rounded-m mb-3"
          style={{ background: communityColor + '15', border: `1px solid ${communityColor}44` }}
        >
          <PlayerAvatar player={winnerPlayer} size={32} communityColor={communityColor} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--muted)' }}>Voto popular</p>
            <p className="text-sm font-bold truncate">{winnerPlayer.name}</p>
          </div>
          <span className="text-xs font-bold" style={{ color: communityColor }}>
            {voteWinner?.count} voto{voteWinner?.count === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {!isParticipant && !isClosed && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Solo los jugadores que participaron pueden votar.
        </p>
      )}

      {isParticipant && (
        <>
          {!isClosed && myVotedPlayer && (
            <p className="text-xs mb-3" style={{ color: communityColor }}>
              Tu voto: <strong>{myVotedPlayer.name}</strong>
            </p>
          )}
          {isClosed && myVotedPlayer && (
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
              Votaste a <strong>{myVotedPlayer.name}</strong>
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {sortedParticipants.map(({ mp, player, votes }) => {
              if (!player) return null
              const isSelected = myVote === mp.player_id
              const isWinner = isClosed && voteWinner?.playerId === mp.player_id
              return (
                <button
                  key={mp.player_id}
                  onClick={() => handleVote(mp.player_id)}
                  disabled={isClosed || submitting}
                  className="flex items-center gap-2 p-2.5 rounded-m transition-all active:scale-[0.97] select-none text-left disabled:opacity-90"
                  style={{
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    background: isWinner
                      ? communityColor + '22'
                      : isSelected
                      ? communityColor + '22'
                      : 'var(--card)',
                    border: `1.5px solid ${
                      isWinner ? communityColor : isSelected ? communityColor : 'var(--border)'
                    }`,
                    cursor: isClosed ? 'default' : 'pointer',
                  }}
                >
                  <PlayerAvatar player={player} size={32} communityColor={communityColor} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{player.name}</p>
                    {votes > 0 && (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {votes} voto{votes !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {isWinner && <span className="text-sm">🏆</span>}
                  {!isClosed && isSelected && (
                    <span style={{ color: communityColor }} className="text-sm">✓</span>
                  )}
                </button>
              )
            })}
          </div>

          {!isClosed && (
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
              Toca un jugador para votar. Puedes cambiar tu voto hasta el cierre.
            </p>
          )}
        </>
      )}
    </div>
  )
}
