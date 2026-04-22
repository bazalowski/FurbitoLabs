'use client'

import { useId } from 'react'
import {
  ACCENT_PALETTE,
  TIER_PALETTE,
  getBadgeArt,
  type BadgeArt as BadgeArtData,
  type BadgeGlyph,
} from '@/lib/game/badge-art'

export interface BadgeArtProps {
  badgeKey: string
  size?: number
  /** Show a faint locked state (grayscale + dim). */
  locked?: boolean
  /** Shown under the frame. Keep off for dense grids. */
  showLabel?: boolean
  className?: string
}

/**
 * Composed SVG badge rendered from {@link getBadgeArt} metadata. Falls back to the
 * legacy emoji (inside a simple circle frame) when the key is unknown, so existing
 * BADGE_DEFS entries without an art mapping still display.
 */
export function BadgeArt({ badgeKey, size = 64, locked = false, showLabel = false, className }: BadgeArtProps) {
  const art = getBadgeArt(badgeKey)
  const uid = useId().replace(/:/g, '')

  if (!art) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--card)',
          border: '2px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.5,
          opacity: locked ? 0.25 : 1,
          filter: locked ? 'grayscale(1)' : undefined,
        }}
      >
        ❓
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{
          filter: locked ? 'grayscale(1)' : `drop-shadow(0 2px 4px rgba(0,0,0,0.35))`,
          opacity: locked ? 0.3 : 1,
        }}
        role="img"
        aria-label={art.label}
      >
        <BadgeFrame art={art} uid={uid} />
        <BadgeGlyphShape glyph={art.glyph} accent={art.accent ?? 'neon'} />
      </svg>
      {showLabel && (
        <span
          className="text-[10px] text-center leading-tight"
          style={{
            color: locked ? 'var(--muted)' : 'var(--text)',
            maxWidth: size + 16,
            wordBreak: 'break-word',
          }}
        >
          {art.label}
        </span>
      )}
    </div>
  )
}

function BadgeFrame({ art, uid }: { art: BadgeArtData; uid: string }) {
  const tier = TIER_PALETTE[art.tier]
  const ringId = `br-${uid}`
  const fieldId = `bf-${uid}`
  const glowId = `bg-${uid}`
  return (
    <>
      <defs>
        <linearGradient id={ringId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={tier.highlight} />
          <stop offset="45%" stopColor={tier.ring} />
          <stop offset="85%" stopColor={tier.inner} />
          <stop offset="100%" stopColor={tier.outer} />
        </linearGradient>
        <radialGradient id={fieldId} cx="50%" cy="42%" r="60%">
          <stop offset="0%"   stopColor="#1e4a26" />
          <stop offset="60%"  stopColor="#0f2a14" />
          <stop offset="100%" stopColor="#0a1408" />
        </radialGradient>
        <radialGradient id={glowId} cx="50%" cy="38%" r="50%">
          <stop offset="0%" stopColor={tier.ring} stopOpacity="0.35" />
          <stop offset="100%" stopColor={tier.ring} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* outer ring */}
      <circle cx="50" cy="50" r="48" fill={`url(#${ringId})`} stroke="#0a1408" strokeWidth="2" />
      {/* inner pitch */}
      <circle cx="50" cy="50" r="38" fill={`url(#${fieldId})`} stroke="#0a1408" strokeWidth="1.5" />
      {/* glow */}
      <circle cx="50" cy="50" r="38" fill={`url(#${glowId})`} />
      {/* arcade corner rivets */}
      {[22, 78].map(x =>
        [22, 78].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="#0a1408" opacity="0.4" />
        )),
      )}
      {/* tier tick marks at 12/3/6/9 */}
      {[0, 90, 180, 270].map(deg => {
        const rad = (deg * Math.PI) / 180
        const x1 = 50 + Math.cos(rad) * 46
        const y1 = 50 + Math.sin(rad) * 46
        const x2 = 50 + Math.cos(rad) * 42
        const y2 = 50 + Math.sin(rad) * 42
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0a1408" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
        )
      })}
    </>
  )
}

