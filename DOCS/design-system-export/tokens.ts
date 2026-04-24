/**
 * FURBITO — Design System v2 "Athletic-Luxury"
 * Design tokens as a portable TypeScript module.
 *
 * Source of truth: DOCS/FURBITO 2.1/FURBITO_DESIGN_SYSTEM.md
 * Stack neutral — consume from web (CSS vars), React Native (StyleSheet),
 * Figma plugin, or wireframing tools.
 *
 * RULE: Nothing in UI code should use a hex/shadow/radius not listed here.
 */

// ─────────────────────────────────────────────────────────────
// 1. COLOR
// ─────────────────────────────────────────────────────────────

export const colorDark = {
  bg:        '#040807', // page background (deeper than v1)
  bg2:       '#0a1210', // secondary surfaces: nav, modal bg, calm cards
  bg3:       '#131a17', // elevated panels
  card:      'rgba(255,255,255,0.045)',
  card2:     'rgba(255,255,255,0.07)',
  border:    'rgba(255,255,255,0.08)',
  borderA:   'rgba(168,255,62,0.22)', // tinted accent border
  accent:    '#a8ff3e', // electric turf — default when no community color
  accentD:   'rgba(168,255,62,0.12)',
  accentG:   'rgba(168,255,62,0.35)',
  text:      '#f0f0f0',
  muted:     'rgba(240,240,240,0.55)',
  red:       '#ff4d4d', // error / destructive
  orange:    '#ff8a1f', // warning / "regular" tier
  gold:      '#ffd700', // achievements / admin
} as const

export const colorLight = {
  bg:        '#f5f5f5',
  bg2:       '#ffffff',
  bg3:       '#ffffff',
  card:      'rgba(0,0,0,0.04)',
  card2:     'rgba(0,0,0,0.07)',
  border:    '#e0e0e0',
  borderA:   'rgba(90,143,0,0.28)',
  accent:    '#5a8f00', // olive — neon accent would vibrate on white
  accentD:   'rgba(90,143,0,0.1)',
  accentG:   'rgba(90,143,0,0.3)',
  text:      '#1a1a1a',
  muted:     '#666666',
  red:       '#d32f2f',
  orange:    '#e67700',
  gold:      '#b8860b',
} as const

// Community color is dynamic (runtime). Default = accent.
// It flows into: shadows, borders, halos, protagonist numbers.
// NEVER fills large backgrounds.
export const commColorDefault = colorDark.accent

// ─────────────────────────────────────────────────────────────
// 2. TIERS — Comunio scoring (contract, do not modify)
// ─────────────────────────────────────────────────────────────

export type Tier = 'mal' | 'regular' | 'bueno' | 'excelente' | 'leyenda'

export const tier: Record<Tier, {
  label: string
  range: string
  base: string          // sample base color (start of gradient)
  end?: string          // gradient end (if applicable)
  rainbow?: boolean     // only true for leyenda
  reward: boolean       // arena treatment (gradient, halo)
}> = {
  mal:       { label: 'Mal',       range: '<5',    base: '#ef4444', end: '#7f1d1d', reward: false },
  regular:   { label: 'Regular',   range: '5-7',   base: '#f97316', end: '#7c2d12', reward: false },
  bueno:     { label: 'Bueno',     range: '8-10',  base: '#22c55e', end: '#14532d', reward: false },
  excelente: { label: 'Excelente', range: '11-19', base: '#22c55e', end: '#06b6d4', reward: true  },
  leyenda:   { label: 'Leyenda',   range: '>=20',  base: 'rainbow', rainbow: true, reward: true   },
}

export const legendRainbowStops = [
  { offset: 0,   color: '#ef4444' }, // red
  { offset: 18,  color: '#f59e0b' }, // amber
  { offset: 38,  color: '#22c55e' }, // green
  { offset: 58,  color: '#06b6d4' }, // cyan
  { offset: 78,  color: '#6366f1' }, // indigo
  { offset: 100, color: '#a855f7' }, // purple
] as const

// ─────────────────────────────────────────────────────────────
// 3. SHADOWS (derived from community color)
// ─────────────────────────────────────────────────────────────
// Pattern: inset highlight + ambient + tinted cast.
// If you need depth, DO NOT invent a new shadow — pick one of these 4.

export const shadow = {
  // depth-1 → calm cards (default list row, home stats)
  depth1: '0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.35), 0 2px 8px var(--shadow-tint)',
  // depth-2 → arena hero cards (post-match, podium plinth)
  depth2: '0 1px 0 rgba(255,255,255,0.05) inset, 0 2px 4px rgba(0,0,0,0.4), 0 8px 24px var(--shadow-tint)',
  // depth-3 → modals, popovers
  depth3: '0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 8px rgba(0,0,0,0.45), 0 16px 48px var(--shadow-tint-strong)',
  // lift → hover state
  lift:   '0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 14px rgba(0,0,0,0.45), 0 12px 32px var(--shadow-tint-strong)',
} as const

// Computed tint aliases (for non-CSS consumers)
export const shadowTintFrom = (commColor: string, pct: 12 | 22 = 12) =>
  `color-mix(in srgb, ${commColor} ${pct}%, transparent)`

// ─────────────────────────────────────────────────────────────
// 4. RADIUS
// ─────────────────────────────────────────────────────────────

