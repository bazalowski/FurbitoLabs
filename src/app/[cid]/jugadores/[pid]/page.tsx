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
import { initials, openPinModal } from '@/lib/utils'

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
  const communityColor = session.communityColor

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
    if (!/^\d{4}$/.test(currentPin)) { setPinError('El PIN actual debe tener 4 dígitos'); return }
    if (!/^\d{4}$/.test(newPin)) { setPinError('El nuevo PIN debe tener 4 dígitos'); return }
    if (currentPin === newPin) { setPinError('El nuevo PIN debe ser diferente al actual'); return }

    setPinSaving(true)
    setPinError('')

    try {
      const supabase = createClient()
      const { data: check, error: checkErr } = await supabase
        .from('players').select('id').eq('id', pid).eq('code', currentPin).single()

      if (checkErr || !check) { setPinError('El PIN actual no es correcto'); setPinSaving(false); return }

      const { error: updateErr } = await supabase.from('players').update({ code: newPin }).eq('id', pid)
      if (updateErr) { setPinError('Error al actualizar el PIN'); setPinSaving(false); return }

      showToast('PIN actualizado correctamente')
      setPinModalOpen(false)
      setCurrentPin(''); setNewPin(''); setPinError('')
    } catch {
      setPinError('Error de conexión')
    } finally {
      setPinSaving(false)
    }
  }

  if (loading) return <div className="p-4" style={{ color: 'var(--muted)' }}>Cargando...</div>
  if (!player) return <div className="p-4" style={{ color: 'var(--muted)' }}>Jugador no encontrado</div>

  // Skill bars data — always visible (0 if no votes)
  const skillBars = SKILLS.map(sk => {
    const bySkill = playerRating?.bySkill.find(s => s.key === sk.key)
    return {
      ...sk,
      avg: bySkill?.avg ?? 0,
      pct: bySkill ? ((bySkill.avg - 1) / 4) * 100 : 0,
    }
  })

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

      <div className="px-4 space-y-4 pt-2 pb-28">

        {/* ── Profile header ───────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl"
              style={{
                background: communityColor + '22',
                color: communityColor,
                border: `3px solid ${isProfileAdmin ? 'var(--gold, #ffd700)' : communityColor + '44'}`,
              }}
            >
              {player.avatar ?? initials(player.name)}
            </div>
            {isProfileAdmin && (
              <span className="absolute -top-1 -right-1 text-base" style={{ filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.6))' }}>
                👑
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bebas text-3xl tracking-wider leading-none">{player.name}</h1>
              {isProfileAdmin && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold, #ffd700)' }}
                >
                  Admin
                </span>
              )}
            </div>
            {player.position && (
              <p className="text-sm capitalize mt-0.5" style={{ color: 'var(--muted)' }}>{player.position}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span style={{ color: communityColor }} className="font-bold text-sm">
                {level?.icon} Nv.{level?.level} {level?.name}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{player.xp} XP</span>
            </div>
            <div className="xp-bar mt-1.5">
              <div className="xp-bar-fill" style={{ width: `${pct}%`, background: communityColor }} />
            </div>
            {nextLevel && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Siguiente: {nextLevel.name} ({nextLevel.min - player.xp} XP)
              </p>
            )}
          </div>
        </div>

        {/* ── Vitrina (featured badges) ─────────────── */}
        {player.vitrina.length > 0 && (
          <div className="flex gap-2">
            {player.vitrina.map(b => (
              <BadgeChip key={b} badgeKey={b} size="lg" showName />
            ))}
          </div>
        )}

        {/* ── Stats: fila horizontal 5 chips ────────── */}
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 snap-x">
          {[
            { label: 'Partidos',    value: player.partidos,       icon: '🗓️' },
            { label: 'Goles',       value: player.goles,          icon: '⚽' },
            { label: 'Asistencias', value: player.asistencias,    icon: '🎯' },
            { label: 'MVPs',        value: player.mvps,           icon: '👑' },
            { label: 'Badges',      value: player.badges.length,  icon: '🏅' },
          ].map(s => (
            <div
              key={s.label}
              className="flex-shrink-0 snap-start rounded-m p-3 text-center min-w-[72px]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-base leading-none mb-1">{s.icon}</p>
              <p className="font-bebas text-2xl leading-none tracking-wider" style={{ color: communityColor }}>
                {s.value}
              </p>
              <p className="text-[10px] mt-1 leading-tight" style={{ color: 'var(--muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Skill bars (siempre visibles) ─────────── */}
        <div
          className="rounded-m p-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Habilidades
            </p>
            {playerRating ? (
              <p className="font-bebas text-xl tracking-wider" style={{ color: communityColor }}>
                ★ {playerRating.avg.toFixed(1)}
                <span className="text-xs font-sans font-normal ml-1" style={{ color: 'var(--muted)' }}>
                  ({playerRating.count} votos)
                </span>
              </p>
            ) : (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin valoraciones</p>
            )}
          </div>
          <div className="space-y-2.5">
            {skillBars.map(sk => (
              <div key={sk.key} className="flex items-center gap-2">
                <span className="text-sm w-5 flex-shrink-0">{sk.icon}</span>
                <span className="text-xs w-20 flex-shrink-0" style={{ color: 'var(--muted)' }}>{sk.label}</span>
                <div className="flex-1 xp-bar">
                  <div
                    className="xp-bar-fill transition-all"
                    style={{ width: `${sk.pct}%`, background: communityColor, opacity: sk.pct === 0 ? 0.25 : 1 }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: sk.pct > 0 ? communityColor : 'var(--muted)' }}>
                  {sk.avg > 0 ? sk.avg.toFixed(1) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Badges desbloqueadas (grid 5-col) ─────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Insignias
            </p>
            <p className="text-xs font-bold" style={{ color: communityColor }}>
              {player.badges.length} desbloqueadas
            </p>
          </div>
          {player.badges.length > 0 ? (
            <div className="grid grid-cols-5 gap-1.5">
              {player.badges.map(key => (
                <BadgeChip key={key} badgeKey={key} size="md" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-3" style={{ color: 'var(--muted)' }}>
              Sin insignias todavía
            </p>
          )}
        </div>

        {/* Catálogo completo (collapsible) */}
        <BadgeShowcase unlockedKeys={player.badges} accentColor={communityColor} />

        {/* ── CTA Valorar ───────────────────────────── */}
        {/* Visible para cualquiera que no sea el propio jugador */}
        {!isOwnProfile && (
          <button
            onClick={() => canVote ? setVoteOpen(true) : openPinModal()}
            className="w-full h-12 rounded-m font-bold text-sm tracking-wide uppercase active:scale-[0.98] transition-transform select-none"
            style={{ background: communityColor, color: '#000' }}
          >
            {canVote
              ? (existingVote ? '✏️ Editar valoración' : '⭐ Valorar jugador')
              : '🔑 Acceder para valorar'}
          </button>
        )}

        {/* ── Admin: PIN de jugador ─────────────────── */}
        {session.role === 'admin' && (
          <Card>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
              PIN de jugador
            </p>
            <p className="font-bebas text-2xl tracking-widest" style={{ color: communityColor }}>
              {player.code}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Comparte este PIN con el jugador para que pueda identificarse
            </p>
          </Card>
        )}

        {/* ── Cambiar PIN (own profile) ─────────────── */}
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

      </div>

      {/* ── Bottom-sheet: Valorar ─────────────────────── */}
      {voteOpen && canVote && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setVoteOpen(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app z-50 rounded-t-2xl px-4 pt-3 pb-8 animate-slide-up"
            style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--border)' }} />

            <div className="flex items-center justify-between mb-4">
              <p className="font-bebas text-xl tracking-wider">
                ⭐ Valorar a {player.name}
              </p>
              <button
                onClick={() => setVoteOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: 'var(--border)', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Puntúa del 1 al 5 cada habilidad</p>

            <div className="space-y-3">
              {SKILLS.map(skill => (
                <div key={skill.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold">
                      {skill.icon} {skill.label}
                    </span>
                    <span className="text-sm font-bebas tracking-wider" style={{ color: communityColor }}>
                      {rating[skill.key] ?? '—'}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => setRating(r => ({ ...r, [skill.key]: v }))}
                        className="flex-1 py-2.5 rounded-s text-sm font-bold transition-all active:scale-95"
                        style={{
                          background: (rating[skill.key] ?? 0) >= v ? communityColor : 'var(--card)',
                          color: (rating[skill.key] ?? 0) >= v ? '#050d05' : 'var(--muted)',
                          border: `1px solid ${(rating[skill.key] ?? 0) >= v ? communityColor : 'var(--border)'}`,
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={submitVote}
              disabled={voting}
              className="w-full h-12 rounded-m font-bold text-sm uppercase tracking-wide mt-5 active:scale-[0.98] transition-transform disabled:opacity-50"
              style={{ background: communityColor, color: '#000' }}
            >
              {voting ? 'Guardando...' : '✅ Enviar valoración'}
            </button>
          </div>
        </>
      )}

      {/* ── Modal: Cambiar PIN ────────────────────────── */}
      {pinModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPinModalOpen(false); setCurrentPin(''); setNewPin(''); setPinError('')
            }
          }}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-6 flex flex-col gap-4 animate-slide-up"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-lg font-bold text-center">Cambiar PIN</h2>

            {(['PIN actual', 'Nuevo PIN'] as const).map((labelText, i) => {
              const val = i === 0 ? currentPin : newPin
              const setter = i === 0 ? setCurrentPin : setNewPin
              return (
                <div key={labelText}>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>
                    {labelText}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={val}
                    onChange={(e) => { setter(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError('') }}
                    placeholder="0000"
                    autoFocus={i === 0}
                    className="w-full text-center text-2xl font-mono tracking-[0.4em] py-3 px-4 rounded-xl border bg-transparent outline-none focus:ring-2"
                    style={{
                      borderColor: pinError ? '#ef4444' : 'var(--border)',
                      color: 'var(--fg)',
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ['--tw-ring-color' as any]: communityColor,
                    }}
                  />
                </div>
              )
            })}

            {pinError && <p className="text-xs text-red-400 font-medium text-center">{pinError}</p>}

            <button
              onClick={handlePinChange}
              disabled={pinSaving || currentPin.length !== 4 || newPin.length !== 4}
              className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 disabled:opacity-40 select-none"
              style={{ background: communityColor, color: '#000', minHeight: 48 }}
            >
              {pinSaving ? 'Guardando...' : 'Confirmar cambio'}
            </button>

            <button
              onClick={() => { setPinModalOpen(false); setCurrentPin(''); setNewPin(''); setPinError('') }}
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
