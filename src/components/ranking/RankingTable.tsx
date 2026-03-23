'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getLevel } from '@/lib/game/levels'
import { getPlayerRating } from '@/lib/game/scoring'
import { initials } from '@/lib/utils'
import type { Player, Vote } from '@/types'

type RankTab = 'xp' | 'goles' | 'asistencias' | 'mvps' | 'partidos' | 'rating'

const TABS: { key: RankTab; label: string; icon: string }[] = [
  { key: 'xp',          label: 'XP',       icon: '⭐' },
  { key: 'goles',       label: 'Goles',    icon: '⚽' },
  { key: 'asistencias', label: 'Asist.',   icon: '🎯' },
  { key: 'mvps',        label: 'MVPs',     icon: '👑' },
  { key: 'partidos',    label: 'PJ',       icon: '🗓️' },
  { key: 'rating',      label: 'Rating',   icon: '🌟' },
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
}

export function RankingTable({ players, votes, communityId, communityColor = '#a8ff3e' }: RankingTableProps) {
  const [tab, setTab] = useState<RankTab>('xp')
  const sorted = sortPlayers(players, votes, tab)

  const getValue = (p: Player): string => {
    if (tab === 'rating') {
      const r = getPlayerRating(p.id, votes)
      return r ? `${r.avg.toFixed(2)} (${r.count})` : '—'
    }
    return String(p[tab] ?? 0)
  }

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-shrink-0 px-3 py-2 rounded-m text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] flex items-center active:scale-95"
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

      {/* Table */}
      <div className="space-y-2">
        {sorted.map((player, index) => {
          const level = getLevel(player.xp)
          const pos = index + 1
          const medalEmoji = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null

          return (
            <Link key={player.id} href={`/${communityId}/jugadores/${player.id}`}>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-m transition-all active:scale-[0.98]"
                style={{
                  background: pos <= 3 ? communityColor + '11' : 'var(--card)',
                  border: `1px solid ${pos <= 3 ? communityColor + '33' : 'var(--border)'}`,
                }}
              >
                {/* Position */}
                <div className="w-8 text-center flex-shrink-0">
                  {medalEmoji
                    ? <span className="text-lg">{medalEmoji}</span>
                    : <span className="font-bebas text-xl" style={{ color: 'var(--muted)' }}>{pos}</span>
                  }
                </div>

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: communityColor + '22', color: communityColor }}
                >
                  {player.avatar ?? initials(player.name)}
                </div>

                {/* Name & level */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{player.name}</p>
                  <p className="text-xs" style={{ color: communityColor }}>
                    {level.icon} {level.name}
                  </p>
                </div>

                {/* Value */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-bebas text-xl tracking-wider" style={{ color: communityColor }}>
                    {getValue(player)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {TABS.find(t => t.key === tab)?.label}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
