'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { fmtDateTime, isPast } from '@/lib/utils'
import type { Event, Player } from '@/types'

interface EventCardProps {
  event: Event
  communityId: string
  players: Player[]
}

export function EventCard({ event, communityId, players }: EventCardProps) {
  const confirmed = (event.confirmations ?? []).filter(c => c.status === 'si')
  const past = event.finalizado || isPast(event.fecha, event.hora)
  const pct = event.max_jugadores > 0 ? Math.min(100, (confirmed.length / event.max_jugadores) * 100) : 0

  return (
    <Link href={`/${communityId}/partidos/${event.id}`}>
      <Card highlighted={!past} className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{event.titulo}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {fmtDateTime(event.fecha, event.hora)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {event.finalizado ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--card2)', color: 'var(--muted)' }}>
                Finalizado
              </span>
            ) : (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-d)', color: 'var(--accent)' }}>
                Abierto
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {event.tipo}
            </span>
          </div>
        </div>

        {/* Location */}
        {(event.pista?.name || event.lugar) && (
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            <span>📍</span>
            <span className="truncate">{event.pista?.name ?? event.lugar}</span>
          </p>
        )}

        {/* Match result (if finished) */}
        {event.finalizado && event.goles_a !== null && event.goles_b !== null && (
          <div className="flex items-center gap-3">
            <span className="font-bebas text-2xl tracking-wider">
              {event.goles_a} - {event.goles_b}
            </span>
            {event.mvp && (
              <span className="text-xs" style={{ color: 'var(--gold)' }}>
                👑 MVP: {event.mvp.name}
              </span>
            )}
          </div>
        )}

        {/* Confirmation bar */}
        {!event.finalizado && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
              <span>✅ {confirmed.length} confirmados</span>
              <span>{confirmed.length}/{event.max_jugadores}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </Card>
    </Link>
  )
}
