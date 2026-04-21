'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePlayerMatches } from '@/hooks/usePlayerMatches'
import { fmtDate } from '@/lib/utils'

interface PlayerTimelineProps {
  playerId: string
  communityId: string
  communityColor: string
  initialLimit?: number
}

type Result = 'win' | 'loss' | 'draw' | 'unknown'

function resultFor(team: 'A' | 'B' | null, a: number | null, b: number | null): Result {
  if (!team || a == null || b == null) return 'unknown'
  if (a === b) return 'draw'
  if (team === 'A') return a > b ? 'win' : 'loss'
  return b > a ? 'win' : 'loss'
}

const RESULT_META: Record<Result, { label: string; icon: string; tone: string }> = {
  win:     { label: 'Victoria', icon: '🏆', tone: '#22c55e' },
  loss:    { label: 'Derrota',  icon: '😔', tone: '#ef4444' },
  draw:    { label: 'Empate',   icon: '🤝', tone: '#eab308' },
  unknown: { label: '—',        icon: '•',  tone: 'var(--muted)' },
}

export function PlayerTimeline({
  playerId,
  communityId,
  communityColor,
  initialLimit = 8,
}: PlayerTimelineProps) {
  const { matches, loading } = usePlayerMatches(playerId, communityId)
  const [limit, setLimit] = useState(initialLimit)

  if (loading) {
    return (
      <p className="text-sm text-center py-3" style={{ color: 'var(--muted)' }}>
        Cargando historial…
      </p>
    )
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-center py-3" style={{ color: 'var(--muted)' }}>
        Todavía no has jugado partidos
      </p>
    )
  }

  const shown = matches.slice(0, limit)
  const remaining = matches.length - shown.length

  return (
    <div className="space-y-2">
      {shown.map(m => {
        const ev = m.event
        if (!ev) return null
        const team = ev.equipo_a?.includes(playerId) ? 'A'
                   : ev.equipo_b?.includes(playerId) ? 'B'
                   : null
        const res = resultFor(team, ev.goles_a, ev.goles_b)
        const resMeta = RESULT_META[res]
        const isMVP = ev.mvp_id === playerId
        const hazañas = [
          m.porteria_cero && '🧤',
          m.parada_penalti && '🦸',
          m.chilena && '🦅',
          m.olimpico && '🌊',
          m.tacon && '👠',
        ].filter(Boolean) as string[]

        return (
          <Link
            key={m.id}
            href={`/${communityId}/partidos/${ev.id}`}
            className="block rounded-m p-3 active:scale-[0.99] transition-transform select-none"
            style={{
              background: 'var(--card)',
              border: `1px solid ${resMeta.tone}33`,
              borderLeftWidth: 3,
              borderLeftColor: resMeta.tone,
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: resMeta.tone }}>
                  {resMeta.icon} {resMeta.label}
                </span>
                <span className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                  {fmtDate(ev.fecha)}{ev.pista ? ` · ${ev.pista.name}` : ''}
                </span>
              </div>
              {ev.goles_a != null && ev.goles_b != null && (
                <span className="font-bebas text-lg tracking-wider leading-none" style={{ color: communityColor }}>
                  {team === 'B' ? `${ev.goles_b}–${ev.goles_a}` : `${ev.goles_a}–${ev.goles_b}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: 'var(--muted)' }}>
              {m.goles > 0 && <span>⚽ {m.goles}</span>}
              {m.asistencias > 0 && <span>🎯 {m.asistencias}</span>}
              {isMVP && <span style={{ color: 'var(--gold, #ffd700)' }}>👑 MVP</span>}
              {hazañas.length > 0 && <span>{hazañas.join(' ')}</span>}
              {m.xp_ganado > 0 && (
                <span className="ml-auto font-bold" style={{ color: communityColor }}>
                  +{m.xp_ganado} XP
                </span>
              )}
            </div>
          </Link>
        )
      })}

      {remaining > 0 && (
        <button
          onClick={() => setLimit(l => l + 10)}
          className="w-full rounded-m py-2.5 text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-transform select-none"
          style={{ background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          Ver {Math.min(remaining, 10)} más ({remaining} restantes)
        </button>
      )}
    </div>
  )
}
