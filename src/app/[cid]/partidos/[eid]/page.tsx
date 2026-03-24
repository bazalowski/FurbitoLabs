'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useEvent } from '@/hooks/useEvents'
import { usePlayers } from '@/hooks/usePlayers'
import { usePistas } from '@/hooks/usePistas'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
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

interface EventDetailPageProps {
  params: { cid: string; eid: string }
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { cid, eid } = params
  const router = useRouter()
  const session = useSession()
  const { event, loading } = useEvent(eid)
  const { players } = usePlayers(cid)
  const { pistas } = usePistas(cid)
  const [editOpen, setEditOpen] = useState(false)
  const [adminConfirming, setAdminConfirming] = useState<Record<string, boolean>>({})
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([])

  useEffect(() => {
    if (!event?.finalizado) return
    const supabase = createClient()
    supabase
      .from('match_players')
      .select('*')
      .eq('event_id', eid)
      .then(({ data }) => {
        if (data) setMatchPlayers(data)
      })
  }, [event?.finalizado, eid])

  const myPlayer = players.find(p => p.id === session.playerId)
  const myConf = event?.confirmations?.find(c => c.player_id === session.playerId)
  const confirmed = event?.confirmations?.filter(c => c.status === 'si') ?? []
  const maybe    = event?.confirmations?.filter(c => c.status === 'quiza') ?? []
  const declined = event?.confirmations?.filter(c => c.status === 'no') ?? []

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
      // Clicking the already-active button clears the confirmation
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

  if (loading) return <div className="p-4" style={{ color: 'var(--muted)' }}>Cargando...</div>
  if (!event) return <div className="p-4" style={{ color: 'var(--muted)' }}>Evento no encontrado</div>

  const isAdmin = session.role === 'admin'
  const isPlayer = session.role === 'player' || session.role === 'admin'
  const pct = Math.min(100, (confirmed.length / (event.max_jugadores || 1)) * 100)

