import type { Role } from '@/types'

interface RoleBannerProps {
  role: Role
  playerName?: string
}

const roleConfig = {
  admin: {
    icon: '👑',
    label: 'Administrador',
    style: { background: 'rgba(255,215,0,0.06)', borderBottom: '1px solid rgba(255,215,0,0.3)', color: 'var(--gold)' },
  },
  player: {
    icon: '⚽',
    label: 'Jugador',
    style: { background: 'rgba(168,255,62,0.06)', borderBottom: '1px solid var(--border-a)', color: 'var(--accent)' },
  },
  guest: {
    icon: '👀',
    label: 'Invitado',
    style: { background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', color: 'var(--muted)' },
  },
}

export function RoleBanner({ role, playerName }: RoleBannerProps) {
  const config = roleConfig[role]
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-xs font-bold"
      style={config.style}
    >
      <span>{config.icon}</span>
      <span>{playerName ? playerName : config.label}</span>
      {playerName && (
        <span className="opacity-60 font-normal">· {config.label}</span>
      )}
    </div>
  )
}
