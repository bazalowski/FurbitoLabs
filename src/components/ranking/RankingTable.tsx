'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getLevel } from '@/lib/game/levels'
import {
  getPlayerRating,
  calcPlayerTotalPoints,
  getPointsTier,
  MATCH_POINTS,
} from '@/lib/game/scoring'
import { Avatar } from '@/components/ui/Avatar'
import { useRecentMatchPoints } from '@/hooks/useRecentMatchPoints'
import { useRankingWindow, type RankingWindow, type WindowStats } from '@/hooks/useRankingWindow'
import type { Player, Vote } from '@/types'

type RankTab = 'puntos' | 'goles' | 'asistencias' | 'mvps' | 'partidos' | 'rating'
type RoleFilter = 'all' | 'porteros' | 'jugadores'

const TABS: { key: RankTab; label: string; icon: string }[] = [
  { key: 'puntos',      label: 'Puntos',  icon: '🎖️' },
  { key: 'goles',       label: 'Goles',   icon: '⚽' },
  { key: 'asistencias', label: 'Asist.',  icon: '🎯' },
  { key: 'mvps',        label: 'MVPs',    icon: '👑' },
  { key: 'partidos',    label: 'PJ',      icon: '🗓️' },
  { key: 'rating',      label: 'Rating',  icon: '🌟' },
]

const WINDOWS: { key: RankingWindow; label: string }[] = [
  { key: '7d',        label: '7 días' },
  { key: '30d',       label: '30 días' },
  { key: 'temporada', label: 'Temporada' },
  { key: 'historico', label: 'Histórico' },
]

function getWindowValue(
  player: Player,
  tab: RankTab,
  stats: WindowStats | undefined,
  votes: Vote[],
  isHistoric: boolean,
): number {
  if (tab === 'rating') {
    return getPlayerRating(player.id, votes)?.avg ?? 0
  }
  if (isHistoric) {
    if (tab === 'puntos') return calcPlayerTotalPoints(player)
    return (player[tab] as number) ?? 0
  }
  if (!stats) return 0
  if (tab === 'puntos') return stats.puntos
  if (tab === 'partidos') return stats.partidos
  return stats[tab as keyof WindowStats] ?? 0
}

function sortForRanking(
  players: Player[],
  votes: Vote[],
  tab: RankTab,
  window: RankingWindow,
  stats: Record<string, WindowStats>,
  isHistoric: boolean,
  roleFilter: RoleFilter,
): Player[] {
  const filtered = players.filter(p => {
    if (roleFilter === 'porteros') return p.position === 'portero'
    if (roleFilter === 'jugadores') return p.position !== 'portero'
    return true
  })

  // En el ranking exclusivo de porteros ordenamos por porterías a cero (si aplica la métrica),
  // y en el tab "goles" seguimos respetando la métrica pedida aunque sea injusto para el rol.
  const sortKey = (p: Player): number => {
    if (roleFilter === 'porteros' && (tab === 'puntos' || tab === 'goles')) {
      // para porteros priorizamos porterias a cero y luego la métrica elegida
      const zeros = isHistoric ? p.partidos_cero : (stats[p.id]?.porteria_cero ?? 0)
      const metric = getWindowValue(p, tab, stats[p.id], votes, isHistoric)
      return zeros * 1000 + metric
    }
    return getWindowValue(p, tab, stats[p.id], votes, isHistoric)
  }

  return [...filtered].sort((a, b) => sortKey(b) - sortKey(a))
}

interface RankingTableProps {
  players: Player[]
  votes: Vote[]
  communityId: string
  communityColor?: string
  adminIds?: string[]
  currentPlayerId?: string | null
}

