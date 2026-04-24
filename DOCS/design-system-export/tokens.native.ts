/**
 * FURBITO Design System v2 — React Native adapter.
 *
 * Translates the portable tokens (tokens.ts) into React Native-safe values.
 * Notes:
 *   - color-mix() does NOT exist in RN. Alpha-hex colors precomputed below.
 *   - box-shadow → shadowColor/Offset/Opacity/Radius + elevation (Android).
 *   - Gradients → LinearGradient (from expo-linear-gradient).
 *   - Animations → Animated / Reanimated (not CSS keyframes).
 *
 * Goal: feel == web. Not pixel-perfect fidelity of polish effects.
 */

import { Platform } from 'react-native' // consumer imports; stripped if unused

// ─────────────────────────────────────────────────────────────
// COLORS (dark default) — precomputed alpha variants
// ─────────────────────────────────────────────────────────────

export const colors = {
  bg:        '#040807',
  bg2:       '#0a1210',
  bg3:       '#131a17',
  card:      'rgba(255,255,255,0.045)',
  card2:     'rgba(255,255,255,0.07)',
  border:    'rgba(255,255,255,0.08)',
  borderA:   'rgba(168,255,62,0.22)',
  accent:    '#a8ff3e',
  accentD:   'rgba(168,255,62,0.12)',
  accentG:   'rgba(168,255,62,0.35)',
  text:      '#f0f0f0',
  muted:     'rgba(240,240,240,0.55)',
  red:       '#ff4d4d',
  orange:    '#ff8a1f',
  gold:      '#ffd700',

  tier: {
    mal:       { base: '#ef4444', end: '#7f1d1d', text: '#fff5f5' },
    regular:   { base: '#f97316', end: '#7c2d12', text: '#fff7ed' },
    bueno:     { base: '#22c55e', end: '#14532d', text: '#f0fdf4' },
    excelente: { base: '#22c55e', end: '#06b6d4', text: '#ecfeff' },
    leyenda:   {
      stops: ['#ef4444','#f59e0b','#22c55e','#06b6d4','#6366f1','#a855f7'],
      locations: [0, 0.18, 0.38, 0.58, 0.78, 1.0],
      text: '#ffffff',
    },
  },

  result: { win: '#22c55e', loss: '#ef4444', draw: '#eab308' },
} as const

// ─────────────────────────────────────────────────────────────
// RADIUS / SPACING / LAYOUT
// ─────────────────────────────────────────────────────────────

export const radius = { s: 10, m: 14, l: 16 } as const

export const spacing = {
  0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14,
  4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80,
} as const

export const layout = {
  maxAppWidth: 500,
  headerHeight: 56,
  bottomNavHeight: 72,
  minTouchTarget: 44,
} as const

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY — load via expo-font (Bebas, Barlow, IBM Plex Mono)
// ─────────────────────────────────────────────────────────────

export const font = {
  bebas:  Platform.OS === 'ios' ? 'BebasNeue-Regular' : 'BebasNeue',
  barlow: {
    300: 'Barlow-Light',
    400: 'Barlow-Regular',
    500: 'Barlow-Medium',
    600: 'Barlow-SemiBold',
    700: 'Barlow-Bold',
    900: 'Barlow-Black',
  },
  mono:   'IBMPlexMono-Medium',
} as const

export const text = {
  displayHero:  { fontFamily: font.bebas,      fontSize: 64, letterSpacing: -1, includeFontPadding: false },
  subdisplay:   { fontFamily: font.bebas,      fontSize: 28, letterSpacing: -0.4, includeFontPadding: false },
  numberChip:   { fontFamily: font.bebas,      fontSize: 20, includeFontPadding: false },
  sectionTitle: { fontFamily: font.barlow[700],fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  body:         { fontFamily: font.barlow[400],fontSize: 14, lineHeight: 20 },
  caption:      { fontFamily: font.barlow[500],fontSize: 12, color: colors.muted },
  techData:     { fontFamily: font.mono,       fontSize: 11, letterSpacing: -0.2 },
} as const

// ─────────────────────────────────────────────────────────────
// SHADOWS — depth1/2/3/lift expressed per-platform
// iOS uses shadow*, Android uses elevation.
// These approximate the stadium-tinted CSS shadows.
// ─────────────────────────────────────────────────────────────

export const shadow = {
  depth1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  depth2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  depth3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  lift: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
} as const

// For tinted halo effect, overlay a radial gradient via expo-linear-gradient
// or react-native-svg (approximation since RN has no box-shadow color-mix).

// ─────────────────────────────────────────────────────────────
// MOTION (for Reanimated/Animated)
// ─────────────────────────────────────────────────────────────

export const easing = {
  // JS cubic-beziers — pass to Easing.bezier(...)
  spring: [0.34, 1.56, 0.64, 1] as const,
  out:    [0.22, 1, 0.36, 1] as const,
}

export const duration = {
  microTap: 180,
  toastEnter: 250,
  modalEnter: 350,
  reveal: 650,
  revealPop: 550,
  ambient: 3200,
  ambientSlow: 5200,
} as const

// ─────────────────────────────────────────────────────────────
// PRESERVATION MATRIX (what survives the port, what is replaced)
// ─────────────────────────────────────────────────────────────
//
// Preserve 1:1:  tokens (color, radius, spacing, typography scale),
//                tier palette, game scoring contract, z-index intent.
//
// Adapt:
//   .card             → <View style={[surfaces.calm, shadow.depth1]} />
//   .gloss-overlay    → <LinearGradient colors={[...]} />
//   .aura-halo        → Reanimated scale+opacity loop (3400ms sin)
//   .legend-rainbow   → Reanimated + LinearGradient animated stops
//   .is-reveal        → Reanimated entry on onLayout + InView hook
//   .shine-sweep      → Reanimated translateX + LinearGradient mask
//
// Replace/omit:
//   backdrop-filter     → approximate with expo-blur <BlurView> (iOS only full fidelity)
//   mix-blend-mode      → not available → omit or replicate by opacity compositing
//   color-mix(in srgb)  → precompute alpha-hex variants (above)
//   ::before / ::after  → replace with sibling <View /> wrapped by container
//   hover states        → remove (touch-first); keep pressed/active via Pressable
