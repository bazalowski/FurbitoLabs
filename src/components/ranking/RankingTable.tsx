'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getLevel } from '@/lib/game/levels'
import { getPlayerRating } from '@/lib/game/scoring'
import { initials } from '@/lib/utils'
import type { Player, Vote } from '@/types'

type RankTab = 'xp' | 'goles' | 'asistencias' | 'mvps' | 'partidos' | 'rating'

const TABS: { key: RankTab; label: string; icon: string }[] = [
  { key: 'xp',          label: 'XP',      icon: '⭐' },
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
  const [tab, setTab] = useState<RankTab>('xp')
  const sorted = sortPlayers(players, votes, tab)

  const getValue = (p: Player): string => {
    if (tab === 'rating') {
      const r = getPlayerRating(p.id, votes)
      return r ? r.avg.toFixed(1) : '—'
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
    { pos: 2, medal: '🥈', height: 'h-24', labelColor: '#94a3b8' },
    { pos: 1, medal: '🥇', height: 'h-32', labelColor: '#ffd700' },
    { pos: 3, medal: '🥉', height: 'h-20', labelColor: '#cd7f32' },
  ]

  return (
    <div className="space-y-4">
      {/* ── Scrollable pill tabs ──────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-shrink-0 snap-start px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all min-h-[36px] flex items-center gap-1 active:scale-95"
            style={
              tab === t.key
                ? { background: communityColor, color: '#050d05' }
                : { background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Podio visual top 3 ───────────────────────── */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-2 pt-2 pb-1">
          {podiumOrder.map((player, i) => {
            if (!player) return null
            const originalPos = sorted.indexOf(player) + 1
            const meta = podiumMeta.find(m => m.pos === originalPos) ?? podiumMeta[2]
            const isFirst = originalPos === 1

            return (
              <Link
                key={player.id}
                href={`/${communityId}/jugadores/${player.id}`}
                className="flex flex-col items-center gap-1 flex-1 max-w-[110px] active:scale-95 transition-transform"
              >
                {/* Medal */}
                <span className="text-2xl">{meta.medal}</span>

                {/* Avatar */}
                <div
                  className="rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all"
                  style={{
                    width: isFirst ? 56 : 44,
                    height: isFirst ? 56 : 44,
                    background: communityColor + '22',
                    color: communityColor,
                    border: `2px solid ${meta.labelColor}`,
                    boxShadow: isFirst ? `0 0 12px ${communityColor}44` : 'none',
                  }}
                >
                  {player.avatar ?? initials(player.name)}
                </div>

                {/* Name */}
                <p
                  className="text-xs font-bold text-center truncate w-full px-1 leading-tight"
                  style={{ color: isFirst ? communityColor : 'var(--fg)' }}
                >
                  {player.name.split(' ')[0]}
                </p>

                {/* Value */}
                <p className="font-bebas text-base tracking-wider" style={{ color: meta.labelColor }}>
                  {getValue(player)}
                </p>

                {/* Podium plinth */}
                <div
                  className={`w-full ${meta.height} rounded-t-m`}
                  style={{
                    background: isFirst ? communityColor + '22' : 'var(--card)',
                    border: `1px solid ${isFirst ? communityColor + '44' : 'var(--border)'}`,
                    borderBottom: 'none',
                  }}
                />
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
                  className="flex items-center gap-3 px-4 py-3 rounded-m transition-all active:scale-[0.98]"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {/* Position */}
                  <span className="font-bebas text-xl w-7 text-center flex-shrink-0" style={{ color: 'var(--muted)' }}>
                    {pos}
                  </span>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: communityColor + '22', color: communityColor }}
                  >
                    {player.avatar ?? initials(player.name)}
                  </div>

                  {/* Name & level */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm truncate">{player.name}</p>
                      {adminIds.includes(player.id) && <span className="text-xs">👑</span>}
                    </div>
                    <p className="text-xs" style={{ color: communityColor }}>
                      {level.icon} {level.name}
                    </p>
                  </div>

                  {/* Value */}
                  <p className="font-bebas text-xl tracking-wider flex-shrink-0" style={{ color: communityColor }}>
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
