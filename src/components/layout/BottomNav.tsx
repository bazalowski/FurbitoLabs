'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavTab, Role } from '@/types'

interface NavItem {
  tab: NavTab
  label: string
  icon: string
  href: string
}

function buildNav(cid: string, role?: Role, playerId?: string | null, playerName?: string | null): NavItem[] {
  const perfilHref =
    (role === 'player' || role === 'admin') && playerId
      ? `/${cid}/jugadores/${playerId}`
      : `/${cid}/jugadores`

  const perfilLabel = role === 'guest'
    ? 'Acceder'
    : playerName
      ? playerName.split(' ')[0].slice(0, 8)
      : 'Perfil'

  return [
    { tab: 'home',      label: 'Inicio',      icon: '\u{1F3E0}', href: `/${cid}` },
    { tab: 'partidos',  label: 'Partidos',     icon: '\u26BD',    href: `/${cid}/partidos` },
    { tab: 'jugadores', label: 'Jugadores',    icon: '\u{1F465}', href: `/${cid}/jugadores` },
    { tab: 'ranking',   label: 'Ranking',      icon: '\u{1F3C6}', href: `/${cid}/ranking` },
    { tab: 'perfil',    label: perfilLabel,     icon: '\u{1F464}', href: perfilHref },
  ]
}

interface BottomNavProps {
  communityId: string
  communityColor?: string
  role?: Role
  playerId?: string | null
  playerName?: string | null
  onAcceder?: () => void
}

export function BottomNav({ communityId, communityColor = '#a8ff3e', role, playerId, playerName, onAcceder }: BottomNavProps) {
  const pathname = usePathname()
  const navItems = buildNav(communityId, role, playerId, playerName)
  const [hidden, setHidden] = useState(false)

  const lastScrollY = useRef(0)
  const scrollDelta = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollY.current

      // Accumulate delta in same direction, reset on direction change
      if ((diff > 0 && scrollDelta.current < 0) || (diff < 0 && scrollDelta.current > 0)) {
        scrollDelta.current = 0
      }
      scrollDelta.current += diff

      // Scrolling DOWN: hide if delta > 12px and past 100px from top
      if (scrollDelta.current > 12 && currentY > 100) {
        setHidden(true)
        scrollDelta.current = 0
      }

      // Scrolling UP: show if delta < -12px
      if (scrollDelta.current < -12) {
        setHidden(false)
        scrollDelta.current = 0
      }

      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function isActive(item: NavItem): boolean {
    if (item.tab === 'home') return pathname === `/${communityId}`
    if (item.tab === 'perfil') {
      // For perfil tab, match the exact href (player profile or jugadores page for guests)
      if (item.href.includes('/jugadores/')) {
        return pathname === item.href
      }
      // Guest perfil points to /jugadores which would conflict with jugadores tab
      return false
    }
    return pathname.startsWith(item.href)
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app flex items-start justify-around pt-2 z-50 nav-transition"
      style={{
        height: 'calc(var(--nav-h) + var(--safe-bottom, 0px))',
        paddingBottom: 'var(--safe-bottom)',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,.4)',
        backdropFilter: 'blur(20px)',
        transform: hidden
          ? 'translateX(-50%) translateY(100%)'
          : 'translateX(-50%) translateY(0)',
      }}
    >
      {navItems.map(item => {
        const active = isActive(item)
        const isAcceder = item.tab === 'perfil' && role === 'guest'

        const innerContent = (
          <>
            {active && (
              <span
                className="absolute top-[-1px] left-1/4 right-1/4 h-0.5 rounded-b"
                style={{ background: communityColor }}
              />
            )}
            <span className="text-xl" style={{ filter: active ? 'none' : 'grayscale(1) opacity(.45)', transform: active ? 'translateY(-1px)' : 'none', transition: 'all .2s' }}>
              {isAcceder ? '🔑' : item.icon}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wide max-w-[56px] overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: isAcceder ? communityColor : active ? communityColor : 'var(--muted)', transition: 'color .18s' }}
            >
              {item.label}
            </span>
          </>
        )

        if (isAcceder) {
          return (
            <button
              key={item.tab}
              onClick={onAcceder}
              aria-label="Acceder con PIN"
              className="flex flex-col items-center gap-0.5 px-3 py-2 flex-1 relative min-h-[48px] transition-all active:scale-95"
              style={{ WebkitTapHighlightColor: 'transparent', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {innerContent}
            </button>
          )
        }

        return (
          <Link
            key={item.tab}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className="flex flex-col items-center gap-0.5 px-3 py-2 flex-1 relative min-h-[48px] transition-all active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {innerContent}
          </Link>
        )
      })}
    </nav>
  )
}
