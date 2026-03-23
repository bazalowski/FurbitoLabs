'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavTab } from '@/types'

interface NavItem {
  tab: NavTab
  label: string
  icon: string
  href: string
}

function buildNav(cid: string): NavItem[] {
  return [
    { tab: 'home',      label: 'Inicio',    icon: '🏠', href: `/${cid}` },
    { tab: 'partidos',  label: 'Partidos',  icon: '⚽', href: `/${cid}/partidos` },
    { tab: 'jugadores', label: 'Jugadores', icon: '👥', href: `/${cid}/jugadores` },
    { tab: 'ranking',   label: 'Ranking',   icon: '🏆', href: `/${cid}/ranking` },
    { tab: 'pistas',    label: 'Pistas',    icon: '🗺️', href: `/${cid}/pistas` },
  ]
}

interface BottomNavProps {
  communityId: string
  communityColor?: string
}

export function BottomNav({ communityId, communityColor = '#a8ff3e' }: BottomNavProps) {
  const pathname = usePathname()
  const navItems = buildNav(communityId)

  function isActive(item: NavItem): boolean {
    if (item.tab === 'home') return pathname === `/${communityId}`
    return pathname.startsWith(item.href)
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app flex items-start justify-around pt-2 z-50"
      style={{
        height: 'calc(var(--nav-h) + var(--safe-bottom, 0px))',
        paddingBottom: 'var(--safe-bottom)',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,.4)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {navItems.map(item => {
        const active = isActive(item)
        return (
          <Link
            key={item.tab}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-2 flex-1 relative min-h-[48px] transition-all active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {active && (
              <span
                className="absolute top-[-1px] left-1/4 right-1/4 h-0.5 rounded-b"
                style={{ background: communityColor }}
              />
            )}
            <span className="text-xl" style={{ filter: active ? 'none' : 'grayscale(1) opacity(.45)', transform: active ? 'translateY(-1px)' : 'none', transition: 'all .2s' }}>
              {item.icon}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wide max-w-[56px] overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: active ? communityColor : 'var(--muted)', transition: 'color .18s' }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
