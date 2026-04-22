import type { SVGProps } from 'react'

export type IconName =
  | 'ball'
  | 'user'
  | 'users'
  | 'calendar'
  | 'trophy'
  | 'crown'
  | 'star'
  | 'bolt'
  | 'pin'
  | 'target'
  | 'whistle'
  | 'jersey'
  | 'goal'
  | 'podium'
  | 'gear'
  | 'check'
  | 'x'
  | 'plus'
  | 'trash'
  | 'chart'
  | 'flame'
  | 'medal'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number | string
}

/**
 * Retro arcade icon set — thick outline, 24×24 viewBox. `currentColor` drives stroke so
 * you can tint via CSS `color` (matches the rest of the design system).
 */
export function Icon({ name, size = 22, stroke = 'currentColor', ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }
  return <svg {...common}>{PATHS[name]}</svg>
}

const PATHS: Record<IconName, React.ReactNode> = {
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,8 15,10.2 13.8,13.8 10.2,13.8 9,10.2" fill="currentColor" stroke="none" />
      <path d="M12 3v5M21 12h-4.5M7.5 12H3M5.6 5.6l3 2.4M18.4 5.6l-3 2.4M5.6 18.4l4.5-4.5M18.4 18.4l-4.5-4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3.2" />
      <circle cx="17" cy="10" r="2.6" />
      <path d="M3 20c0-3.2 2.8-5 6-5s6 1.8 6 5" />
      <path d="M15 15.2c2.6 0 6 1.5 6 4.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
      <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 01-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3" />
      <path d="M10 14h4v3l1 3H9l1-3z" />
    </>
  ),
  crown: (
    <>
      <path d="M3 8l4 4 5-7 5 7 4-4-2 10H5z" />
      <circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="21" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <path d="M5 18h14" />
    </>
  ),
  star: (
    <polygon points="12,3 14.7,9.2 21.4,9.7 16.3,14.1 18,20.7 12,17 6,20.7 7.7,14.1 2.6,9.7 9.3,9.2" />
  ),
  bolt: (
    <polygon points="13,2 4,14 11,14 10,22 20,10 13,10" />
  ),
  pin: (
    <>
      <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  whistle: (
    <>
      <path d="M3 12a5 5 0 0110 0v3H3z" />
      <circle cx="6" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <path d="M13 12l5-3v6z" />
      <path d="M18 7v-2" />
    </>
  ),
  jersey: (
    <>
      <path d="M4 7l4-3h8l4 3-2 3-3-1v12H7V9L4 10z" />
      <path d="M9 4c.5 1.5 1.5 2.5 3 2.5S14.5 5.5 15 4" />
    </>
  ),
  goal: (
    <>
      <rect x="3" y="6" width="18" height="12" />
      <path d="M6 6v12M9 6v12M12 6v12M15 6v12M18 6v12" />
      <path d="M3 9h18M3 12h18M3 15h18" />
    </>
  ),
  podium: (
    <>
      <rect x="9" y="7" width="6" height="13" />
      <rect x="2" y="11" width="7" height="9" />
      <rect x="15" y="9" width="7" height="11" />
      <path d="M12 4l.8 1.8 2 .2-1.5 1.4.4 2-1.7-1-1.7 1 .4-2-1.5-1.4 2-.2z" fill="currentColor" stroke="none" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    </>
  ),
  check: <polyline points="4,13 10,19 20,6" />,
  x: <path d="M5 5l14 14M19 5L5 19" />,
  plus: <path d="M12 4v16M4 12h16" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <rect x="6" y="7" width="12" height="14" rx="1" />
      <path d="M10 11v7M14 11v7" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" fill="currentColor" stroke="none" />
      <rect x="12" y="8" width="3" height="10" fill="currentColor" stroke="none" />
      <rect x="17" y="4" width="3" height="14" fill="currentColor" stroke="none" />
    </>
  ),
  flame: (
    <path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3 1-6 1-10z" />
  ),
  medal: (
    <>
      <path d="M8 3l2 6M16 3l-2 6" />
      <circle cx="12" cy="15" r="6" />
      <polygon points="12,11 13,13.5 15.5,13.7 13.6,15.4 14.3,18 12,16.6 9.7,18 10.4,15.4 8.5,13.7 11,13.5" fill="currentColor" stroke="none" />
    </>
  ),
}

export default Icon
