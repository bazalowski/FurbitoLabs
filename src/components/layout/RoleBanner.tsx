import type { Role } from '@/types'

interface RoleBannerProps {
  role: Role
  playerName?: string
  onPinClick: () => void
  onExitClick: () => void
}

const roleConfig = {
  admin:  { icon: '👑', label: 'Admin',    bg: 'rgba(255,215,0,0.06)',   border: 'rgba(255,215,0,0.3)',  color: 'var(--gold)'   },
  player: { icon: '⚽', label: 'Jugador',  bg: 'rgba(168,255,62,0.06)',  border: 'var(--border-a)',      color: 'var(--accent)' },
  guest:  { icon: '👀', label: 'Invitado', bg: 'rgba(255,255,255,0.03)', border: 'var(--border)',         color: 'var(--muted)'  },
}

export function RoleBanner({ role, playerName, onPinClick, onExitClick }: RoleBannerProps) {
  const c = roleConfig[role]
  const name = playerName ?? c.label
  return (
    <div
      className="flex items-center justify-between px-3 text-xs font-bold"
      style={{ height: 32, background: c.bg, borderBottom: `1px solid ${c.border}`, color: c.color }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span aria-hidden="true">{c.icon}</span>
        <span className="truncate">{name}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onPinClick}
          aria-label="Cambiar jugador"
          title="Cambiar jugador"
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs opacity-60 hover:opacity-100 active:scale-90 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          🔑
        </button>
        <button
          onClick={onExitClick}
          aria-label="Salir de la comunidad"
          title="Salir de la comunidad"
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs opacity-60 hover:opacity-100 active:scale-90 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          🚪
        </button>
      </div>
    </div>
  )
}