  return (
    <div className="view-enter">
      <Header
        title={event.titulo}
        left={
          <button onClick={() => router.back()} className="text-lg" style={{ color: 'var(--muted)' }}>
            ←
          </button>
        }
        right={
          isAdmin && (
            <button onClick={() => setEditOpen(true)} className="text-sm font-bold" style={{ color: 'var(--muted)' }}>
              ✏️
            </button>
          )
        }
      />

      <div className="px-4 space-y-4 pt-2">
        {/* Info card */}
        <Card>
          <div className="space-y-2">
            {event.fecha && (
              <div className="flex items-center gap-2 text-sm">
                <span>📅</span>
                <span>{fmtDateTime(event.fecha, event.hora)}</span>
              </div>
            )}
            {(event.pista?.name || event.lugar) && (
              <div className="flex items-center gap-2 text-sm">
                <span>📍</span>
                <span>{event.pista?.name ?? event.lugar}</span>
              </div>
            )}
            {event.notas && (
              <div className="flex items-start gap-2 text-sm">
                <span>📝</span>
                <span style={{ color: 'var(--muted)' }}>{event.notas}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Result (if finished) */}
        {event.finalizado && event.goles_a !== null && (
          <Card highlighted>
            <div className="text-center space-y-2">
              <p className="font-bebas text-5xl tracking-widest">
                {event.goles_a} — {event.goles_b}
              </p>
              {event.mvp && (
                <p className="text-sm" style={{ color: 'var(--gold)' }}>
                  👑 MVP: <strong>{event.mvp.name}</strong>
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Post-match summary */}
        {event.finalizado && matchPlayers.length > 0 && (() => {
          const getName = (pid: string) => players.find(p => p.id === pid)?.name ?? '???'

          // Goleadores
          const scorers = matchPlayers
            .filter(mp => mp.goles > 0)
            .sort((a, b) => b.goles - a.goles)

          // Asistentes
          const assisters = matchPlayers
            .filter(mp => mp.asistencias > 0)
            .sort((a, b) => b.asistencias - a.asistencias)

          // Hazanas especiales
          const hazanaLabels: Record<string, string> = {
            chilena: 'Chilena',
            olimpico: 'Olimpico',
            tacon: 'Taconazo',
            porteria_cero: 'Porteria a cero',
            parada_penalti: 'Parada de penalti',
          }
          const hazanas: { name: string; feats: string[] }[] = []
          for (const mp of matchPlayers) {
            const feats: string[] = []
            if (mp.chilena) feats.push(hazanaLabels.chilena)
            if (mp.olimpico) feats.push(hazanaLabels.olimpico)
            if (mp.tacon) feats.push(hazanaLabels.tacon)
            if (mp.porteria_cero) feats.push(hazanaLabels.porteria_cero)
            if (mp.parada_penalti) feats.push(hazanaLabels.parada_penalti)
            if (feats.length > 0) hazanas.push({ name: getName(mp.player_id), feats })
          }

          // Top XP
          const mpWithXP = matchPlayers.map(mp => ({
            ...mp,
            xp: calcXP(mp, event.mvp_id === mp.player_id),
          }))
          const topXP = mpWithXP.sort((a, b) => b.xp - a.xp)[0]

          return (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0a0f0a 0%, #111a11 100%)',
                border: '1px solid var(--accent)',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.08)',
              }}
            >
              <div className="px-4 py-3 text-center" style={{ borderBottom: '1px solid rgba(34, 197, 94, 0.15)' }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                  Resumen del partido
                </p>
              </div>

              <div className="px-4 py-3 space-y-4">
                {/* Goleadores */}
                {scorers.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                      Goleadores
                    </p>
                    <p className="text-sm">
                      {scorers.map((mp, i) => (
                        <span key={mp.player_id}>
                          {i > 0 && <span style={{ color: 'var(--muted)' }}> {'\u00B7'} </span>}
                          <span>{'\u26BD'} {getName(mp.player_id)}</span>
                          {mp.goles > 1 && <span style={{ color: 'var(--muted)' }}> ({mp.goles})</span>}
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {/* Asistentes */}
                {assisters.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                      Asistentes
                    </p>
                    <p className="text-sm">
                      {assisters.map((mp, i) => (
                        <span key={mp.player_id}>
                          {i > 0 && <span style={{ color: 'var(--muted)' }}> {'\u00B7'} </span>}
                          <span>{'\uD83D\uDC5F'} {getName(mp.player_id)}</span>
                          {mp.asistencias > 1 && <span style={{ color: 'var(--muted)' }}> ({mp.asistencias})</span>}
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {/* MVP */}
                {event.mvp && (
                  <div
                    className="text-center py-2.5 rounded-lg"
                    style={{
                      background: 'rgba(234, 179, 8, 0.08)',
                      border: '1px solid rgba(234, 179, 8, 0.2)',
                    }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>
                      MVP del partido
                    </p>
                    <p className="text-lg font-bold" style={{ color: 'var(--gold)' }}>
                      {'\uD83D\uDC51'} {event.mvp.name}
                    </p>
                  </div>
                )}

                {/* Hazanas especiales */}
                {hazanas.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                      Hazanas especiales
                    </p>
                    <p className="text-sm">
                      {hazanas.map((h, i) => (
                        <span key={i}>
                          {i > 0 && <span style={{ color: 'var(--muted)' }}> {'\u00B7'} </span>}
                          <span>{'\uD83D\uDD25'} {h.name}: {h.feats.join(', ')}</span>
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {/* Top XP */}
                {topXP && (
                  <div
                    className="text-center py-2 rounded-lg"
                    style={{
                      background: 'rgba(34, 197, 94, 0.06)',
                      border: '1px solid rgba(34, 197, 94, 0.15)',
                    }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted)' }}>
                      Top XP del partido
                    </p>
                    <p className="text-base font-bold" style={{ color: 'var(--accent)' }}>
                      {'\u2B50'} {getName(topXP.player_id)}: +{topXP.xp} XP
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Confirmation bar */}
        {!event.finalizado && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
              <span>✅ {confirmed.length} van</span>
              <span>Cupo: {confirmed.length}/{event.max_jugadores}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* My confirmation (players only) */}
        {isPlayer && myPlayer && !event.finalizado && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Tu confirmación
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['si', 'quiza', 'no'] as const).map(status => {
                const labels = { si: '✅ Voy', quiza: '🤔 Quizá', no: '❌ No voy' }
                const isActive = myConf?.status === status
                return (
                  <button
                    key={status}
                    onClick={() => setConfirmation(isActive ? null : status)}
                    className="py-3.5 rounded-m text-sm font-bold transition-all active:scale-[0.97] select-none"
                    style={{
                      minHeight: '48px',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      background: isActive ? 'var(--accent)' : 'var(--card)',
                      color: isActive ? '#050d05' : 'var(--muted)',
                      border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    {labels[status]}
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
        ].map(({ label, list }) =>
          list.length > 0 ? (
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
                      <PlayerAvatar player={p} size={28} communityColor={session.communityColor} />
                      <span className="text-xs font-semibold">{p.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null
        )}

        {/* Admin attendance registration */}
        {isAdmin && !event.finalizado && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Registrar asistencia
            </p>
            <Card>
              <div className="space-y-1.5">
                {players.map(p => {
                  const conf = event.confirmations?.find(c => c.player_id === p.id)
                  const currentStatus = conf?.status
                  const isBusy = adminConfirming[p.id]
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <PlayerAvatar player={p} size={28} communityColor={session.communityColor} />
                      <span className="text-xs font-semibold flex-1 truncate">{p.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => adminSetPlayerStatus(p.id, 'si')}
                          disabled={isBusy}
                          className="w-9 h-9 rounded-m text-sm font-bold transition-all active:scale-[0.95] select-none flex items-center justify-center"
                          style={{
                            minWidth: '36px',
                            minHeight: '36px',
                            WebkitUserSelect: 'none',
                            userSelect: 'none',
                            background: currentStatus === 'si' ? '#22c55e' : 'var(--card)',
                            color: currentStatus === 'si' ? '#fff' : 'var(--muted)',
                            border: `1px solid ${currentStatus === 'si' ? 'transparent' : 'var(--border)'}`,
                            opacity: isBusy ? 0.5 : 1,
                          }}
                          title="Confirmar"
                        >
                          {'\u2705'}
                        </button>
                        <button
                          onClick={() => adminSetPlayerStatus(p.id, 'no')}
                          disabled={isBusy}
                          className="w-9 h-9 rounded-m text-sm font-bold transition-all active:scale-[0.95] select-none flex items-center justify-center"
                          style={{
                            minWidth: '36px',
                            minHeight: '36px',
                            WebkitUserSelect: 'none',
                            userSelect: 'none',
                            background: currentStatus === 'no' ? '#ef4444' : 'var(--card)',
                            color: currentStatus === 'no' ? '#fff' : 'var(--muted)',
                            border: `1px solid ${currentStatus === 'no' ? 'transparent' : 'var(--border)'}`,
                            opacity: isBusy ? 0.5 : 1,
                          }}
                          title="Declinar"
                        >
                          {'\u274C'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* MVP Voting (after event is finalized, for participants) */}
        {event.finalizado && matchPlayers.length > 0 && isPlayer && session.playerId && (
          <MvpVoting
            eventId={eid}
            currentPlayerId={session.playerId}
            matchPlayers={matchPlayers}
            allPlayers={players}
            communityColor={session.communityColor}
            officialMvp={event.mvp}
          />
        )}

        {/* Post-match player ratings (after event is finalized, for logged-in players) */}
        {event.finalizado && matchPlayers.length > 0 && session.playerId && (() => {
          const participantPlayerIds = matchPlayers.map(mp => mp.player_id)
          const participantPlayers = players.filter(p => participantPlayerIds.includes(p.id))
          if (participantPlayers.length === 0) return null
          return (
            <PostMatchRating
              communityId={cid}
              currentPlayerId={session.playerId}
              participants={participantPlayers}
              communityColor={session.communityColor}
            />
          )
        })()}

        {/* Admin actions */}
        {isAdmin && (
          <div className="pt-2 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
            {!event.finalizado && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push(`/${cid}/partidos/${eid}/resultado`)}
              >
                🏁 Registrar resultado
              </Button>
            )}
            <Button variant="danger" className="w-full" onClick={deleteEvent}>
              🗑️ Eliminar evento
            </Button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar evento">
        <EventForm
          communityId={cid}
          pistas={pistas}
          event={event}
          onDone={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </div>
  )
}
