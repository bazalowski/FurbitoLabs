'use client'

import Link from 'next/link'
import { getLevel, xpPercent } from '@/lib/game/levels'
import { getPlayerRating } from '@/lib/game/scoring'
import { Avatar } from '@/components/ui/Avatar'
import type { Player, Vote } from '@/types'

const POSITION_BADGE: Record<string, string> = {
  portero:       'PO',
  defensa:       'DF',
  centrocampista:'MC',
  delantero:     'DL',
}

interface PlayerCardProps {
  player: Player
  communityId: string
  rank?: number
  communityColor?: string
  adminIds?: string[]
  votes?: Vote[]
}

export function PlayerCard({
  player,
  communityId,
  rank,
  communityColor = '#a8ff3e',
  adminIds = [],
  votes = [],
}: PlayerCardProps) {
  const level = getLevel(player.xp)
  const pct = xpPercent(player.xp)
  const isAdmin = adminIds.includes(player.id)
  const posBadge = player.position ? POSITION_BADGE[player.position] : null
  const rating = votes.length > 0 ? getPlayerRating(player.id, votes) : null

  return (
    <Link href={`/${communityId}/jugadores/${player.id}`}>
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-m active:scale-[0.98] transition-transform"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Rank */}
        {rank !== undefined && (
          <span
            className="font-bebas text-lg w-5 text-center flex-shrink-0 tabular-nums"
            style={{ color: 'var(--muted)' }}
          >
            {rank}
          </span>
        )}

        {/* Avatar + position badge */}
        <div className="relative flex-shrink-0">
          <Avatar
            name={player.name}
            avatar={player.avatar}
            size={44}
            communityColor={communityColor}
            borderColor={isAdmin ? 'var(--gold)' : communityColor + '44'}
            fontSize={16}
          />
          {posBadge && (
            <span
              className="absolute -bottom-1 -right-1.5 text-[9px] font-bold px-1 py-px rounded"
              style={{ background: 'var(--bg2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              {posBadge}
            </span>
          )}
        </div>

        {/* Name + level + XP bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm truncate">{player.name}</span>
            {isAdmin && (
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded flex-shrink-0"
                style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold)' }}
              >
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[11px]" style={{ color: communityColor }}>
              {level.icon} {level.name}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              · {player.xp} XP
            </span>
          </div>
          <div
            className="mt-1.5 h-[2px] rounded-full overflow-hidden"
            style={{ background: communityColor + '22' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: communityColor }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 tabular-nums">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span>⚽ {player.goles}</span>
            <span style={{ color: 'var(--muted)' }}>A {player.asistencias}</span>
          </div>
          <div className="flex items-center gap-2">
            {rating ? (
              <span className="text-[11px] font-bold" style={{ color: communityColor }}>
                ★ {rating.avg.toFixed(1)}
              </span>
            ) : (
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {player.partidos} PJ
              </span>
            )}
            {player.mvps > 0 && (
              <span className="text-[11px] font-bold" style={{ color: 'var(--gold)' }}>
                🏅 {player.mvps}
              </span>
            )}
          </div>
        </div>
      </div>
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
    <Avatar
      name={player.name}
      avatar={player.avatar}
      size={size}
      communityColor={communityColor}
      borderColor={communityColor + '44'}
      fontSize={size * 0.35}
    />
  )
}
