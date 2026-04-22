'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useEvent } from '@/hooks/useEvents'
import { usePlayers } from '@/hooks/usePlayers'
import { usePistas } from '@/hooks/usePistas'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EventForm } from '@/components/events/EventForm'
import { showToast } from '@/components/ui/Toast'
import { fmtDateTime } from '@/lib/utils'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { MvpVoting } from '@/components/events/MvpVoting'
import { PostMatchRating } from '@/components/events/PostMatchRating'
import { calcXP } from '@/lib/game/badges'
import type { Confirmation, MatchPlayer } from '@/types'

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
  const { pistas } = usePistas(cid)
  const [editOpen, setEditOpen] = useState(false)
  const [adminConfirming, setAdminConfirming] = useState<Record<string, boolean>>({})
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([])
  const [activeTab, setActiveTab] = useState<DetailTab>('convocados')
  const [closingMvp, setClosingMvp] = useState(false)

  useEffect(() => {
    if (event?.finalizado) setActiveTab('resultado')
  }, [event?.finalizado])

  useEffect(() => {
    if (!event?.finalizado) return
    const supabase = createClient()
    supabase.from('match_players').select('*').eq('event_id', eid)
      .then(({ data }) => { if (data) setMatchPlayers(data) })
  }, [event?.finalizado, eid])

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

  async function closeMvpVoting() {
    if (!event || closingMvp) return
    if (!confirm('¿Cerrar la votación del MVP ahora? Nadie más podrá votar.')) return
    setClosingMvp(true)
    const supabase = createClient()
    await supabase.from('events')
      .update({ mvp_voting_closes_at: new Date().toISOString() })
      .eq('id', event.id)
    await reloadEvent()
    setClosingMvp(false)
    showToast('🔒 Votación MVP cerrada')
  }

  if (loading) return <div className="p-4" style={{ color: 'var(--muted)' }}>Cargando...</div>
  if (!event) return <div className="p-4" style={{ color: 'var(--muted)' }}>Evento no encontrado</div>

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'convocados', label: `Convocados (${confirmed.length})` },
    { key: 'equipos',   label: 'Equipos' },
    { key: 'resultado', label: 'Resultado' },
  ]

  // ── Equipos tab content ────────────────────────────────────────
  function renderEquipos() {
    if (!event) return null
    const teamA = (event.equipo_a ?? []).map(id => players.find(p => p.id === id)).filter(Boolean) as typeof players
    const teamB = (event.equipo_b ?? []).map(id => players.find(p => p.id === id)).filter(Boolean) as typeof players

    if (teamA.length === 0 && teamB.length === 0) {
      return (
        <div className="text-center py-10" style={{ color: 'var(--muted)' }}>
          <p className="text-3xl mb-3">⚖️</p>
          <p className="font-bold text-sm">Sin equipos generados</p>
          {!event.finalizado && isAdmin && (
            <p className="text-xs mt-2">Genera equipos al registrar el resultado</p>
          )}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Equipo A', team: teamA },
          { label: 'Equipo B', team: teamB },
        ].map(({ label, team }) => (
          <div
            key={label}
            className="rounded-m p-3"
            style={{ background: 'var(--card)', border: `1px solid ${communityColor}33` }}
          >
            <p className="font-bebas text-lg tracking-wider text-center mb-3" style={{ color: communityColor }}>
              {label}
            </p>
            <div className="space-y-2">
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
    )
  }

  // ── Resultado tab content ──────────────────────────────────────
  function renderResultado() {
    if (!event) return null
    return (
      <div className="space-y-4">
        {/* Score */}
        {event.finalizado && event.goles_a !== null ? (
          <div
            className="rounded-m p-5 text-center"
            style={{ background: communityColor + '11', border: `1px solid ${communityColor}33` }}
          >
            <p className="font-bebas text-6xl tracking-widest" style={{ color: communityColor }}>
              {event.goles_a} — {event.goles_b}
            </p>
            {event.mvp && (
              <p className="text-sm mt-2" style={{ color: 'var(--gold, #ffd700)' }}>
                👑 MVP: <strong>{event.mvp.name}</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6" style={{ color: 'var(--muted)' }}>
            <p className="text-3xl mb-2">🏁</p>
            <p className="text-sm">Partido no finalizado</p>
          </div>
        )}

        {/* Post-match summary */}
        {event.finalizado && matchPlayers.length > 0 && (() => {
          const getName = (pid: string) => players.find(p => p.id === pid)?.name ?? '???'
          const scorers   = matchPlayers.filter(mp => mp.goles > 0).sort((a, b) => b.goles - a.goles)
          const assisters = matchPlayers.filter(mp => mp.asistencias > 0).sort((a, b) => b.asistencias - a.asistencias)
          const hazanaLabels: Record<string, string> = {
            chilena: 'Chilena', olimpico: 'Olímpico', tacon: 'Tacón',
            porteria_cero: 'P. a cero', parada_penalti: 'Para penal.',
          }
          const hazanas: { name: string; feats: string[] }[] = []
          for (const mp of matchPlayers) {
            const feats: string[] = []
            if (mp.chilena) feats.push(hazanaLabels.chilena)
            if (mp.olimpico) feats.push(hazanaLabels.olimpico)
            if (mp.tacon) feats.push(hazanaLabels.tacon)
            if (mp.porteria_cero > 0) {
              feats.push(mp.porteria_cero > 1
                ? `${hazanaLabels.porteria_cero} (×${mp.porteria_cero})`
                : hazanaLabels.porteria_cero)
            }
            if (mp.parada_penalti) feats.push(hazanaLabels.parada_penalti)
            if (feats.length) hazanas.push({ name: getName(mp.player_id), feats })
          }
          const topXP = [...matchPlayers]
            .map(mp => ({ ...mp, xp: calcXP(mp as any, event.mvp_id === mp.player_id) }))
            .sort((a, b) => b.xp - a.xp)[0]

          return (
            <div className="rounded-m overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-widest px-4 py-2.5" style={{ color: communityColor, borderBottom: '1px solid var(--border)' }}>
                Resumen del partido
              </p>
              <div className="px-4 py-3 space-y-3 text-sm">
                {scorers.length > 0 && (
                  <p>⚽ {scorers.map((mp, i) => (
                    <span key={mp.player_id}>{i > 0 && <span style={{ color: 'var(--muted)' }}> · </span>}
                      {getName(mp.player_id)}{mp.goles > 1 && <span style={{ color: 'var(--muted)' }}> ({mp.goles})</span>}
                    </span>
                  ))}</p>
                )}
                {assisters.length > 0 && (
                  <p>👟 {assisters.map((mp, i) => (
                    <span key={mp.player_id}>{i > 0 && <span style={{ color: 'var(--muted)' }}> · </span>}
                      {getName(mp.player_id)}{mp.asistencias > 1 && <span style={{ color: 'var(--muted)' }}> ({mp.asistencias})</span>}
                    </span>
                  ))}</p>
                )}
                {hazanas.length > 0 && (
                  <p>🔥 {hazanas.map((h, i) => (
                    <span key={i}>{i > 0 && <span style={{ color: 'var(--muted)' }}> · </span>}
                      {h.name}: {h.feats.join(', ')}
                    </span>
                  ))}</p>
                )}
                {topXP && (
                  <p style={{ color: communityColor }}>⭐ Top XP: {getName(topXP.player_id)} +{topXP.xp} XP</p>
                )}
              </div>
            </div>
          )
        })()}

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
          onDone={() => setEditOpen(false)} onCancel={() => setEditOpen(false)} />
      </Modal>
    </div>
  )
}
