'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { fmtDateTime } from '@/lib/utils'
import type { Event, Player } from '@/types'

interface NextMatchHeroProps {
  event: Event
  communityId: string
  playerId: string | null
  communityColor: string
  onToggleTeams: () => void
  teamsOpen: boolean
}

export function NextMatchHero({
  event,
  communityId,
  playerId,
  communityColor,
  onToggleTeams,
  teamsOpen,
}: NextMatchHeroProps) {
  const [confirming, setConfirming] = useState(false)

  const confirmed = (event.confirmations ?? []).filter(c => c.status === 'si')
  const pct = event.max_jugadores > 0
    ? Math.min(100, (confirmed.length / event.max_jugadores) * 100)
    : 0

  const myConf = event.confirmations?.find(c => c.player_id === playerId)
  const iConfirmed = myConf?.status === 'si'

  async function handleConfirm() {
    if (!playerId || confirming) return
    setConfirming(true)
    try {
      const supabase = createClient()
      if (iConfirmed) {
        // Toggle off
        await supabase.from('confirmations').delete().eq('event_id', event.id).eq('player_id', playerId)
        showToast('🔄 Confirmación retirada')
      } else if (myConf) {
        await supabase.from('confirmations').update({ status: 'si' }).eq('id', myConf.id)
        showToast('✅ ¡Confirmado!')
      } else {
        await supabase.from('confirmations').insert({ event_id: event.id, player_id: playerId, status: 'si' })
        showToast('✅ ¡Confirmado!')
      }
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div>
      <p
        className="text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: 'var(--muted)' }}
      >
        Próximo partido
      </p>
      <div
        className="rounded-m overflow-hidden"
        style={{ background: 'var(--card)', border: `1px solid ${communityColor}33` }}
      >
        {/* Accent bar top */}
        <div className="h-0.5" style={{ background: communityColor }} />

        <Link href={`/${communityId}/partidos/${event.id}`} className="block px-4 pt-3 pb-2">
          {/* Title + badge */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-bold text-base leading-tight flex-1 min-w-0 truncate">
              {event.titulo}
            </h2>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: communityColor + '22', color: communityColor }}
            >
              Abierto
            </span>
          </div>

          {/* Date + location */}
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            🗓 {fmtDateTime(event.fecha, event.hora)}
          </p>
          {(event.pista?.name || event.lugar) && (
            <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
              📍 {event.pista?.name ?? event.lugar}
            </p>
          )}

          {/* Confirmation bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
              <span>✅ {confirmed.length} confirmados</span>
              <span>{confirmed.length}/{event.max_jugadores}</span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: communityColor + '22' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: communityColor }}
              />
            </div>
          </div>
        </Link>

        {/* CTAs */}
        <div className="flex gap-2 px-4 pb-4 pt-1">
          {playerId ? (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 h-11 rounded-s font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60"
              style={
                iConfirmed
                  ? { background: communityColor + '22', color: communityColor, border: `1px solid ${communityColor}44` }
                  : { background: communityColor, color: '#000' }
              }
            >
              {confirming ? '...' : iConfirmed ? '✅ Confirmado' : '✅ Confirmar'}
            </button>
          ) : (
            <Link
              href={`/${communityId}/partidos/${event.id}`}
              className="flex-1 h-11 rounded-s font-bold text-sm flex items-center justify-center active:scale-[0.97] transition-transform"
              style={{ background: communityColor, color: '#000' }}
            >
              Ver partido
            </Link>
          )}

          <button
            onClick={onToggleTeams}
            className="flex-1 h-11 rounded-s font-bold text-sm active:scale-[0.97] transition-transform"
            style={
              teamsOpen
                ? { background: communityColor + '22', color: communityColor, border: `1px solid ${communityColor}44` }
                : { background: 'var(--card2)', color: 'var(--fg)', border: '1px solid var(--border)' }
            }
          >
            ⚖️ Equipos
          </button>
        </div>
      </div>
    </div>
  )
}
