'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { BadgeList } from '@/components/ui/Badge'
import { getLevel, xpPercent } from '@/lib/game/levels'
import { initials } from '@/lib/utils'
import type { Player } from '@/types'

interface PlayerCardProps {
  player: Player
  communityId: string
  rank?: number
  communityColor?: string
  adminIds?: string[]
}

export function PlayerCard({ player, communityId, rank, communityColor = '#a8ff3e', adminIds = [] }: PlayerCardProps) {
  const level = getLevel(player.xp)
  const pct = xpPercent(player.xp)
  const isAdmin = adminIds.includes(player.id)

  return (
    <Link href={`/${communityId}/jugadores/${player.id}`}>
      <Card className="flex items-center gap-4">
        {/* Rank */}
        {rank !== undefined && (
          <div className="font-bebas text-2xl w-8 text-center flex-shrink-0" style={{ color: communityColor }}>
            {rank}
          </div>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: communityColor + '22', color: communityColor, border: `2px solid ${isAdmin ? 'var(--gold, #ffd700)' : communityColor + '44'}` }}
          >
            {player.avatar ?? initials(player.name)}
          </div>
          {isAdmin && (
            <span
              className="absolute -top-1 -right-1 text-xs"
              title="Admin"
              style={{ filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.6))' }}
            >
              {'\uD83D\uDC51'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm truncate">{player.name}</span>
            {isAdmin && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold, #ffd700)' }}
              >
                Admin
              </span>
            )}
            {player.vitrina.slice(0, 3).map(b => (
              <span key={b} className="text-sm" title={b}>{/* badge icon */}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: communityColor }}>
              {level.icon} {level.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {player.xp} XP
            </span>
          </div>
          {/* XP Bar */}
          <div className="xp-bar mt-1.5">
            <div className="xp-bar-fill" style={{ width: `${pct}%`, background: communityColor }} />
          </div>
        </div>

        {/* Stats mini */}
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className="text-xs font-bold">{player.goles}⚽</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{player.partidos} PJ</span>
        </div>
      </Card>
    </Link>
  )
}

interface PlayerAvatarProps {
  player: Player
  size?: number
  communityColor?: string
}

export function PlayerAvatar({ player, size = 40, communityColor = '#a8ff3e' }: PlayerAvatarProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: communityColor + '22',
        color: communityColor,
        border: `2px solid ${communityColor}44`,
      }}
    >
      {player.avatar ?? initials(player.name)}
    </div>
  )
}