export const radius = {
  s: 10, // inputs, chips, small buttons
  m: 14, // DEFAULT for cards & buttons
  l: 16, // hero cards, modals (lowered from 20 in v2 for editorial feel)
} as const

// ─────────────────────────────────────────────────────────────
// 5. SPACING (Tailwind scale, 4px base)
// ─────────────────────────────────────────────────────────────
// Conventions:
//   - Card gutter: 12 default, 16 in hero/spacious
//   - Card padding: 16
//   - Button padding: sm(12/12) md(16/12) lg(20/14)
//   - pb-nav utility = nav-h(72) + safe-bottom + 20

export const spacing = {
  0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14,
  4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80,
} as const

export const layout = {
  maxAppWidth: 500,   // desktop container
  headerHeight: 56,
  bottomNavHeight: 72,
  mobileMinWidth: 375, // design target (iPhone SE)
  mobileBaseWidth: 390, // iPhone 15 base
  mobileMaxWidth: 428,  // iPhone Plus/Pro Max
} as const

// ─────────────────────────────────────────────────────────────
// 6. TYPOGRAPHY — 3 families (v2 hallmark: mono for tech data)
// ─────────────────────────────────────────────────────────────

export const fontFamily = {
  // Bebas: display, big numbers, team names, podium — ALWAYS tabular-nums
  bebas:  '"Bebas Neue", cursive',
  // Barlow: body, UI, labels (weights: 300/400/500/600/700/900)
  barlow: '"Barlow", sans-serif',
  // IBM Plex Mono: deltas (↑+3), dates, timers (14h 23m), indices (#4), streaks (×3)
  //   THE key v2 premium hack — separates "calculated data" from "narrative text".
  mono:   '"IBM Plex Mono", ui-monospace, monospace',
} as const

// Canonical type roles. Pixel sizes at base 14px body.
export const type = {
  displayHero:  { family: 'bebas',  size: [48, 96],  weight: 400, tracking: -0.02, tabular: true,
                  notes: 'Only ONE per screen. clamp(48px, 10vw, 72px) on score-slab.' },
  subdisplay:   { family: 'bebas',  size: [22, 32],  weight: 400, tracking: -0.015, tabular: true,
                  notes: 'Team names, tier label, secondary stat.' },
  numberChip:   { family: 'bebas',  size: [18, 22],  weight: 400, tabular: true },
  sectionTitle: { family: 'barlow', size: [11, 13],  weight: 700, tracking: 0.12, uppercase: true },
  body:         { family: 'barlow', size: 14,        weight: 400 },
  caption:      { family: 'barlow', size: 12,        weight: 500, color: 'muted' },
  techData:     { family: 'mono',   size: [10, 12],  weight: 500, tracking: -0.02, tabular: true,
                  notes: 'Deltas, dates, timers, indices, streaks. Arena obligatorio.' },
} as const

// ─────────────────────────────────────────────────────────────
// 7. MOTION
// ─────────────────────────────────────────────────────────────

export const easing = {
  // Overshoot for toasts, pops, spring-ins
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  // Default for hover / tap / transitions
  out:    'cubic-bezier(0.22, 1, 0.36, 1)',
} as const

export const duration = {
  microTap:    180,  // hover, tap, micro transitions
  toastEnter:  250,
  modalEnter:  350,
  reveal:      650,  // viewport reveal (is-reveal)
  revealPop:   550,  // springy reveal (is-reveal-pop)
  ambient:     3200, // idle decorative (aura-halo, micro-float)
  ambientSlow: 5200, // legendShift
} as const

// RULE: if an animation > 400ms on direct interaction (not decorative) → wrong.
// RULE: every new animation MUST be neutralized under prefers-reduced-motion.

// ─────────────────────────────────────────────────────────────
// 8. Z-INDEX
// ─────────────────────────────────────────────────────────────

export const zIndex = {
  base:     0,
  grain:    1,
  elevated: 10,
  sticky:   20,
  nav:      30,
  overlay:  40,
  modal:    50,
  toast:    60,
} as const

// ─────────────────────────────────────────────────────────────
// 9. BREAKPOINTS (Tailwind default, mobile-first)
// ─────────────────────────────────────────────────────────────

export const breakpoint = {
  sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536,
} as const

// ─────────────────────────────────────────────────────────────
// 10. ICONOGRAPHY
// ─────────────────────────────────────────────────────────────

export const iconSize = {
  inline: 16, // inline body
  sm:     20, // buttons sm/md
  md:     24, // buttons lg, headers
  hero:   32, // heroes (≥32)
} as const

// Allowed emoji vocabulary (keep contained — anything outside is anti-pattern).
export const emojiVocab = [
  '⚽', '🎖️', '🏆', '🥅', '🔥', '🎯', '✨', '🎓', '🪄',
  '🥇', '🥈', '🥉', '🧤', '🤝', '🎲', '🏟️', '📍',
] as const

// ─────────────────────────────────────────────────────────────
// 11. A11Y
// ─────────────────────────────────────────────────────────────

export const a11y = {
  minContrastText: 4.5,   // WCAG AA
  minTouchTarget:  44,    // px, enforced on button/[role=button]
  inputFontSize:   16,    // px, prevents iOS zoom
  focusOutline:    '2px solid var(--comm-color, var(--accent))',
  focusOffset:     2,     // px
} as const
