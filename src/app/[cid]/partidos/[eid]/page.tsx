'use client'

import { useState } from 'react'
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
import type { Confirmation } from '@/types'

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
                    className="py-2.5 rounded-m text-xs font-bold transition-all"
                    style={{
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
