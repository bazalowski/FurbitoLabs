'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getLevel } from '@/lib/game/levels'
import { getPlayerRating, calcPlayerTotalPoints } from '@/lib/game/scoring'
import { Avatar } from '@/components/ui/Avatar'
import type { Player, Vote } from '@/types'

type RankTab = 'puntos' | 'goles' | 'asistencias' | 'mvps' | 'partidos' | 'rating'

const TABS: { key: RankTab; label: string; icon: string }[] = [
  { key: 'puntos',      label: 'Puntos',  icon: '🎖️' },
  { key: 'goles',       label: 'Goles',   icon: '⚽' },
  { key: 'asistencias', label: 'Asist.',  icon: '🎯' },
  { key: 'mvps',        label: 'MVPs',    icon: '👑' },
  { key: 'partidos',    label: 'PJ',      icon: '🗓️' },
  { key: 'rating',      label: 'Rating',  icon: '🌟' },
]

function sortPlayers(players: Player[], votes: Vote[], tab: RankTab): Player[] {
  return [...players].sort((a, b) => {
    if (tab === 'rating') {
      const ra = getPlayerRating(a.id, votes)?.avg ?? 0
      const rb = getPlayerRating(b.id, votes)?.avg ?? 0
      return rb - ra
    }
    if (tab === 'puntos') {
      return calcPlayerTotalPoints(b) - calcPlayerTotalPoints(a)
    }
    return (b[tab] as number) - (a[tab] as number)
  })
}

interface RankingTableProps {
  players: Player[]
  votes: Vote[]
  communityId: string
  communityColor?: string
  adminIds?: string[]
}

export function RankingTable({ players, votes, communityId, communityColor = '#a8ff3e', adminIds = [] }: RankingTableProps) {
  const [tab, setTab] = useState<RankTab>('puntos')
  const sorted = sortPlayers(players, votes, tab)

  const getValue = (p: Player): string => {
    if (tab === 'rating') {
      const r = getPlayerRating(p.id, votes)
      return r ? r.avg.toFixed(1) : '—'
    }
    if (tab === 'puntos') {
      return String(calcPlayerTotalPoints(p))
    }
    return String(p[tab] ?? 0)
  }

  const top3 = sorted.slice(0, 3)
  const rest  = sorted.slice(3)

  // Podium order: 2nd | 1st | 3rd
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

  return (
    <div className="space-y-4">
      {/* ── Scrollable pill tabs ──────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-none">
        {TABS.map(t => {
          const active = tab === t.key
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

      {/* ── Podio visual top 3 ───────────────────────── */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-2 pt-3 pb-1">
          {podiumOrder.map((player) => {
            if (!player) return null
            const originalPos = sorted.indexOf(player) + 1
            const meta = podiumMeta.find(m => m.pos === originalPos) ?? podiumMeta[2]
            const isFirst = originalPos === 1

            return (
              <Link
                key={player.id}
                href={`/${communityId}/jugadores/${player.id}`}
                className="no-lift flex flex-col items-center gap-1.5 flex-1 max-w-[110px] active:scale-95 transition-transform"
              >
                {/* Medal */}
                <span
                  className="leading-none"
                  style={{
                    fontSize: isFirst ? 30 : 22,
                    filter: isFirst ? `drop-shadow(0 2px 6px ${communityColor}55)` : 'none',
                  }}
                  aria-hidden="true"
                >
                  {meta.medal}
                </span>

                {/* Avatar */}
                <Avatar
                  name={player.name}
                  avatar={player.avatar}
                  size={isFirst ? 64 : 46}
                  fontSize={isFirst ? 18 : 13}
                  fontWeight={600}
                  communityColor={communityColor}
                  borderColor={meta.labelColor}
                  boxShadow={isFirst
                    ? `0 0 0 3px ${communityColor}14, 0 8px 24px ${communityColor}40, 0 2px 6px rgba(0,0,0,0.4)`
                    : `0 2px 8px rgba(0,0,0,0.35), 0 0 0 2px ${meta.labelColor}18`
                  }
                />

                {/* Name */}
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

                {/* Value — display number con tracking negativo y tabular */}
                <p
                  className="font-bebas leading-none"
                  style={{
                    fontSize: isFirst ? 30 : 22,
                    letterSpacing: '-0.015em',
                    color: meta.labelColor,
                    textShadow: isFirst ? `0 0 18px ${meta.labelColor}55` : 'none',
                  }}
                >
                  {getValue(player)}
                </p>

                {/* Podium plinth — inner border + tint shadow */}
                <div
                  className="w-full rounded-t-m relative overflow-hidden"
                  style={{
                    height: meta.height,
                    background: isFirst
                      ? `linear-gradient(180deg, ${communityColor}2b 0%, ${communityColor}10 100%)`
                      : 'var(--card)',
                    border: `1px solid ${isFirst ? communityColor + '55' : 'var(--border)'}`,
                    borderBottom: 'none',
                    boxShadow: isFirst
                      ? `0 -6px 20px ${communityColor}1c inset, 0 1px 0 rgba(255,255,255,0.06) inset`
                      : '0 1px 0 rgba(255,255,255,0.04) inset',
                  }}
                >
                  {/* Position numeral grabado en el plinth */}
                  <span
                    className="font-bebas absolute inset-x-0 bottom-1 text-center leading-none select-none"
                    style={{
                      fontSize: isFirst ? 42 : 28,
                      letterSpacing: '-0.02em',
                      color: isFirst ? `${communityColor}33` : 'rgba(255,255,255,0.06)',
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
      )}

      {/* ── Lista 4th+ ───────────────────────────────── */}
      {rest.length > 0 && (
        <div className="space-y-1.5">
          {rest.map((player, index) => {
            const pos = index + 4
            const level = getLevel(player.xp)

            return (
              <Link key={player.id} href={`/${communityId}/jugadores/${player.id}`}>
                <div
                  className="card flex items-center gap-3 px-4 py-3 active:scale-[0.98]"
                >
                  {/* Position */}
                  <span
                    className="font-bebas w-7 text-center flex-shrink-0 leading-none"
                    style={{
                      fontSize: 20,
                      letterSpacing: '-0.01em',
                      color: 'var(--muted)',
                      fontWeight: 400,
                    }}
                  >
                    {pos}
                  </span>

                  {/* Avatar */}
                  <Avatar
                    name={player.name}
                    avatar={player.avatar}
                    size={36}
                    fontSize={12}
                    fontWeight={600}
                    communityColor={communityColor}
                  />

                  {/* Name & level */}
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
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: communityColor, fontWeight: 500 }}
                    >
                      {level.icon} {level.name}
                    </p>
                  </div>

                  {/* Value */}
                  <p
                    className="font-bebas flex-shrink-0 leading-none"
                    style={{
                      fontSize: 22,
                      letterSpacing: '-0.015em',
                      color: communityColor,
                    }}
                  >
                    {getValue(player)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
