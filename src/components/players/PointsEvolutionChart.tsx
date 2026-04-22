'use client'

import { useMemo, useState } from 'react'
import { usePlayerMatches } from '@/hooks/usePlayerMatches'
import { calcMatchPoints, getPointsTier } from '@/lib/game/scoring'
import { fmtDate } from '@/lib/utils'

interface PointsEvolutionChartProps {
  playerId: string
  communityId: string
  communityColor: string
  /** Number of recent matches to display. */
  max?: number
}

export function PointsEvolutionChart({
  playerId,
  communityId,
  communityColor,
  max = 12,
}: PointsEvolutionChartProps) {
  const { matches, loading } = usePlayerMatches(playerId, communityId)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const data = useMemo(() => {
    // matches vienen ordenados desc (más reciente primero); para la gráfica izq→der
    // queremos oldest→recent, así que invertimos y nos quedamos con los últimos `max`.
    const chrono = [...matches].reverse().slice(-max)
    return chrono.map((m, i) => {
      const pts = calcMatchPoints({
        goles: m.goles,
        asistencias: m.asistencias,
        porteria_cero: m.porteria_cero,
      }).total
      const tier = getPointsTier(pts)
      return {
        id: m.id,
        index: i,
        points: pts,
        tier,
        date: m.event?.fecha ?? '',
        eventId: m.event?.id ?? '',
      }
    })
  }, [matches, max])

  if (loading) {
    return (
      <div
        className="rounded-m p-4 text-center text-sm"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}
      >
        Cargando evolución…
      </div>
    )
  }

  if (data.length < 2) {
    return null
  }

  // ── Summary ────────────────────────────────────
  const total   = data.reduce((s, d) => s + d.points, 0)
  const best    = data.reduce((a, b) => (b.points > a.points ? b : a))
  const avg     = total / data.length
  // Racha "buena" = partidos consecutivos al final con tier >= bueno (8+)
  let streak = 0
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].points >= 8) streak++
    else break
  }

  // ── Chart geometry ─────────────────────────────
  const W = 320   // viewBox width (se re-escala responsive)
  const H = 140
  const padL = 8, padR = 8, padT = 8, padB = 18
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // Y scale: techo dinámico, mínimo 20 (para que Excelente/Leyenda se vean con margen)
  const yMax = Math.max(20, Math.ceil(Math.max(...data.map(d => d.points), 20) / 5) * 5)
  const xAt  = (i: number) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const yAt  = (p: number) => padT + (1 - Math.min(p, yMax) / yMax) * innerH

  // Tier threshold bands (y ranges)
  const bandY = (pts: number) => yAt(pts)
  const bands = [
    { from: 20,       to: yMax,   color: '#a855f7', opacity: 0.08 }, // leyenda
    { from: 11,       to: 20,     color: '#06b6d4', opacity: 0.07 }, // excelente
    { from: 8,        to: 11,     color: '#22c55e', opacity: 0.06 }, // bueno
    { from: 5,        to: 8,      color: '#f97316', opacity: 0.05 }, // regular
    { from: 0,        to: 5,      color: '#ef4444', opacity: 0.05 }, // mal
  ]

  const avgY = yAt(avg)

  // Line path (smooth polyline)
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(d.points).toFixed(2)}`).join(' ')
  // Area underneath the line
  const areaPath = `${linePath} L ${xAt(data.length - 1).toFixed(2)} ${padT + innerH} L ${xAt(0).toFixed(2)} ${padT + innerH} Z`

  const gradientId = `evo-area-${playerId.slice(0, 8)}`

  const active = activeIdx != null ? data[activeIdx] : null

  return (
    <div
      className="card hairline-top rounded-m overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        ['--aura-color' as string]: communityColor,
      }}
    >
      {/* ── Header ────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          📈 Evolución de puntos
        </p>
        <div
          className="flex items-center gap-1 rounded-full px-2 py-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
          aria-hidden="true"
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f97316' }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#06b6d4' }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7' }} />
        </div>
      </div>

      {/* ── Summary strip ─────────────────── */}
      <div className="px-4 grid grid-cols-4 gap-2 mb-3">
        <SummaryTile label="Total"   value={String(total)} color={communityColor} />
        <SummaryTile label="Mejor"   value={String(best.points)} color={best.tier.color} />
        <SummaryTile label="Media"   value={avg.toFixed(1)} color={getPointsTier(Math.round(avg)).color} />
        <SummaryTile
          label="Racha"
          value={streak > 0 ? `🔥 ${streak}` : '—'}
          color={streak > 0 ? '#f97316' : 'var(--muted)'}
        />
      </div>

      {/* ── Chart ─────────────────────────── */}
      <div className="relative px-2 pb-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block"
          preserveAspectRatio="none"
          style={{ maxHeight: 160 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={communityColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={communityColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Tier bands */}
          {bands.map((b, i) => {
            const y1 = bandY(Math.min(b.to, yMax))
            const y2 = bandY(Math.max(b.from, 0))
            if (y2 <= y1) return null
            return (
              <rect
                key={i}
                x={padL}
                y={y1}
                width={innerW}
                height={y2 - y1}
                fill={b.color}
                opacity={b.opacity}
              />
            )
          })}

          {/* Average dashed line */}
          <line
            x1={padL}
            x2={padL + innerW}
            y1={avgY}
            y2={avgY}
            stroke="rgba(255,255,255,0.28)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <text
            x={padL + innerW - 4}
            y={avgY - 4}
            textAnchor="end"
            fontSize={8}
            fill="rgba(255,255,255,0.45)"
            fontWeight={700}
            style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Media {avg.toFixed(1)}
          </text>

          {/* Area + line */}
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={linePath} stroke={communityColor} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />

          {/* Data points */}
          {data.map((d, i) => {
            const cx = xAt(i)
            const cy = yAt(d.points)
            const isBest = d.index === best.index
            const isActive = activeIdx === i
            const isLast = i === data.length - 1
            const r = isBest ? 5 : isActive ? 5 : 3.5
            return (
              <g key={d.id}>
                {/* Stick down from dot to baseline */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={cy}
                  y2={padT + innerH}
                  stroke={d.tier.color}
                  strokeWidth={isBest ? 1.5 : 1}
                  opacity={isBest ? 0.55 : 0.3}
                />
                {/* Halo for best */}
                {isBest && (
                  <circle cx={cx} cy={cy} r={9} fill={d.tier.color} opacity={0.18} />
                )}
                {/* Pulsing ring for last match */}
                {isLast && (
                  <circle cx={cx} cy={cy} r={7} fill="none" stroke={d.tier.color} strokeWidth={1} opacity={0.55}>
                    <animate attributeName="r" values="5;10;5" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Interactive hit area */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={10}
                  fill="transparent"
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  onClick={() => setActiveIdx(i)}
                  style={{ cursor: 'pointer' }}
                />
                {/* Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={d.tier.color}
                  stroke="#050d05"
                  strokeWidth={1}
                  style={{
                    filter: isBest || isActive
                      ? `drop-shadow(0 0 6px ${d.tier.color})`
                      : 'none',
                    transition: 'r 0.15s ease',
                  }}
                />
                {/* X-axis label for first, last, active */}
                {(isLast || isActive) && (
                  <text
                    x={cx}
                    y={H - 4}
                    textAnchor="middle"
                    fontSize={8}
                    fontWeight={700}
                    fill={isLast ? communityColor : 'rgba(255,255,255,0.7)'}
                    style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  >
                    {isLast ? 'Hoy' : `J${i + 1}`}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Tooltip (DOM, absolute over svg) */}
        {active && (
          <div
            className="absolute pointer-events-none text-[10px] font-bold uppercase tracking-wider rounded px-2 py-1 whitespace-nowrap"
            style={{
              left: `${((xAt(active.index) - padL) / innerW) * 100}%`,
              top: 4,
              transform: 'translateX(-50%)',
              background: 'rgba(5,13,5,0.92)',
              color: active.tier.color,
              border: `1px solid ${active.tier.color}66`,
              boxShadow: `0 0 10px ${active.tier.color}44`,
            }}
          >
            {fmtDate(active.date)} · 🎖️ {active.points}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <p className="px-4 py-2 text-[10px]" style={{ color: 'var(--muted)' }}>
        Últimos {data.length} partidos · toca un punto para detalles
      </p>
    </div>
  )
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-start justify-center rounded-s px-2 py-2 min-w-0"
      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider leading-none" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <span
        className="font-bebas text-xl leading-none mt-1 tracking-wider truncate w-full"
        style={{ color, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </div>
  )
}