export function RankingTable({
  players,
  votes,
  communityId,
  communityColor = '#a8ff3e',
  adminIds = [],
  currentPlayerId = null,
}: RankingTableProps) {
  const [tab, setTab] = useState<RankTab>('puntos')
  const [windowKey, setWindowKey] = useState<RankingWindow>('historico')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  const { stats: windowStats, loading: windowLoading, isHistoric } = useRankingWindow(
    communityId,
    windowKey,
  )

  const hasGoalkeepers = useMemo(
    () => players.some(p => p.position === 'portero'),
    [players],
  )

  const sorted = useMemo(
    () => sortForRanking(players, votes, tab, windowKey, windowStats, isHistoric, roleFilter),
    [players, votes, tab, windowKey, windowStats, isHistoric, roleFilter],
  )

  const isPointsTab = tab === 'puntos'

  const { data: recentPoints } = useRecentMatchPoints(
    isPointsTab && isHistoric ? communityId : null,
    5,
  )

  const formatValue = (p: Player): string => {
    if (tab === 'rating') {
      const r = getPlayerRating(p.id, votes)
      return r ? r.avg.toFixed(1) : '—'
    }
    if (roleFilter === 'porteros' && isPointsTab) {
      // Para el ranking de porteros mostramos el número de porterías a cero
      // como valor principal en el chip (es su métrica relevante).
      return String(isHistoric ? p.partidos_cero : (windowStats[p.id]?.porteria_cero ?? 0))
    }
    return String(Math.round(getWindowValue(p, tab, windowStats[p.id], votes, isHistoric)))
  }

  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
    : top3

  const podiumMeta = [
    { pos: 2, medal: '🥈', height: 96, labelColor: '#94a3b8' },
    { pos: 1, medal: '🥇', height: 128, labelColor: '#ffd700' },
    { pos: 3, medal: '🥉', height: 80, labelColor: '#cd7f32' },
  ]

  // ── Tu posición + delta al siguiente ───────────────
  const myIndex = currentPlayerId ? sorted.findIndex(p => p.id === currentPlayerId) : -1
  const myPlayer = myIndex >= 0 ? sorted[myIndex] : null
  const playerAbove = myIndex > 0 ? sorted[myIndex - 1] : null
  const myValue = myPlayer ? getWindowValue(myPlayer, tab, windowStats[myPlayer.id], votes, isHistoric) : 0
  const aboveValue = playerAbove ? getWindowValue(playerAbove, tab, windowStats[playerAbove.id], votes, isHistoric) : 0
  const deltaToAbove = playerAbove ? aboveValue - myValue : 0
  const showStickyMe = myPlayer && myIndex >= 3 // no en top 3 visible del podio

  return (
    <div className="space-y-3 pb-4" style={{ ['--aura-color' as string]: communityColor }}>
      {/* ── Chips de ventana temporal ──────────────────── */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-none"
        role="tablist"
        aria-label="Ventana temporal del ranking"
      >
        {WINDOWS.map(w => {
          const active = windowKey === w.key
          return (
            <button
              key={w.key}
              role="tab"
              aria-selected={active}
              onClick={() => setWindowKey(w.key)}
              className="flex-shrink-0 snap-start px-3 py-1.5 rounded-s text-[11px] uppercase min-h-[36px] flex items-center active:scale-95 transition-all"
              style={
                active
                  ? {
                      background: `color-mix(in srgb, ${communityColor} 18%, var(--card))`,
                      color: communityColor,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      border: `1px solid ${communityColor}66`,
                      boxShadow: `0 0 0 1px ${communityColor}22, 0 4px 12px ${communityColor}22`,
                    }
                  : {
                      background: 'var(--card)',
                      color: 'var(--muted)',
                      border: '1px solid var(--border)',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                    }
              }
            >
              {w.label}
            </button>
          )
        })}
      </div>

      {/* ── Tabs métrica: Puntos hero + resto glass ────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-none">
        {TABS.map(t => {
          const active = tab === t.key
          const isHero = t.key === 'puntos'

          if (isHero) {
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex-shrink-0 snap-start rounded-full min-h-[36px] active:scale-95 ${active ? 'legend-rainbow' : ''}`}
                style={{
                  padding: '1.5px',
                  boxShadow: active ? `0 0 18px ${communityColor}55` : 'none',
                }}
              >
                <span
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] uppercase"
                  style={{
                    background: active ? 'rgba(5,13,5,0.92)' : 'var(--card)',
                    color: active ? '#fff' : 'var(--muted)',
                    border: active ? '0.5px solid rgba(255,255,255,0.12)' : '1px solid var(--border)',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={active ? 'animate-pulse' : ''}
                    style={{ filter: active ? `drop-shadow(0 0 4px ${communityColor})` : 'none' }}
                  >
                    {t.icon}
                  </span>
                  <span className={active ? 'legend-rainbow font-bebas text-[13px] tracking-wider' : 'font-bold'}>
                    {t.label}
                  </span>
                </span>
              </button>
            )
          }

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-shrink-0 snap-start px-3.5 py-2 rounded-full text-[11px] uppercase min-h-[36px] flex items-center gap-1 active:scale-95"
              style={
                active
                  ? {
                      background: communityColor,
                      color: '#050d05',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      boxShadow: 'var(--shadow-depth-1)',
                    }
                  : {
                      background: 'var(--card)',
                      color: 'var(--muted)',
                      border: '1px solid var(--border)',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                    }
              }
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Filtro rol (solo si hay porteros marcados) ── */}
      {hasGoalkeepers && (
        <div className="flex gap-1.5" role="tablist" aria-label="Filtro por rol">
          {([
            { key: 'all',        label: 'Todos',     icon: '👥' },
            { key: 'jugadores',  label: 'Campo',     icon: '⚽' },
            { key: 'porteros',   label: 'Porteros',  icon: '🧤' },
          ] as const).map(r => {
            const active = roleFilter === r.key
            return (
              <button
                key={r.key}
                role="tab"
                aria-selected={active}
                onClick={() => setRoleFilter(r.key)}
                className="flex-1 px-3 py-2 rounded-s text-[11px] uppercase min-h-[36px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                style={
                  active
                    ? {
                        background: 'var(--card2)',
                        color: 'var(--text)',
                        border: `1px solid ${communityColor}66`,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                      }
                    : {
                        background: 'var(--card)',
                        color: 'var(--muted)',
                        border: '1px solid var(--border)',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                      }
                }
              >
                <span aria-hidden="true">{r.icon}</span>
                {r.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────── */}
      {!windowLoading && sorted.length === 0 && (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm font-bold">Sin partidos en esta ventana</p>
          <p className="text-xs mt-1">Prueba con un rango más amplio.</p>
        </div>
      )}

      {/* ── Podio visual top 3 ─────────────────────────── */}
      {top3.length > 0 && (
        <div className="relative">
          {isPointsTab && (
            <div
              aria-hidden="true"
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{
                top: -20,
                width: 220,
                height: 140,
                background: `radial-gradient(ellipse at center, ${communityColor}33 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
            />
          )}

          <div className="flex items-end justify-center gap-2 pt-3 pb-1 relative">
            {podiumOrder.map((player) => {
              if (!player) return null
              const originalPos = sorted.indexOf(player) + 1
              const meta = podiumMeta.find(m => m.pos === originalPos) ?? podiumMeta[2]
              const isFirst = originalPos === 1
              const value = formatValue(player)
              const pts = isHistoric
                ? calcPlayerTotalPoints(player)
                : (windowStats[player.id]?.puntos ?? 0)
              const tier = getPointsTier(Math.min(pts, 30))

              return (
                <Link
                  key={player.id}
                  href={`/${communityId}/jugadores/${player.id}`}
                  className="no-lift flex flex-col items-center gap-1.5 flex-1 max-w-[110px] active:scale-95 transition-transform relative"
                >
                  <span
                    className={isFirst ? 'leading-none micro-float' : 'leading-none'}
                    style={{
                      fontSize: isFirst ? 30 : 22,
                      filter: isFirst ? `drop-shadow(0 2px 10px ${communityColor}88)` : 'none',
                    }}
                    aria-hidden="true"
                  >
                    {meta.medal}
                  </span>

                  <div className="relative" style={{ ['--aura-color' as string]: communityColor }}>
                    {isFirst && (
                      <span
                        aria-hidden="true"
                        className="aura-halo"
                        style={{ inset: '-22%' }}
                      />
                    )}
                    <div className="relative">
                      <Avatar
                        name={player.name}
                        avatar={player.avatar}
                        size={isFirst ? 64 : 46}
                        fontSize={isFirst ? 18 : 13}
                        fontWeight={600}
                        communityColor={communityColor}
                        borderColor={meta.labelColor}
                        boxShadow={isFirst
                          ? `0 0 0 3px ${communityColor}22, 0 10px 28px ${communityColor}55, 0 2px 6px rgba(0,0,0,0.45)`
                          : `0 2px 8px rgba(0,0,0,0.35), 0 0 0 2px ${meta.labelColor}18`
                        }
                      />
                    </div>
                  </div>

                  <p
                    className="text-center truncate w-full px-1 leading-tight"
                    style={{
                      fontSize: isFirst ? 13 : 12,
                      fontWeight: isFirst ? 700 : 600,
                      color: isFirst ? communityColor : 'var(--text)',
                      letterSpacing: isFirst ? '-0.01em' : 0,
                    }}
                  >
                    {player.name.split(' ')[0]}
                  </p>

                  <p
                    className={`font-bebas leading-none ${isPointsTab && isFirst && pts >= 20 ? 'legend-rainbow' : ''}`}
                    style={{
                      fontSize: isFirst ? 30 : 22,
                      letterSpacing: '-0.015em',
                      color: isPointsTab && isFirst && pts >= 20 ? undefined : (isPointsTab && isFirst ? tier.color : meta.labelColor),
                      textShadow: isFirst ? `0 0 18px ${meta.labelColor}55` : 'none',
                    }}
                  >
                    {value}
                  </p>

                  <div
                    className="plinth-reflect w-full rounded-t-m relative overflow-hidden"
                    style={{
                      height: meta.height,
                      background: isFirst
                        ? `linear-gradient(180deg, ${communityColor}33 0%, ${communityColor}12 55%, ${communityColor}05 100%)`
                        : 'var(--card)',
                      border: `1px solid ${isFirst ? communityColor + '66' : 'var(--border)'}`,
                      borderBottom: 'none',
                      boxShadow: isFirst
                        ? `0 -6px 22px ${communityColor}22 inset, 0 1px 0 rgba(255,255,255,0.08) inset`
                        : '0 1px 0 rgba(255,255,255,0.04) inset',
                    }}
                  >
                    {isFirst && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-px"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${communityColor}, transparent)`,
                          boxShadow: `0 0 6px ${communityColor}99`,
                        }}
                      />
                    )}
                    <span
                      className="font-bebas absolute inset-x-0 bottom-1 text-center leading-none select-none"
                      style={{
                        fontSize: isFirst ? 42 : 28,
                        letterSpacing: '-0.02em',
                        color: isFirst ? `${communityColor}40` : 'rgba(255,255,255,0.06)',
                        textShadow: isFirst ? `0 0 12px ${communityColor}33` : 'none',
                      }}
                      aria-hidden="true"
                    >
                      {originalPos}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Lista 4th+ ─────────────────────────────────── */}
      {rest.length > 0 && (
        <div className="space-y-1.5">
          {rest.map((player, index) => {
            const pos = index + 4
            const level = getLevel(player.xp)
            const spark = isPointsTab && isHistoric ? recentPoints[player.id] : undefined
            const totalPts = isHistoric
              ? calcPlayerTotalPoints(player)
              : (windowStats[player.id]?.puntos ?? 0)
            const rowTier = isPointsTab ? getPointsTier(Math.min(totalPts, 30)) : null
            const isMe = currentPlayerId === player.id

            return (
              <Link key={player.id} href={`/${communityId}/jugadores/${player.id}`}>
                <div
                  className="card flex items-center gap-3 px-4 py-3 active:scale-[0.98]"
                  style={isMe ? {
                    borderColor: `${communityColor}66`,
                    boxShadow: `0 0 0 1px ${communityColor}33, var(--shadow-depth-1)`,
                  } : undefined}
                >
                  <span
                    className="font-bebas w-7 text-center flex-shrink-0 leading-none tabular-nums"
                    style={{
                      fontSize: 20,
                      letterSpacing: '-0.01em',
                      color: isMe ? communityColor : 'var(--muted)',
                      fontWeight: 400,
                    }}
                  >
                    {pos}
                  </span>

                  <Avatar
                    name={player.name}
                    avatar={player.avatar}
                    size={36}
                    fontSize={12}
                    fontWeight={600}
                    communityColor={communityColor}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="truncate"
                        style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.005em' }}
                      >
                        {player.name}
                      </p>
                      {adminIds.includes(player.id) && (
                        <span className="text-xs" aria-hidden="true">👑</span>
                      )}
                      {player.position === 'portero' && (
                        <span className="text-xs" aria-hidden="true" title="Portero">🧤</span>
                      )}
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: communityColor, fontWeight: 500 }}
                    >
                      {level.icon} {level.name}
                    </p>
                  </div>

                  {isPointsTab && isHistoric && spark && spark.length > 0 && (
                    <Sparkline points={spark} />
                  )}

                  {isPointsTab && rowTier ? (
                    <span
                      className="font-bebas flex-shrink-0 leading-none rounded px-2.5 py-1 text-center tabular-nums"
                      style={{
                        fontSize: 20,
                        letterSpacing: '-0.015em',
                        color: rowTier.color,
                        background: `${rowTier.color}14`,
                        border: `1px solid ${rowTier.color}44`,
                        minWidth: 52,
                      }}
                    >
                      {formatValue(player)}
                    </span>
                  ) : (
                    <p
                      className="font-bebas flex-shrink-0 leading-none tabular-nums"
                      style={{
                        fontSize: 22,
                        letterSpacing: '-0.015em',
                        color: communityColor,
                      }}
                    >
                      {formatValue(player)}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Tu posición sticky ─────────────────────────── */}
      {showStickyMe && myPlayer && (
        <div
          data-role="sticky"
          className="sticky bottom-2 left-0 right-0 pt-2"
          style={{ zIndex: 'var(--z-sticky)' }}
        >
          <Link href={`/${communityId}/jugadores/${myPlayer.id}`}>
            <div
              className="card hairline-top flex items-center gap-3 px-4 py-3 active:scale-[0.98]"
              style={{
                borderColor: `${communityColor}66`,
                background: `linear-gradient(180deg, var(--card2), var(--card))`,
                boxShadow: `0 0 0 1px ${communityColor}44, 0 8px 24px ${communityColor}22, var(--shadow-depth-2)`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="font-bebas w-7 text-center flex-shrink-0 leading-none tabular-nums"
                style={{
                  fontSize: 22,
                  color: communityColor,
                  fontWeight: 400,
                }}
              >
                {myIndex + 1}
              </span>

              <Avatar
                name={myPlayer.name}
                avatar={myPlayer.avatar}
                size={36}
                fontSize={12}
                fontWeight={600}
                communityColor={communityColor}
              />

              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}
                >
                  Tú · {myPlayer.name.split(' ')[0]}
                </p>
                {playerAbove && deltaToAbove > 0 ? (
                  <p
                    className="text-xs leading-tight tabular-nums"
                    style={{ color: 'var(--muted)', fontWeight: 500 }}
                  >
                    {describeDelta(tab, deltaToAbove)} para subir al #{myIndex}
                  </p>
                ) : (
                  <p
                    className="text-xs leading-tight"
                    style={{ color: communityColor, fontWeight: 600 }}
                  >
                    🏆 Liderando esta lista
                  </p>
                )}
              </div>

              <p
                className="font-bebas flex-shrink-0 leading-none tabular-nums"
                style={{
                  fontSize: 22,
                  letterSpacing: '-0.015em',
                  color: communityColor,
                }}
              >
                {formatValue(myPlayer)}
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

/**
 * Convierte un delta numérico en mensaje accionable ("3 pts = 1 gol",
 * "2 asistencias", etc.) según el tab activo.
 */
function describeDelta(tab: RankTab, delta: number): string {
  const d = Math.ceil(delta)
  if (tab === 'puntos') {
    // Traducción rápida a acciones: 1 gol = 2 pts, 1 asist = 1 pt.
    if (d <= MATCH_POINTS.asistencia) return `Te falta ${d} pt`
    if (d <= MATCH_POINTS.gol) return `Te faltan ${d} pts = 1 gol`
    const goles = Math.round(d / MATCH_POINTS.gol)
    return `Te faltan ${d} pts = ${goles} gol${goles === 1 ? '' : 'es'}`
  }
  if (tab === 'rating') return `+${delta.toFixed(1)} de rating`
  const labels: Record<Exclude<RankTab, 'puntos' | 'rating'>, [string, string]> = {
    goles: ['gol', 'goles'],
    asistencias: ['asistencia', 'asistencias'],
    mvps: ['MVP', 'MVPs'],
    partidos: ['partido', 'partidos'],
  }
  const [sg, pl] = labels[tab as Exclude<RankTab, 'puntos' | 'rating'>]
  return `Te falta${d === 1 ? '' : 'n'} ${d} ${d === 1 ? sg : pl}`
}

/** Sparkline: barras tier-coloreadas de los últimos N partidos. */
function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(20, ...points)
  return (
    <div
      className="flex items-end gap-[2px] h-4 flex-shrink-0"
      style={{ width: 36 }}
      aria-hidden="true"
    >
      {points.map((p, i) => {
        const tier = getPointsTier(p)
        const h = Math.max(12, Math.round((p / max) * 100))
        return (
          <span
            key={i}
            className="w-1 rounded-t-[1px]"
            style={{
              height: `${h}%`,
              background: tier.color,
              boxShadow: `0 0 3px ${tier.color}66`,
            }}
          />
        )
      })}
    </div>
  )
}
