'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { SKILLS } from '@/lib/game/scoring'
import type { Player, Vote } from '@/types'

interface PostMatchRatingProps {
  communityId: string
  currentPlayerId: string
  participants: Player[]
  communityColor: string
}

export function PostMatchRating({
  communityId,
  currentPlayerId,
  participants,
  communityColor,
}: PostMatchRatingProps) {
  const [existingVotes, setExistingVotes] = useState<Vote[]>([])
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const otherParticipants = participants.filter(p => p.id !== currentPlayerId)

  // Load existing votes from this voter
  const loadVotes = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('votes')
      .select('*')
      .eq('community_id', communityId)
      .eq('voter_id', currentPlayerId)
    setExistingVotes(data ?? [])
    setLoading(false)
  }, [communityId, currentPlayerId])

  useEffect(() => { loadVotes() }, [loadVotes])

  function getExistingVote(playerId: string): Vote | undefined {
    return existingVotes.find(v => v.voted_id === playerId)
  }

  function isRated(playerId: string): boolean {
    return !!getExistingVote(playerId)
  }

  function setSkillRating(playerId: string, skill: string, value: number) {
    setRatings(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] ?? {}), [skill]: value },
    }))
  }

  async function submitRating(playerId: string) {
    const playerRatings = ratings[playerId]
    if (!playerRatings) { showToast('Puntua todas las habilidades'); return }
    const allFilled = SKILLS.every(s => playerRatings[s.key] >= 1 && playerRatings[s.key] <= 5)
    if (!allFilled) { showToast('Puntua todas las habilidades'); return }

    setSaving(prev => ({ ...prev, [playerId]: true }))
    const supabase = createClient()
    const payload = {
      community_id: communityId,
      voter_id: currentPlayerId,
      voted_id: playerId,
      ...playerRatings,
    }

    const existing = getExistingVote(playerId)
    if (existing) {
      await supabase.from('votes').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('votes').insert(payload)
    }

    showToast('Valoracion guardada')
    setSaving(prev => ({ ...prev, [playerId]: false }))
    setExpanded(null)
    await loadVotes()
  }

  if (loading) return null

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
        Valorar jugadores
      </p>

      <div className="space-y-2">
        {otherParticipants.map(player => {
          const rated = isRated(player.id)
          const isExpanded = expanded === player.id
          const playerRatings = ratings[player.id] ?? {}
          const isSaving = saving[player.id]

          return (
            <Card key={player.id}>
              {/* Player header - clickable to expand */}
              <button
                onClick={() => {
                  if (isExpanded) {
                    setExpanded(null)
                  } else {
                    // Pre-fill with existing vote if editing
                    const existing = getExistingVote(player.id)
                    if (existing) {
                      const prefill: Record<string, number> = {}
                      SKILLS.forEach(s => {
                        prefill[s.key] = existing[s.key as keyof Vote] as number
                      })
                      setRatings(prev => ({ ...prev, [player.id]: prefill }))
                    }
                    setExpanded(player.id)
                  }
                }}
                className="flex items-center gap-2 w-full text-left select-none"
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
              >
                <PlayerAvatar player={player} size={32} communityColor={communityColor} />
                <span className="text-sm font-semibold flex-1 truncate">{player.name}</span>
                {rated && (
                  <span className="text-xs font-bold" style={{ color: communityColor }}>
                    Valorado
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Rating form (expanded) */}
              {isExpanded && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {SKILLS.map(skill => (
                    <div key={skill.key} className="mb-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
                          {skill.icon} {skill.label}
                        </span>
                        <span className="text-xs font-bold" style={{ color: communityColor }}>
                          {playerRatings[skill.key] ?? '—'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            onClick={() => setSkillRating(player.id, skill.key, v)}
                            className="flex-1 py-2 rounded text-xs font-bold transition-all active:scale-[0.95] select-none"
                            style={{
                              minHeight: '36px',
                              WebkitUserSelect: 'none',
                              userSelect: 'none',
                              background: (playerRatings[skill.key] ?? 0) >= v ? communityColor : 'var(--card2, var(--card))',
                              color: (playerRatings[skill.key] ?? 0) >= v ? '#050d05' : 'var(--muted)',
                              border: `1px solid ${(playerRatings[skill.key] ?? 0) >= v ? 'transparent' : 'var(--border)'}`,
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={() => submitRating(player.id)}
                    disabled={isSaving}
                    className="w-full mt-1"
                    size="sm"
                  >
                    {isSaving ? 'Guardando...' : rated ? 'Actualizar valoracion' : 'Enviar valoracion'}
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
        Valora a los jugadores del 1 al 5 en cada habilidad.
      </p>
    </div>
  )
}
