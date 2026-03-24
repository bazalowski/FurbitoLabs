'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import type { Player, MatchPlayer } from '@/types'

interface MvpVotingProps {
  eventId: string
  currentPlayerId: string | null
  matchPlayers: MatchPlayer[]
  allPlayers: Player[]
  communityColor: string
  officialMvp?: Player | null
}

export function MvpVoting({
  eventId,
  currentPlayerId,
  matchPlayers,
  allPlayers,
  communityColor,
  officialMvp,
}: MvpVotingProps) {
  const [myVote, setMyVote] = useState<string | null>(null)
  const [allVotes, setAllVotes] = useState<Record<string, string>>({})

  const storageKeyPrefix = `furbito_mvp_${eventId}`
  const myStorageKey = `${storageKeyPrefix}_${currentPlayerId}`

  // Participant player IDs
  const participantIds = matchPlayers.map(mp => mp.player_id)
  const isParticipant = currentPlayerId && participantIds.includes(currentPlayerId)

  // Load votes from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Load my vote
    if (currentPlayerId) {
      const saved = localStorage.getItem(myStorageKey)
      if (saved) setMyVote(saved)
    }
    // Load all votes for this event to show counts
    const votes: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(storageKeyPrefix + '_')) {
        const votedId = localStorage.getItem(key)
        if (votedId) {
          const voterId = key.replace(storageKeyPrefix + '_', '')
          votes[voterId] = votedId
        }
      }
    }
    setAllVotes(votes)
  }, [myStorageKey, storageKeyPrefix, currentPlayerId])

  function handleVote(playerId: string) {
    if (!currentPlayerId) return
    // Toggle: if already voted for this player, remove vote
    if (myVote === playerId) {
      localStorage.removeItem(myStorageKey)
      setMyVote(null)
      setAllVotes(prev => {
        const next = { ...prev }
        delete next[currentPlayerId]
        return next
      })
    } else {
      localStorage.setItem(myStorageKey, playerId)
      setMyVote(playerId)
      setAllVotes(prev => ({ ...prev, [currentPlayerId]: playerId }))
    }
  }

  // Count votes per player
  const voteCounts: Record<string, number> = {}
  Object.values(allVotes).forEach(votedId => {
    voteCounts[votedId] = (voteCounts[votedId] || 0) + 1
  })

  // Sort participants by vote count (descending)
  const votableParticipants = matchPlayers
    .filter(mp => mp.player_id !== currentPlayerId)
    .map(mp => {
      const player = mp.player ?? allPlayers.find(p => p.id === mp.player_id)
      return { mp, player, votes: voteCounts[mp.player_id] || 0 }
    })
    .sort((a, b) => b.votes - a.votes)

  // Find winner name for display
  const votedPlayer = myVote ? allPlayers.find(p => p.id === myVote) : null

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--gold, #ffd700)' }}>
        🏆 Vota al MVP
      </p>

      {officialMvp && (
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
          MVP oficial: <strong style={{ color: 'var(--gold, #ffd700)' }}>{officialMvp.name}</strong> (elegido por admin)
        </p>
      )}

      {!isParticipant && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Solo los jugadores que participaron pueden votar.
        </p>
      )}

      {isParticipant && (
        <>
          {myVote && votedPlayer && (
            <p className="text-xs mb-3" style={{ color: communityColor }}>
              Tu voto: <strong>{votedPlayer.name}</strong>
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {votableParticipants.map(({ mp, player, votes }) => {
              if (!player) return null
              const isSelected = myVote === mp.player_id
              return (
                <button
                  key={mp.player_id}
                  onClick={() => handleVote(mp.player_id)}
                  className="flex items-center gap-2 p-2.5 rounded-m transition-all active:scale-[0.97] select-none text-left"
                  style={{
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    background: isSelected ? communityColor + '22' : 'var(--card)',
                    border: `1.5px solid ${isSelected ? communityColor : 'var(--border)'}`,
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
                  {isSelected && (
                    <span style={{ color: communityColor }} className="text-sm">✓</span>
                  )}
                </button>
              )
            })}
          </div>

          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            Toca un jugador para votar. Los votos se guardan localmente.
          </p>
        </>
      )}
    </div>
  )
}