function BadgeGlyphShape({ glyph, accent }: { glyph: BadgeGlyph; accent: NonNullable<BadgeArtData['accent']> }) {
  const color = ACCENT_PALETTE[accent]
  const stroke = '#0a1408'
  const strokeWidth = 1.5
  const common = { stroke, strokeWidth, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

  switch (glyph) {
    case 'ball':
      return (
        <g transform="translate(50 52)">
          <circle r="18" fill="#fff7dc" {...common} />
          <circle cx="-5" cy="-5" r="5" fill="#ffffff" opacity="0.7" />
          <polygon points="0,-8 7,-3 4,6 -4,6 -7,-3" fill="#0a1408" />
          <g {...common} fill="none">
            <line x1="0"  y1="-8" x2="0"   y2="-16" />
            <line x1="7"  y1="-3" x2="14"  y2="-9" />
            <line x1="-7" y1="-3" x2="-14" y2="-9" />
            <line x1="4"  y1="6"  x2="10"  y2="14" />
            <line x1="-4" y1="6"  x2="-10" y2="14" />
          </g>
        </g>
      )

    case 'double':
      return (
        <g transform="translate(50 52)">
          <g transform="translate(-9 0)">
            <circle r="11" fill="#fff7dc" {...common} />
            <polygon points="0,-5 4,-2 2,3 -2,3 -4,-2" fill="#0a1408" />
          </g>
          <g transform="translate(10 3)">
            <circle r="11" fill={color} {...common} />
            <polygon points="0,-5 4,-2 2,3 -2,3 -4,-2" fill="#0a1408" />
          </g>
        </g>
      )

    case 'target':
      return (
        <g transform="translate(50 52)" fill="none" {...common}>
          <circle r="20" stroke={color} strokeWidth="2.5" />
          <circle r="14" stroke={color} strokeWidth="2.5" />
          <circle r="7" fill={color} stroke={stroke} />
          <circle r="2.5" fill={stroke} />
          <path d="M-22 0 h8 M14 0 h8 M0 -22 v8 M0 14 v8" stroke={color} strokeWidth="2.5" />
        </g>
      )

    case 'boot':
      return (
        <g transform="translate(50 56)" fill={color} {...common}>
          <path d="M-20 -4 l18 0 l4 -14 l8 0 l2 16 l8 2 l0 8 l-40 0 z" />
          <path d="M-20 4 l40 0" stroke={stroke} fill="none" />
          <circle cx="18" cy="-10" r="1.5" fill={stroke} stroke="none" />
        </g>
      )

    case 'swallow':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          {/* stylized swallow kick / bicycle — upside-down boot with arc */}
          <path d="M-22 6 q22 -28 44 0 q-6 -6 -14 -4 q-4 -10 -14 -4 q-10 -2 -16 8 z" />
          <circle cx="-18" cy="6" r="2" fill="#fff7dc" stroke={stroke} />
        </g>
      )

    case 'pass':
      return (
        <g transform="translate(50 52)" fill="none" {...common}>
          <path d="M-22 10 q12 -28 22 -14 q4 6 14 -6" stroke={color} strokeWidth="3" strokeDasharray="4 3" />
          <circle cx="-22" cy="10" r="3.5" fill="#fff7dc" stroke={stroke} />
          <path d="M18 -4 l6 -6 l0 10 l-10 0 z" fill={color} stroke={stroke} />
        </g>
      )

    case 'brain':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <path d="M-14 -10 q-8 0 -8 8 q-4 2 -4 8 q0 8 8 8 q0 4 6 4 l12 0 q6 0 6 -4 q8 0 8 -8 q0 -6 -4 -8 q0 -8 -8 -8 q-2 -4 -8 -4 q-6 0 -8 4z" />
          <path d="M0 -12 v28 M-10 -4 q4 0 6 4 M10 -4 q-4 0 -6 4" stroke={stroke} fill="none" strokeWidth="1.5" />
        </g>
      )

    case 'baton':
      return (
        <g transform="translate(50 52)" fill="none" {...common}>
          <line x1="-18" y1="16" x2="16" y2="-14" stroke={color} strokeWidth="5" />
          <circle cx="16" cy="-14" r="4" fill={color} stroke={stroke} />
          <circle cx="-18" cy="16" r="4" fill={color} stroke={stroke} />
        </g>
      )

    case 'star':
      return (
        <polygon
          points="50,26 56.5,42.5 74,44 60,55 65,72 50,63 35,72 40,55 26,44 43.5,42.5"
          fill={color}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )

    case 'crown':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <path d="M-22 4 l4 -18 l8 8 l10 -14 l10 14 l8 -8 l4 18 z" />
          <rect x="-22" y="4" width="44" height="6" />
          <circle cx="0" cy="-14" r="2.5" fill="#ff3e88" stroke={stroke} />
          <circle cx="-18" cy="-14" r="2" fill="#3ee8ff" stroke={stroke} />
          <circle cx="18" cy="-14" r="2" fill="#3ee8ff" stroke={stroke} />
        </g>
      )

    case 'trophy':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <path d="M-14 -18 l28 0 l0 6 q0 12 -14 12 q-14 0 -14 -12 z" />
          <path d="M-14 -14 l-6 0 l0 4 q0 6 6 6 M14 -14 l6 0 l0 4 q0 6 -6 6" fill="none" />
          <rect x="-4" y="0" width="8" height="8" />
          <rect x="-12" y="8" width="24" height="4" />
        </g>
      )

    case 'glove':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <path d="M-14 -14 l6 0 l0 -4 l6 0 l0 4 l4 0 l0 -6 l6 0 l0 6 l4 0 l0 -2 l6 0 l0 12 l-4 6 l0 10 l-28 0 z" />
          <line x1="-4" y1="-6" x2="4" y2="-6" stroke={stroke} fill="none" />
        </g>
      )

    case 'shield':
      return (
        <g transform="translate(50 50)" fill={color} {...common}>
          <path d="M0 -22 l20 6 l0 12 q0 14 -20 24 q-20 -10 -20 -24 l0 -12 z" />
          <path d="M-10 -4 l6 6 l14 -14" stroke={stroke} fill="none" strokeWidth="3" />
        </g>
      )

    case 'lock':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <rect x="-14" y="-4" width="28" height="22" rx="3" />
          <path d="M-8 -4 v-6 a8 8 0 0 1 16 0 v6" fill="none" strokeWidth="3" />
          <circle cx="0" cy="7" r="3" fill={stroke} />
        </g>
      )

    case 'flame':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <path d="M0 -22 q4 8 10 12 q8 6 8 14 q0 14 -18 14 q-18 0 -18 -14 q0 -8 8 -14 q-2 8 2 10 q2 -10 8 -22z" />
          <path d="M-4 6 q2 -6 4 -8 q4 4 4 10 q0 6 -4 6 q-6 0 -4 -8z" fill="#fff7dc" stroke="none" opacity="0.85" />
        </g>
      )

    case 'bolt':
      return (
        <polygon
          points="56,24 40,52 52,52 44,78 62,46 50,46 58,24"
          fill={color}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )

    case 'sparkle':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <path d="M0 -22 l4 14 l14 4 l-14 4 l-4 14 l-4 -14 l-14 -4 l14 -4 z" />
          <path d="M18 -12 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" />
          <path d="M-16 14 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" />
        </g>
      )

    case 'diamond':
      return (
        <g transform="translate(50 52)" {...common}>
          <polygon points="0,-22 18,-6 0,22 -18,-6" fill={color} />
          <polygon points="0,-22 -18,-6 -10,-6 -2,-22" fill="#ffffff" opacity="0.45" stroke="none" />
          <polyline points="-18,-6 18,-6" stroke={stroke} fill="none" />
        </g>
      )

    case 'level':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <rect x="-18" y="8" width="10" height="12" />
          <rect x="-5" y="-2" width="10" height="22" />
          <rect x="8" y="-14" width="10" height="34" />
          <polygon points="-18,-14 -8,-14 -13,-20" />
        </g>
      )

    case 'compass':
      return (
        <g transform="translate(50 52)" {...common}>
          <circle r="20" fill={color} stroke={stroke} />
          <polygon points="0,-12 5,0 0,12 -5,0" fill="#fff7dc" stroke={stroke} />
          <circle r="2" fill={stroke} />
          <circle r="20" fill="none" stroke="#fff7dc" strokeDasharray="1 3" />
        </g>
      )

    case 'home':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <polygon points="0,-20 20,0 16,0 16,18 -16,18 -16,0 -20,0" />
          <rect x="-4" y="4" width="8" height="14" fill={stroke} stroke="none" />
        </g>
      )

    case 'calendar':
      return (
        <g transform="translate(50 52)" fill={color} {...common}>
          <rect x="-18" y="-14" width="36" height="30" rx="2" />
          <rect x="-18" y="-14" width="36" height="8" fill={stroke} stroke="none" />
          <line x1="-10" y1="-18" x2="-10" y2="-10" stroke={stroke} strokeWidth="3" />
          <line x1="10" y1="-18" x2="10" y2="-10" stroke={stroke} strokeWidth="3" />
          <circle cx="-6" cy="2" r="1.5" fill={stroke} stroke="none" />
          <circle cx="0" cy="2" r="1.5" fill={stroke} stroke="none" />
          <circle cx="6" cy="2" r="1.5" fill={stroke} stroke="none" />
          <circle cx="-6" cy="9" r="1.5" fill={stroke} stroke="none" />
          <circle cx="0" cy="9" r="1.5" fill={stroke} stroke="none" />
        </g>
      )

    case 'sunrise':
      return (
        <g transform="translate(50 56)" fill={color} {...common}>
          <path d="M-20 4 a20 20 0 0 1 40 0 z" />
          <line x1="-24" y1="10" x2="24" y2="10" stroke={stroke} strokeWidth="2" />
          <line x1="0" y1="-22" x2="0" y2="-14" stroke={color} strokeWidth="3" />
          <line x1="-18" y1="-14" x2="-12" y2="-8" stroke={color} strokeWidth="3" />
          <line x1="18" y1="-14" x2="12" y2="-8" stroke={color} strokeWidth="3" />
        </g>
      )

    case 'moon':
      return (
        <g transform="translate(50 52)" {...common}>
          <path d="M12 -18 a22 22 0 1 0 0 36 a18 18 0 1 1 0 -36z" fill={color} stroke={stroke} />
          <circle cx="-6" cy="-4" r="2" fill={stroke} stroke="none" opacity="0.5" />
          <circle cx="-2" cy="6" r="1.5" fill={stroke} stroke="none" opacity="0.5" />
        </g>
      )

    case 'medal':
      return (
        <g transform="translate(50 54)" {...common}>
          <polygon points="-12,-22 -4,-22 -2,-10 -10,-10" fill={color} />
          <polygon points="12,-22 4,-22 2,-10 10,-10" fill={color} />
          <circle r="16" fill={color} stroke={stroke} />
          <polygon points="0,-10 3,-3 10,-2 5,3 6,10 0,7 -6,10 -5,3 -10,-2 -3,-3" fill="#fff7dc" stroke={stroke} strokeWidth="1" />
        </g>
      )

    case 'frame':
      return (
        <g transform="translate(50 52)" fill="none" {...common}>
          <rect x="-22" y="-16" width="44" height="32" rx="2" fill={color} />
          <rect x="-18" y="-12" width="36" height="24" fill="#0a1408" />
          {[-12, 0, 12].map(x => (
            <circle key={x} cx={x} cy="0" r="4" fill={color} stroke={stroke} />
          ))}
          <circle cx="-22" cy="-16" r="1.5" fill={stroke} stroke="none" />
          <circle cx="22" cy="-16" r="1.5" fill={stroke} stroke="none" />
          <circle cx="-22" cy="16" r="1.5" fill={stroke} stroke="none" />
          <circle cx="22" cy="16" r="1.5" fill={stroke} stroke="none" />
        </g>
      )

    case 'controller':
      return (
        <g transform="translate(50 54)" fill={color} {...common}>
          <rect x="-22" y="-8" width="44" height="18" rx="8" />
          <circle cx="-12" cy="1" r="3" fill={stroke} stroke="none" />
          <rect x="-15" y="-2" width="6" height="6" fill={stroke} stroke="none" />
          <circle cx="10" cy="-3" r="2" fill="#ff3e88" stroke={stroke} />
          <circle cx="14" cy="4" r="2" fill="#3ee8ff" stroke={stroke} />
        </g>
      )
  }
}

export default BadgeArt
