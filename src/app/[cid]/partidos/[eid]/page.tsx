'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useEvent } from '@/hooks/useEvents'
import { usePlayers } from '@/hooks/usePlayers'
import { usePistas } from '@/hooks/usePistas'
import { useVotes } from '@/hooks/useVotes'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EventForm } from '@/components/events/EventForm'
import { showToast } from '@/components/ui/Toast'
import { fmtDateTime } from '@/lib/utils'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { TeamGenerator } from '@/components/players/TeamGenerator'
import { MvpVoting } from '@/components/events/MvpVoting'
import { PostMatchRating } from '@/components/events/PostMatchRating'
import { PostMatchReveal } from '@/components/events/PostMatchReveal'
import { finalizeMvpByVotes } from '@/lib/game/mvp-finalize'
import { useMvpVotes } from '@/hooks/useMvpVotes'
import type { Confirmation, MatchPlayer, TeamGeneratorResult } from '@/types'

type DetailTab = 'convocados' | 'equipos' | 'resultado'

interface EventDetailPageProps {
  params: { cid: string; eid: string }
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { cid, eid } = params
  const router = useRouter()
  const session = useSession()
  const { event, loading, reload: reloadEvent } = useEvent(eid)
  const { players } = usePlayers(cid)
  const { pistas, reload: reloadPistas } = usePistas(cid)
  const { votes } = useVotes(cid)
  const { votes: mvpVotes } = useMvpVotes(eid)
  const [editOpen, setEditOpen] = useState(false)
  const [adminConfirming, setAdminConfirming] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<DetailTab>('convocados')
  const [closingMvp, setClosingMvp] = useState(false)
  const [teamGenOpen, setTeamGenOpen] = useState(false)
  const [confirmingTeams, setConfirmingTeams] = useState(false)

  // match_players llega embebido en el Event vía el hook (con realtime). Evitamos
  // una query aparte para que cualquier cambio (admin cierra MVP, re-registra
  // resultado, etc.) se propague automáticamente a esta vista.
  const matchPlayers: MatchPlayer[] = event?.match_players ?? []

  useEffect(() => {
    if (event?.finalizado) setActiveTab('resultado')
  }, [event?.finalizado])

  const myPlayer = players.find(p => p.id === session.playerId)
  const myConf = event?.confirmations?.find(c => c.player_id === session.playerId)
  const confirmed = event?.confirmations?.filter(c => c.status === 'si') ?? []
  const maybe    = event?.confirmations?.filter(c => c.status === 'quiza') ?? []
  const declined = event?.confirmations?.filter(c => c.status === 'no') ?? []

  const communityColor = session.communityColor
  const isAdmin  = session.role === 'admin'
  const isPlayer = session.role === 'player' || session.role === 'admin'
  const pct = Math.min(100, (confirmed.length / (event?.max_jugadores || 1)) * 100)

  async function setConfirmation(status: Confirmation['status'] | null) {
    if (!myPlayer || !event) return
    const supabase = createClient()
    if (!status) {
      await supabase.from('confirmations').delete().eq('event_id', event.id).eq('player_id', myPlayer.id)
    } else if (myConf) {
      await supabase.from('confirmations').update({ status }).eq('id', myConf.id)
    } else {
      await supabase.from('confirmations').insert({ event_id: event.id, player_id: myPlayer.id, status })
    }
    showToast(status ? `${status === 'si' ? '✅' : status === 'no' ? '❌' : '🤔'} Confirmación actualizada` : '🔄 Confirmación eliminada')
  }

  async function adminSetPlayerStatus(playerId: string, status: 'si' | 'no') {
    if (!event) return
    setAdminConfirming(prev => ({ ...prev, [playerId]: true }))
    const supabase = createClient()
    const existing = event.confirmations?.find(c => c.player_id === playerId)
    if (existing && existing.status === status) {
      await supabase.from('confirmations').delete().eq('id', existing.id)
    } else if (existing) {
      await supabase.from('confirmations').update({ status }).eq('id', existing.id)
    } else {
      await supabase.from('confirmations').insert({ event_id: event.id, player_id: playerId, status })
    }
    setAdminConfirming(prev => ({ ...prev, [playerId]: false }))
    showToast('Asistencia actualizada')
  }

  async function deleteEvent() {
    if (!event || !confirm('¿Eliminar este evento?')) return
    const supabase = createClient()
    await supabase.from('events').delete().eq('id', event.id)
    showToast('🗑️ Evento eliminado')
    router.push(`/${cid}/partidos`)
  }

