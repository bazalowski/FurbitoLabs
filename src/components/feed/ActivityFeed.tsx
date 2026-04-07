'use client'

import { useMemo, useState } from 'react'
import type { Event, Player } from '@/types'

type ActivityType = 'match_result' | 'badge_earned' | 'player_joined'

interface ActivityItem {
  id: string
  type: ActivityType
  icon: string
  title: string
  description: string
  time: string
  sortDate: number
}

interface ActivityFeedProps {
  events: Event[]
  players: Player[]
  maxItems?: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return `Hace ${Math.floor(days / 7)}sem`
}

function buildActivities(events: Event[], players: Player[]): ActivityItem[] {
  const items: ActivityItem[] = []

  // Match results from finalized events
  for (const ev of events) {
    if (ev.finalizado && ev.goles_a != null && ev.goles_b != null) {
      items.push({
        id: `match_${ev.id}`,
        type: 'match_result',
        icon: '\u26BD',
        title: ev.titulo,
        description: `Resultado: ${ev.goles_a} - ${ev.goles_b}`,
        time: timeAgo(ev.fecha ?? ev.created_at),
        sortDate: new Date(ev.fecha ?? ev.created_at).getTime(),
      })
    }
  }

  // Player badges
  for (const p of players) {
    if (p.badges && p.badges.length > 0) {
      const latestBadge = p.badges[p.badges.length - 1]
      items.push({
        id: `badge_${p.id}`,
        type: 'badge_earned',
        icon: '\uD83C\uDFC5',
        title: `${p.name} gan\u00F3 una insignia`,
        description: latestBadge,
        time: timeAgo(p.created_at),
        sortDate: new Date(p.created_at).getTime(),
      })
    }
  }

  // New players joined
  for (const p of players) {
    items.push({
      id: `joined_${p.id}`,
      type: 'player_joined',
      icon: '\uD83D\uDC4B',
      title: `${p.name} se uni\u00F3`,
      description: p.position ? `Posici\u00F3n: ${p.position}` : 'Nuevo jugador',
      time: timeAgo(p.created_at),
      sortDate: new Date(p.created_at).getTime(),
    })
  }

  items.sort((a, b) => b.sortDate - a.sortDate)
  return items.slice(0, 10)
}

export function ActivityFeed({ events, players, maxItems = 10 }: ActivityFeedProps) {
  const activities = useMemo(() => buildActivities(events, players).slice(0, maxItems), [events, players, maxItems])
  const [open, setOpen] = useState(false)

  if (activities.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 active:opacity-70 transition-opacity"
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Actividad reciente ({activities.length})
        </span>
        <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div
          className="rounded-m overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {activities.map((item, i) => (
            <div
              key={item.id}
              className="flex items-start gap-3 px-4 py-3"
              style={{
                borderTop: i > 0 ? '1px solid var(--border)' : undefined,
              }}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                  {item.description}
                </p>
              </div>
              <span
                className="text-xs flex-shrink-0 mt-0.5"
                style={{ color: 'var(--muted)' }}
              >
                {item.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
