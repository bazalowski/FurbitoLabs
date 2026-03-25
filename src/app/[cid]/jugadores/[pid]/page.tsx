'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { usePlayer } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
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
  const { community } = useCommunity(cid)
  const { votes, reload: reloadVotes } = useVotes(cid)
  const adminIds = community?.admin_ids ?? []
  const isProfileAdmin = player ? adminIds.includes(player.id) : false

  const [rating, setRating] = useState<Record<string, number>>({})
  const [voting, setVoting] = useState(false)
  const [voteOpen, setVoteOpen] = useState(false)

  // Change PIN state
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSaving, setPinSaving] = useState(false)

  const myPlayer = session.playerId
  const isOwnProfile = myPlayer === pid
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

  async function handlePinChange() {
    if (!/^\d{4}$/.test(currentPin)) {
      setPinError('El PIN actual debe tener 4 dígitos')
      return
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('El nuevo PIN debe tener 4 dígitos')
      return
    }
    if (currentPin === newPin) {
      setPinError('El nuevo PIN debe ser diferente al actual')
      return
    }

    setPinSaving(true)
    setPinError('')

    try {
      const supabase = createClient()
      // Verify current PIN matches
      const { data: check, error: checkErr } = await supabase
        .from('players')
        .select('id')
        .eq('id', pid)
        .eq('code', currentPin)
        .single()

      if (checkErr || !check) {
        setPinError('El PIN actual no es correcto')
        setPinSaving(false)
        return
      }

      // Update to new PIN
      const { error: updateErr } = await supabase
        .from('players')
        .update({ code: newPin })
        .eq('id', pid)

      if (updateErr) {
        setPinError('Error al actualizar el PIN')
        setPinSaving(false)
        return
      }

      showToast('PIN actualizado correctamente')
      setPinModalOpen(false)
      setCurrentPin('')
      setNewPin('')
      setPinError('')
    } catch {
      setPinError('Error de conexión')
    } finally {
      setPinSaving(false)
    }
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
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl"
              style={{
                background: session.communityColor + '22',
                color: session.communityColor,
                border: `3px solid ${isProfileAdmin ? 'var(--gold, #ffd700)' : session.communityColor + '44'}`,
              }}
            >
              {player.avatar ?? initials(player.name)}
            </div>
            {isProfileAdmin && (
              <span
                className="absolute -top-1 -right-1 text-base"
                style={{ filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.6))' }}
              >
                {'\uD83D\uDC51'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-bebas text-3xl tracking-wider">{player.name}</h1>
              {isProfileAdmin && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold, #ffd700)' }}
                >
                  {'\uD83D\uDC51'} Admin
                </span>
              )}
            </div>
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
              PIN de jugador
            </p>
            <p className="font-bebas text-2xl tracking-widest" style={{ color: session.communityColor }}>
              {player.code}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Comparte este PIN con el jugador para que pueda identificarse
            </p>
          </Card>
        )}

        {/* Change PIN button (own profile only) */}
        {isOwnProfile && (
          <Button
            className="w-full select-none"
            variant="ghost"
            onClick={() => setPinModalOpen(true)}
            style={{ minHeight: 48 }}
          >
            🔑 Cambiar PIN
          </Button>
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

      {/* Change PIN Modal */}
      {pinModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPinModalOpen(false)
              setCurrentPin('')
              setNewPin('')
              setPinError('')
            }
          }}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-6 flex flex-col gap-4 animate-slide-up"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-lg font-bold text-center">Cambiar PIN</h2>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>
                PIN actual
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={currentPin}
                onChange={(e) => {
                  setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  setPinError('')
                }}
                placeholder="0000"
                autoFocus
                className="w-full text-center text-2xl font-mono tracking-[0.4em] py-3 px-4 rounded-xl border bg-transparent outline-none focus:ring-2"
                style={{
                  borderColor: pinError ? '#ef4444' : 'var(--border)',
                  color: 'var(--fg)',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ['--tw-ring-color' as any]: session.communityColor,
                }}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>
                Nuevo PIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  setPinError('')
                }}
                placeholder="0000"
                className="w-full text-center text-2xl font-mono tracking-[0.4em] py-3 px-4 rounded-xl border bg-transparent outline-none focus:ring-2"
                style={{
                  borderColor: pinError ? '#ef4444' : 'var(--border)',
                  color: 'var(--fg)',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ['--tw-ring-color' as any]: session.communityColor,
                }}
              />
            </div>

            {pinError && (
              <p className="text-xs text-red-400 font-medium text-center">{pinError}</p>
            )}

            <button
              onClick={handlePinChange}
              disabled={pinSaving || currentPin.length !== 4 || newPin.length !== 4}
              className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 disabled:opacity-40 select-none"
              style={{
                background: session.communityColor,
                color: '#000',
                minHeight: 48,
              }}
            >
              {pinSaving ? 'Guardando...' : 'Confirmar cambio'}
            </button>

            <button
              onClick={() => {
                setPinModalOpen(false)
                setCurrentPin('')
                setNewPin('')
                setPinError('')
              }}
              className="text-xs uppercase tracking-wide opacity-50 hover:opacity-80 transition-opacity select-none"
              style={{ color: 'var(--muted)', minHeight: 48 }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