  async function confirmTeams(result: TeamGeneratorResult) {
    if (!event || confirmingTeams) return
    setConfirmingTeams(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('events')
      .update({
        equipo_a: result.teamA.map(p => p.id),
        equipo_b: result.teamB.map(p => p.id),
      })
      .eq('id', event.id)
    setConfirmingTeams(false)
    if (error) {
      showToast('No se pudieron guardar los equipos')
      return
    }
    showToast('✅ Equipos confirmados')
    setTeamGenOpen(false)
    reloadEvent()
  }

  async function closeMvpVoting() {
    if (!event || closingMvp) return
    if (mvpVotes.length === 0) {
      showToast('Aún no hay votos: no se puede determinar el MVP')
      return
    }
    if (!confirm('¿Cerrar la votación del MVP ahora? Se proclamará MVP al más votado y nadie más podrá votar.')) return
    setClosingMvp(true)
    const result = await finalizeMvpByVotes(event.id)
    await reloadEvent()
    setClosingMvp(false)
    if (result) showToast(`🏆 MVP: ${result.winnerName}`)
    else        showToast('🔒 Votación cerrada')
  }

  // Auto-finalize: si la votación ya ha cerrado por plazo pero no hay MVP
  // oficial y sí hay votos, proclamar ganador. Corre una vez cuando se dan
  // todas las condiciones.
  useEffect(() => {
    if (!event?.finalizado) return
    if (event.mvp_id) return
    const closesAtMs = event.mvp_voting_closes_at ? new Date(event.mvp_voting_closes_at).getTime() : null
    if (closesAtMs === null || Date.now() < closesAtMs) return
    if (mvpVotes.length === 0) return
    let cancelled = false
    ;(async () => {
      const res = await finalizeMvpByVotes(event.id)
      if (!cancelled && res) await reloadEvent()
    })()
    return () => { cancelled = true }
  }, [event?.id, event?.finalizado, event?.mvp_id, event?.mvp_voting_closes_at, mvpVotes.length, reloadEvent])

  if (loading) return <div className="p-4" style={{ color: 'var(--muted)' }}>Cargando...</div>
  if (!event) return <div className="p-4" style={{ color: 'var(--muted)' }}>Evento no encontrado</div>

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'convocados', label: `Convocados (${confirmed.length})` },
    { key: 'equipos',   label: 'Equipos' },
    { key: 'resultado', label: 'Resultado' },
  ]

  // Pool de jugadores para el generador: confirmados "sí" o, si no hay confirmaciones, toda la comunidad.
  const teamPool = (() => {
    const ids = (event?.confirmations ?? []).filter(c => c.status === 'si').map(c => c.player_id)
    return ids.length >= 2 ? players.filter(p => ids.includes(p.id)) : players
  })()

  // ── Equipos tab content ────────────────────────────────────────
  function renderEquipos() {
    if (!event) return null
    const teamA = (event.equipo_a ?? []).map(id => players.find(p => p.id === id)).filter(Boolean) as typeof players
    const teamB = (event.equipo_b ?? []).map(id => players.find(p => p.id === id)).filter(Boolean) as typeof players
    const hasTeams = teamA.length > 0 || teamB.length > 0
    const canEditTeams = isAdmin && !event.finalizado

    return (
      <div className="space-y-4">
        {/* Teams snapshot */}
        {hasTeams ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Equipo A', team: teamA },
              { label: 'Equipo B', team: teamB },
            ].map(({ label, team }) => (
              <div
                key={label}
                className="card hairline-top p-3"
                style={{ borderColor: communityColor + '44' }}
              >
                <p
                  className="font-bebas text-lg tracking-wider text-center mb-3 pb-2"
                  style={{ color: communityColor, borderBottom: `1px solid ${communityColor}22` }}
                >
                  {label}
                </p>
                <div className="space-y-2">
                  {team.length === 0 && (
                    <p className="text-[11px] text-center py-2" style={{ color: 'var(--muted)' }}>—</p>
                  )}
                  {team.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <PlayerAvatar player={p} size={28} communityColor={communityColor} />
                      <span className="text-xs font-semibold truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10" style={{ color: 'var(--muted)' }}>
            <p className="text-3xl mb-3">⚖️</p>
            <p className="font-bold text-sm">Sin equipos generados</p>
            {canEditTeams && (
              <p className="text-xs mt-2">Úsalo el botón ⚡ para generar y confirmar</p>
            )}
          </div>
        )}

        {/* Admin: abrir generador (para crear o regenerar) */}
        {canEditTeams && (
          <button
            type="button"
            onClick={() => setTeamGenOpen(true)}
            className="w-full h-11 rounded-m font-bold text-sm uppercase tracking-wide active:scale-[0.98] transition-transform select-none"
            style={{ background: communityColor, color: '#050d05' }}
          >
            ⚡ {hasTeams ? 'Regenerar equipos' : 'Generar equipos'}
          </button>
        )}
      </div>
    )
  }

  // ── Resultado tab content ──────────────────────────────────────
  function renderResultado() {
    if (!event) return null
    return (
      <div className="space-y-4">
        {/* Narrativa de 7 beats (score → MVP → tú → podio → equipos → hazañas → resumen) */}
        {event.finalizado ? (
          <PostMatchReveal
            event={event}
            matchPlayers={matchPlayers}
            players={players}
            communityColor={communityColor}
            currentPlayerId={session.playerId}
          />
        ) : (
          <div className="surface-calm text-center py-10">
            <p className="text-3xl mb-2">🏁</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Partido no finalizado</p>
          </div>
        )}

        {/* MVP Voting */}
        {event.finalizado && matchPlayers.length > 0 && isPlayer && session.playerId && (
          <MvpVoting
            eventId={eid}
            currentPlayerId={session.playerId}
            matchPlayers={matchPlayers}
            allPlayers={players}
            communityColor={communityColor}
            officialMvp={event.mvp}
            closesAt={event.mvp_voting_closes_at}
          />
        )}

        {/* Post-match ratings */}
        {event.finalizado && matchPlayers.length > 0 && session.playerId && (() => {
          const participantPlayers = players.filter(p => matchPlayers.some(mp => mp.player_id === p.id))
          if (!participantPlayers.length) return null
          return (
            <PostMatchRating
              communityId={cid}
              currentPlayerId={session.playerId}
              participants={participantPlayers}
              communityColor={communityColor}
            />
          )
        })()}

        {/* Admin actions */}
        {isAdmin && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            {!event.finalizado && (
              <Button variant="secondary" className="w-full"
                onClick={() => router.push(`/${cid}/partidos/${eid}/resultado`)}>
                🏁 Registrar resultado
              </Button>
            )}
            {event.finalizado && matchPlayers.length > 0 && (() => {
              const closesAtMs = event.mvp_voting_closes_at ? new Date(event.mvp_voting_closes_at).getTime() : null
              const isOpen = closesAtMs === null || Date.now() < closesAtMs
              if (!isOpen) return null
              return (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={closeMvpVoting}
                  disabled={closingMvp}
                >
                  {closingMvp ? 'Cerrando…' : '🔒 Cerrar votación MVP'}
                </Button>
              )
            })()}
            <Button variant="danger" className="w-full" onClick={deleteEvent}>
              🗑️ Eliminar evento
            </Button>
          </div>
        )}
      </div>
    )
  }

  // ── Convocados tab content ─────────────────────────────────────
  function renderConvocados() {
    if (!event) return null
    return (
      <div className="space-y-4">
        {/* Confirmation bar */}
        {!event.finalizado && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
              <span>✅ {confirmed.length} confirmados</span>
              <span>{confirmed.length}/{event.max_jugadores}</span>
            </div>
            <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        {/* My confirmation */}
        {isPlayer && myPlayer && !event.finalizado && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Tu confirmación
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['si', 'quiza', 'no'] as const).map(status => {
                const cfg = {
                  si:    { label: '✅ Sí voy',  active: { bg: '#22c55e',         fg: '#031a09' }, idle: { bg: 'rgba(34,197,94,0.10)',  fg: '#22c55e', border: 'rgba(34,197,94,0.35)' } },
                  quiza: { label: '🤔 Quizá',   active: { bg: '#f59e0b',         fg: '#1a1205' }, idle: { bg: 'rgba(245,158,11,0.10)', fg: '#f59e0b', border: 'rgba(245,158,11,0.35)' } },
                  no:    { label: '❌ No voy',  active: { bg: '#ef4444',         fg: '#fff'     }, idle: { bg: 'rgba(239,68,68,0.10)',  fg: '#ef4444', border: 'rgba(239,68,68,0.35)' } },
                }[status]
                const isActive = myConf?.status === status
                return (
                  <button key={status}
                    onClick={() => setConfirmation(isActive ? null : status)}
                    className="py-3.5 rounded-m text-sm font-bold transition-all active:scale-[0.97] select-none"
                    style={{
                      minHeight: '48px',
                      background: isActive ? cfg.active.bg : cfg.idle.bg,
                      color:      isActive ? cfg.active.fg : cfg.idle.fg,
                      border:     `1px solid ${isActive ? 'transparent' : cfg.idle.border}`,
                      boxShadow:  isActive ? `0 6px 18px ${cfg.active.bg}44, 0 1px 0 rgba(255,255,255,0.2) inset` : undefined,
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Player lists */}
        {[
          { label: `✅ Van (${confirmed.length})`, list: confirmed },
          { label: `🤔 Quizás (${maybe.length})`, list: maybe },
          { label: `❌ No van (${declined.length})`, list: declined },
        ].map(({ label, list }) => list.length > 0 && (
          <div key={label}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              {label}
            </p>
            <div className="flex flex-wrap gap-2">
              {list.map(c => {
                const p = players.find(pl => pl.id === c.player_id)
                if (!p) return null
                return (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <PlayerAvatar player={p} size={28} communityColor={communityColor} />
                    <span className="text-xs font-semibold">{p.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Admin attendance */}
        {isAdmin && !event.finalizado && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Registrar asistencia
            </p>
            <div
              className="rounded-m overflow-hidden divide-y"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderColor: 'var(--border)' }}
            >
              {players.map(p => {
                const conf = event.confirmations?.find(c => c.player_id === p.id)
                const currentStatus = conf?.status
                const isBusy = adminConfirming[p.id]
                return (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
                    <PlayerAvatar player={p} size={28} communityColor={communityColor} />
                    <span className="text-xs font-semibold flex-1 truncate">{p.name}</span>
                    <div className="flex gap-1">
                      {(['si', 'no'] as const).map(s => (
                        <button key={s}
                          onClick={() => adminSetPlayerStatus(p.id, s)}
                          disabled={isBusy}
                          className="w-9 h-9 rounded-m text-sm transition-all active:scale-[0.95] flex items-center justify-center"
                          style={{
                            background: currentStatus === s ? (s === 'si' ? '#22c55e' : '#ef4444') : 'var(--card2)',
                            color: currentStatus === s ? '#fff' : 'var(--muted)',
                            border: '1px solid var(--border)',
                            opacity: isBusy ? 0.5 : 1,
                          }}
                        >
                          {s === 'si' ? '✅' : '❌'}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="view-enter">
      <Header
        title={event.titulo}
        left={
          <button onClick={() => router.back()} className="text-lg" style={{ color: 'var(--muted)' }}>←</button>
        }
        right={
          isAdmin && (
            <button onClick={() => setEditOpen(true)} className="text-sm font-bold" style={{ color: 'var(--muted)' }}>✏️</button>
          )
        }
      />

      <div className="px-4 space-y-4 pt-2 pb-28">
        {/* Info card — always visible */}
        <div
          className="rounded-m p-3 space-y-1.5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {event.fecha && (
            <p className="text-sm flex items-center gap-2">
              <span>📅</span><span>{fmtDateTime(event.fecha, event.hora)}</span>
            </p>
          )}
          {(event.pista?.name || event.lugar) && (
            <p className="text-sm flex items-center gap-2">
              <span>📍</span><span className="truncate">{event.pista?.name ?? event.lugar}</span>
            </p>
          )}
          {event.notas && (
            <p className="text-sm flex items-start gap-2">
              <span>📝</span><span style={{ color: 'var(--muted)' }}>{event.notas}</span>
            </p>
          )}
          {event.finalizado && (
            <span
              className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5"
              style={{ background: 'var(--border)', color: 'var(--muted)' }}
            >
              Finalizado
            </span>
          )}
        </div>

        {/* Pill tab bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
          {tabs.map(t => (
            <button key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all min-h-[36px] active:scale-95"
              style={
                activeTab === t.key
                  ? { background: communityColor, color: '#050d05' }
                  : { background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'convocados' && renderConvocados()}
        {activeTab === 'equipos'   && renderEquipos()}
        {activeTab === 'resultado' && renderResultado()}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar evento">
        <EventForm communityId={cid} pistas={pistas} event={event}
          onDone={() => setEditOpen(false)} onCancel={() => setEditOpen(false)}
          onPistaCreated={() => reloadPistas()} />
      </Modal>

      {/* Generador de equipos (admin, solo si no finalizado) */}
      <Modal
        open={teamGenOpen}
        onClose={() => { if (!confirmingTeams) setTeamGenOpen(false) }}
        title="⚡ Generar equipos"
        variant="window"
      >
        {teamPool.length < 2 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>
            Necesitas al menos 2 jugadores confirmados (o de la comunidad) para generar equipos.
          </p>
        ) : (
          <TeamGenerator
            players={teamPool}
            votes={votes}
            communityColor={communityColor}
            onConfirmTeams={confirmTeams}
            confirming={confirmingTeams}
            confirmLabel="✅ Confirmar equipos"
          />
        )}
      </Modal>
    </div>
  )
}
