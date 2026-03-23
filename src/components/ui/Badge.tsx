import { BADGE_DEFS } from '@/lib/game/badges'
import { cn } from '@/lib/utils'

interface BadgeChipProps {
  badgeKey: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

const sizeStyles = {
  sm: { icon: 'text-lg', name: 'text-xs' },
  md: { icon: 'text-2xl', name: 'text-xs' },
  lg: { icon: 'text-4xl', name: 'text-sm' },
}

export function BadgeChip({ badgeKey, size = 'md', showName = false }: BadgeChipProps) {
  const def = BADGE_DEFS[badgeKey]
  if (!def) return null

  return (
    <div
      className={cn('flex flex-col items-center gap-1 p-2 rounded-m', showName && 'min-w-[60px]')}
      style={{ background: 'var(--card)', border: '1px solid var(--border-a)' }}
      title={`${def.name} — ${def.desc}`}
    >
      <span className={sizeStyles[size].icon}>{def.icon}</span>
      {showName && (
        <span className={cn('font-bold text-center leading-tight', sizeStyles[size].name)} style={{ color: 'var(--muted)' }}>
          {def.name}
        </span>
      )}
    </div>
  )
}

interface BadgeListProps {
  badges: string[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function BadgeList({ badges, max, size = 'sm' }: BadgeListProps) {
  const shown = max ? badges.slice(0, max) : badges
  const remaining = max && badges.length > max ? badges.length - max : 0

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(key => (
        <BadgeChip key={key} badgeKey={key} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className="flex items-center justify-center px-2 rounded-m text-xs font-bold"
          style={{ background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
