'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { fmtDateTime } from '@/lib/utils'
import type { Event } from '@/types'

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
        className="uppercase mb-2"
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'var(--muted)',
        }}
      >
        Próximo partido
      </p>
      <div
        className="rounded-l overflow-hidden relative"
        style={{
          background: 'var(--card)',
          border: `1px solid ${communityColor}33`,
          boxShadow: 'var(--shadow-depth-2)',
        }}
      >
        {/* Inner hairline — filo del vidrio */}
        <div
          className="absolute inset-0 pointer-events-none rounded-l"
          style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset' }}
          aria-hidden="true"
        />

        {/* Accent bar top con gradiente hacia el tint */}
        <div
          className="h-[3px] relative"
          style={{
            background: `linear-gradient(90deg, ${communityColor} 0%, ${communityColor}88 60%, ${communityColor}33 100%)`,
          }}
        />

        <Link href={`/${communityId}/partidos/${event.id}`} className="block px-4 pt-4 pb-3 no-lift">
          {/* Title + badge */}
          <div className="flex items-start justify-between gap-2">
            <h2
              className="flex-1 min-w-0 hl-balance"
              style={{
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '-0.015em',
                lineHeight: 1.15,
                color: 'var(--text)',
              }}
            >
              {event.titulo}
            </h2>
            <span
              className="uppercase px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                background: communityColor + '22',
                color: communityColor,
                border: `1px solid ${communityColor}33`,
              }}
            >
              Abierto
            </span>
          </div>

          {/* Date + location */}
          <p
            className="mt-2"
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}
          >
            <span aria-hidden="true">🗓</span> {fmtDateTime(event.fecha, event.hora)}
          </p>
          {(event.pista?.name || event.lugar) && (
            <p
              className="mt-0.5 truncate"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}
            >
              <span aria-hidden="true">📍</span> {event.pista?.name ?? event.lugar}
            </p>
          )}

          {/* Confirmation bar */}
          <div className="mt-3.5 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span
                className="uppercase"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                }}
              >
                Confirmados
              </span>
              <span
                className="font-bebas leading-none tabular-nums"
                style={{
                  fontSize: 18,
                  letterSpacing: '-0.015em',
                  color: 'var(--text)',
                }}
              >
                {confirmed.length}
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {' / '}{event.max_jugadores}
                </span>
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{
                background: communityColor + '1a',
                boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${communityColor}cc 0%, ${communityColor} 100%)`,
                  boxShadow: `0 0 10px ${communityColor}66`,
                  transition: 'width 0.6s var(--ease-out)',
                }}
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
              className="flex-1 h-11 rounded-s active:scale-[0.97] disabled:opacity-60"
              style={
                iConfirmed
                  ? {
                      background: communityColor + '22',
                      color: communityColor,
                      border: `1px solid ${communityColor}44`,
                      fontSize: 13.5,
                      fontWeight: 600,
                      letterSpacing: '-0.005em',
                      boxShadow: 'var(--shadow-depth-1)',
                    }
                  : {
                      background: communityColor,
                      color: '#000',
                      fontSize: 13.5,
                      fontWeight: 700,
                      letterSpacing: '-0.005em',
                      boxShadow: `0 8px 24px ${communityColor}33, 0 1px 0 rgba(255,255,255,0.25) inset`,
                    }
              }
            >
              {confirming ? '…' : iConfirmed ? '✅ Confirmado' : '✅ Confirmar'}
            </button>
          ) : (
            <Link
              href={`/${communityId}/partidos/${event.id}`}
              className="flex-1 h-11 rounded-s flex items-center justify-center active:scale-[0.97]"
              style={{
                background: communityColor,
                color: '#000',
                fontSize: 13.5,
                fontWeight: 700,
                letterSpacing: '-0.005em',
                boxShadow: `0 8px 24px ${communityColor}33, 0 1px 0 rgba(255,255,255,0.25) inset`,
              }}
            >
              Ver partido
            </Link>
          )}

          <button
            onClick={onToggleTeams}
            className="flex-1 h-11 rounded-s active:scale-[0.97]"
            style={
              teamsOpen
                ? {
                    background: communityColor + '22',
                    color: communityColor,
                    border: `1px solid ${communityColor}44`,
                    fontSize: 13.5,
                    fontWeight: 600,
                    letterSpacing: '-0.005em',
                    boxShadow: 'var(--shadow-depth-1)',
                  }
                : {
                    background: 'var(--card2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    fontSize: 13.5,
                    fontWeight: 600,
                    letterSpacing: '-0.005em',
                    boxShadow: 'var(--shadow-depth-1)',
                  }
            }
          >
            ⚖️ Equipos
          </button>
        </div>
      </div>
    </div>
  )
}
