'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { usePlayer } from '@/hooks/usePlayers'
import { useVotes } from '@/hooks/useVotes'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BadgeChip, BadgeShowcase } from '@/components/ui/Badge'
import { getLevel, getNextLevel, xpPercent } from '@/lib/game/levels'
import { getPlayerRating, SKILLS } from '@/lib/game/scoring'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { initials } from '@/lib/utils'

interface PlayerProfilePageProps {
  params: { cid: string; pid: string }
}

export default function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { cid, pid } = params
  const router = useRouter()
  const session = useSession()
  const { player, loading } = usePlayer(pid)
  const { votes, reload: reloadVotes } = useVotes(cid)

  const [rating, setRating] = useState<Record<string, number>>({})
  const [voting, setVoting] = useState(false)
  const [voteOpen, setVoteOpen] = useState(false)

  const myPlayer = session.playerId
  const canVote = myPlayer && myPlayer !== pid
  const existingVote = votes.find(v => v.voter_id === myPlayer && v.voted_id === pid)
  const playerRating = player ? getPlayerRating(pid, votes) : null

  const level = player ? getLevel(player.xp) : null
  const nextLevel = player ? getNextLevel(player.xp) : null
  const pct = player ? xpPercent(player.xp) : 0

  async function submitVote() {
    if (!myPlayer || !player) return
    const allFilled = SKILLS.every(s => rating[s.key] >= 1 && rating[s.key] <= 5)
    if (!allFilled) { showToast('Puntúa todas las habilidades'); return }

    setVoting(true)
    const supabase = createClient()
    const payload = { community_id: cid, voter_id: myPlayer, voted_id: pid, ...rating }

    if (existingVote) {
      await supabase.from('votes').update(payload).eq('id', existingVote.id)
    } else {
      await supabase.from('votes').insert(payload)
    }

    showToast('✅ Valoración guardada')
    setVoteOpen(false)
    reloadVotes()
    setVoting(false)
  }

  if (loading) return <div className="p-4" style={{ color: 'var(--muted)' }}>Cargando...</div>
  if (!player) return <div className="p-4" style={{ color: 'var(--muted)' }}>Jugador no encontrado</div>

  return (
    <div className="view-enter">
      <Header
        title=""
        left={
          <button onClick={() => router.back()} style={{ color: 'var(--muted)' }}>
            ← {player.name}
          </button>
        }
      />

      <div className="px-4 space-y-4 pt-2">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0"
            style={{
              background: session.communityColor + '22',
              color: session.communityColor,
              border: `3px solid ${session.communityColor}44`,
            }}
          >
            {player.avatar ?? initials(player.name)}
          </div>
          <div className="flex-1">
            <h1 className="font-bebas text-3xl tracking-wider">{player.name}</h1>
            {player.position && (
              <p className="text-sm capitalize" style={{ color: 'var(--muted)' }}>{player.position}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span style={{ color: session.communityColor }} className="font-bold text-sm">
                {level?.icon} {level?.name}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {player.xp} XP
              </span>
            </div>
            <div className="xp-bar mt-1.5">
              <div className="xp-bar-fill" style={{ width: `${pct}%`, background: session.communityColor }} />
            </div>
            {nextLevel && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Siguiente: {nextLevel.name} ({nextLevel.min - player.xp} XP)
              </p>
            )}
          </div>
        </div>

        {/* Vitrina */}
        {player.vitrina.length > 0 && (
          <div className="flex gap-2">
            {player.vitrina.map(b => (
              <BadgeChip key={b} badgeKey={b} size="lg" showName />
            ))}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Partidos', value: player.partidos, icon: '🗓️' },
            { label: 'Goles', value: player.goles, icon: '⚽' },
            { label: 'Asistencias', value: player.asistencias, icon: '🎯' },
            { label: 'MVPs', value: player.mvps, icon: '👑' },
            { label: 'P. a cero', value: player.partidos_cero, icon: '🧤' },
            { label: 'Badges', value: player.badges.length, icon: '🏅' },
          ].map(s => (
            <Card key={s.label} className="text-center">
              <p className="text-lg">{s.icon}</p>
              <p className="font-bebas text-2xl" style={{ color: session.communityColor }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Player code (admin only) */}
        {session.role === 'admin' && (
          <Card>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
              Código de jugador
            </p>
            <p className="font-bebas text-2xl tracking-widest" style={{ color: session.communityColor }}>
              {player.code}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Comparte este código con el jugador para que pueda identificarse
            </p>
          </Card>
        )}

        {/* Rating */}
        {playerRating ? (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Valoración ({playerRating.count} votos)
              </p>
              <p className="font-bebas text-2xl" style={{ color: session.communityColor }}>
                {playerRating.avg.toFixed(2)}
              </p>
            </div>
            {playerRating.bySkill.map(s => {
              const skill = SKILLS.find(sk => sk.key === s.key)
              const pct = ((s.avg - 1) / 4) * 100
              return (
                <div key={s.key} className="flex items-center gap-2 mb-2">
                  <span className="text-sm w-5">{skill?.icon}</span>
                  <span className="text-xs w-20" style={{ color: 'var(--muted)' }}>{skill?.label}</span>
                  <div className="flex-1 xp-bar">
                    <div className="xp-bar-fill" style={{ width: `${pct}%`, background: session.communityColor }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right">{s.avg.toFixed(1)}</span>
                </div>
              )
            })}
          </Card>
        ) : (
          <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>Sin valoraciones todavía</p>
        )}

        {/* Vote button */}
        {canVote && (
          <Button className="w-full" onClick={() => setVoteOpen(v => !v)}>
            {existingVote ? '✏️ Editar valoración' : '⭐ Valorar jugador'}
          </Button>
        )}

        {/* Vote form */}
        {voteOpen && canVote && (
          <Card>
            <p className="font-bold text-sm mb-3">Puntúa del 1 al 5</p>
            {SKILLS.map(skill => (
              <div key={skill.key} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
                    {skill.icon} {skill.label}
                  </span>
                  <span className="text-xs font-bold" style={{ color: session.communityColor }}>
                    {rating[skill.key] ?? '—'}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      onClick={() => setRating(r => ({ ...r, [skill.key]: v }))}
                      className="flex-1 py-2 rounded text-xs font-bold transition-all"
                      style={{
                        background: (rating[skill.key] ?? 0) >= v ? session.communityColor : 'var(--card)',
                        color: (rating[skill.key] ?? 0) >= v ? '#050d05' : 'var(--muted)',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={submitVote} disabled={voting} className="w-full mt-2">
              {voting ? 'Guardando...' : '✅ Enviar valoración'}
            </Button>
          </Card>
        )}

        {/* Badges */}
        <BadgeShowcase unlockedKeys={player.badges} accentColor={session.communityColor} />
      </div>
    </div>
  )
}
