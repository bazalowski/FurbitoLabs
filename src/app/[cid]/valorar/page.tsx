'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { showToast } from '@/components/ui/Toast'
import { useSession } from '@/stores/session'
import { usePlayers } from '@/hooks/usePlayers'
import { createClient } from '@/lib/supabase/client'
import { SKILLS } from '@/lib/game/scoring'
import type { Player, Vote } from '@/types'

type Step = 'select' | 'rate' | 'done'
type Ratings = Record<string, number>

interface ValorarPageProps {
  params: { cid: string }
}

export default function ValorarPage({ params }: ValorarPageProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()
  const { players, loading: playersLoading } = usePlayers(cid)

  const [step, setStep] = useState<Step>('select')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [ratings, setRatings] = useState<Ratings>({})
  const [existingVotes, setExistingVotes] = useState<Vote[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [votesLoading, setVotesLoading] = useState(true)

  const communityColor = session.communityColor || '#a8ff3e'

  // Fetch existing votes by this voter
  const loadExistingVotes = useCallback(async () => {
    if (!session.playerId) { setVotesLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('votes')
      .select('*')
      .eq('community_id', cid)
      .eq('voter_id', session.playerId)
    setExistingVotes(data ?? [])
    setVotesLoading(false)
  }, [cid, session.playerId])

  useEffect(() => { loadExistingVotes() }, [loadExistingVotes])

  // Players excluding current user
  const otherPlayers = useMemo(
    () => players.filter(p => p.id !== session.playerId),
    [players, session.playerId]
  )

  // Set of already-rated player IDs
  const ratedIds = useMemo(
    () => new Set(existingVotes.map(v => v.voted_id)),
    [existingVotes]
  )

  // When selecting a player, go to rate step (blocked if already voted)
  function handleSelectPlayer(player: Player) {
    if (ratedIds.has(player.id)) {
      showToast('Solo puedes valorar una vez a cada jugador')
      return
    }
    setSelectedPlayer(player)
    setRatings({})
    setStep('rate')
  }

  function handleRate(skill: string, value: number) {
    setRatings(prev => ({ ...prev, [skill]: value }))
  }

  const allRated = SKILLS.every(s => ratings[s.key] !== undefined && ratings[s.key] > 0)

  async function handleSubmit() {
    if (!selectedPlayer || !session.playerId || !allRated) return
    if (ratedIds.has(selectedPlayer.id)) {
      showToast('Ya has valorado a este jugador')
      setStep('select')
      return
    }
    setSubmitting(true)

    const supabase = createClient()

    const voteData = {
      community_id: cid,
      voter_id: session.playerId,
      voted_id: selectedPlayer.id,
      ataque: ratings.ataque,
      defensa: ratings.defensa,
      tecnica: ratings.tecnica,
      velocidad: ratings.velocidad,
      empeno: ratings.empeno,
    }

    const { error } = await supabase.from('votes').insert(voteData)

    setSubmitting(false)

    if (error) {
      showToast('Error al enviar la valoracion')
      return
    }

    await loadExistingVotes()
    setStep('done')
  }

  function handleRateAnother() {
    setSelectedPlayer(null)
    setRatings({})
    setStep('select')
  }

  const loading = playersLoading || votesLoading

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Valorar companeros"
        left={
          <button
            onClick={() => step === 'rate' ? setStep('select') : router.push(`/${cid}`)}
            className="w-11 h-11 flex items-center justify-center rounded-full active:scale-[0.97] select-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', WebkitUserSelect: 'none' }}
          >
            <span className="text-lg">{'\u2190'}</span>
          </button>
        }
      />

      <div className="flex-1 px-4 pb-6 view-enter">
        {/* ── STEP 1: SELECT ── */}
        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              Selecciona un companero para valorar sus habilidades
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>Cargando jugadores...</span>
              </div>
            ) : otherPlayers.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>No hay jugadores para valorar</span>
              </div>
            ) : (
              otherPlayers.map(player => (
                <Card
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  className="flex items-center gap-4 min-h-[56px] active:scale-[0.97] select-none cursor-pointer"
                  style={{ WebkitUserSelect: 'none' }}
                >
                  <PlayerAvatar player={player} size={44} communityColor={communityColor} />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm truncate block">{player.name}</span>
                    {player.position && (
                      <span className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
                        {player.position}
                      </span>
                    )}
                  </div>
                  {ratedIds.has(player.id) && (
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-1 rounded-full select-none"
                      style={{ background: '#22c55e22', color: '#22c55e' }}
                    >
                      Valorado
                    </span>
                  )}
                  <span className="text-lg" style={{ color: 'var(--muted)' }}>{'\u203A'}</span>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ── STEP 2: RATE ── */}
        {step === 'rate' && selectedPlayer && (
          <div className="space-y-5 view-enter">
            {/* Player header */}
            <div className="flex flex-col items-center gap-3 py-4">
              <PlayerAvatar player={selectedPlayer} size={64} communityColor={communityColor} />
              <span className="font-bebas text-xl tracking-wider">{selectedPlayer.name}</span>
              <span className="text-[10px] text-center" style={{ color: 'var(--muted)' }}>
                Solo puedes valorar una vez. No podrás cambiarlo después.
              </span>
            </div>

            {/* Skill rows */}
            <div className="space-y-3">
              {SKILLS.map(skill => (
                <Card key={skill.key} className="flex items-center gap-3 py-3 px-4">
                  <span className="text-xl w-8 text-center flex-shrink-0">{skill.icon}</span>
                  <span className="text-sm font-bold flex-1 min-w-0">{skill.label}</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(value => {
                      const active = (ratings[skill.key] ?? 0) >= value
                      return (
                        <button
                          key={value}
                          onClick={() => handleRate(skill.key, value)}
                          className="select-none active:scale-[0.97] transition-all"
                          style={{
                            width: 36,
                            height: 36,
                            minWidth: 36,
                            minHeight: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 8,
                            background: active ? communityColor : 'var(--card)',
                            border: `2px solid ${active ? communityColor : 'var(--border)'}`,
                            color: active ? '#050d05' : 'var(--muted)',
                            fontWeight: 700,
                            fontSize: 14,
                            WebkitUserSelect: 'none',
                            userSelect: 'none',
                            WebkitTapHighlightColor: 'transparent',
                            transition: 'all .15s ease',
                          }}
                          aria-label={`${skill.label} ${value}`}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={!allRated || submitting}
              className="w-full"
              size="lg"
              style={allRated ? { background: communityColor, color: '#050d05' } : undefined}
            >
              {submitting ? 'Enviando...' : 'Enviar valoracion'}
            </Button>
          </div>
        )}

        {/* ── STEP 3: DONE ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center gap-6 py-16 view-enter">
            {/* Checkmark animation */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: communityColor + '22',
                border: `3px solid ${communityColor}`,
                animation: 'scaleIn .4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <span className="text-4xl" style={{ color: communityColor }}>{'\u2713'}</span>
            </div>

            <div className="text-center space-y-2">
              <h2 className="font-bebas text-2xl tracking-wider">Valoracion enviada</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Tu valoracion de {selectedPlayer?.name} se ha guardado correctamente
              </p>
            </div>

            <Button
              onClick={handleRateAnother}
              size="lg"
              className="w-full max-w-xs"
              style={{ background: communityColor, color: '#050d05' }}
            >
              Valorar otro companero
            </Button>
          </div>
        )}
      </div>

      {/* Inline keyframe for checkmark animation */}
      <style jsx global>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
