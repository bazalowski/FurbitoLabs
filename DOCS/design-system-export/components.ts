/**
 * FURBITO Design System — Component Specs (portable)
 *
 * These specs describe each component as a pure contract (variants, sizes,
 * states, anatomy, polish rules). Consumable by wireframing AI (Claude
 * Design, Figma plugins) or reimplemented 1:1 in React Native.
 *
 * Rule of thumb: if a spec here disagrees with code, code is wrong.
 */

// ─────────────────────────────────────────────────────────────
// PRINCIPLE: dualidad calm vs arena
// ─────────────────────────────────────────────────────────────
// Classify every screen/section into ONE register BEFORE picking components.
// "If in doubt, it's calm. Arena is earned."

export type Surface = 'calm' | 'arena'

export const surfaceRules: Record<Surface, {
  bg: string
  border: string
  shadow: 'depth1' | 'depth2'
  hairlineTop: boolean
  polishMax: number         // max polish utilities allowed per element
  motion: { enterMaxMs: number; idleAllowed: boolean }
  palette: string
  typography: string
  emoji: string
}> = {
  calm: {
    bg: 'var(--bg2) solid',
    border: 'var(--border) flat',
    shadow: 'depth1',
    hairlineTop: false,
    polishMax: 1,
    motion: { enterMaxMs: 180, idleAllowed: false },
    palette: 'Monochrome + community accent point only (focus, active underline, number ink)',
    typography: 'Barlow dominant; max 1 Bebas protagonist per screen',
    emoji: 'Monochrome icons only in chrome',
  },
  arena: {
    bg: 'card glass + community tint',
    border: 'color-mix(comm 28%, border)',
    shadow: 'depth2',
    hairlineTop: true,
    polishMax: 2,
    motion: { enterMaxMs: 1200, idleAllowed: true },
    palette: 'Tiers saturated, gradients, rainbow (leyenda), comm-color as protagonist ink',
    typography: 'Bebas protagonist + multiple Bebas subdisplay; font-mono REQUIRED for deltas/dates/timers',
    emoji: 'Themed emojis allowed in hero moments (🏆 🥇 🥈 🥉 🧤 ⚽ 🎯 🎖️ ⭐)',
  },
}

// Decision table (canonical from FURBITO_DESIGN_SYSTEM.md §2.1)
export const screenSurface: Array<{ screen: string; surface: Surface; reason: string }> = [
  { screen: 'Home (player card, stats, ActivityFeed, shortcuts)', surface: 'calm', reason: 'Navigation. Only NextMatchHero trends arena when upcoming match.' },
  { screen: 'Layout global (Header, BottomNav)', surface: 'calm', reason: 'Nav chrome.' },
  { screen: 'Profile — skill bars, stats chips', surface: 'calm', reason: 'Reference data.' },
  { screen: 'Profile — PointsEvolutionChart, BadgeVitrina, streak timeline', surface: 'arena', reason: 'Gamification.' },
  { screen: 'Match detail (not finalized)', surface: 'calm', reason: 'Preparation.' },
  { screen: 'Match detail (finalized) — renderResultado', surface: 'arena', reason: 'App climax.' },
  { screen: 'Result stepper — step 1/2 (score, stats)', surface: 'calm', reason: 'Form input.' },
  { screen: 'Result stepper — step 3 (Comunio summary)', surface: 'arena', reason: 'Score reveal.' },
  { screen: 'Ranking — selector, tabs, role filter, list 4+', surface: 'calm', reason: 'Filters/list.' },
  { screen: 'Ranking — podium top 3, sticky you + delta', surface: 'arena', reason: 'Celebration.' },
  { screen: 'TeamGenerator — step 1 (player selection)', surface: 'calm', reason: 'Form.' },
  { screen: 'TeamGenerator — step 2 (balanced result)', surface: 'arena', reason: 'Theatrical reveal.' },
  { screen: 'Help/tutorial, settings, admin profile, forms', surface: 'calm', reason: 'Utility.' },
  { screen: 'Confirmation modals', surface: 'calm', reason: 'Punctual action.' },
  { screen: 'Badge unlocked / MVP reveal modal', surface: 'arena', reason: 'Celebration.' },
]

// ─────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────

export const Button = {
  variants: ['primary', 'secondary', 'danger', 'ghost'] as const,
  sizes:    ['sm', 'md', 'lg'] as const,
  states:   ['default', 'hover', 'active', 'focus-visible', 'disabled'] as const,

  anatomy: {
    base: {
      minHeight: 44,             // a11y touch target
      minHeightLarger: 48,        // actually 48 on sm/md, 52 on lg
      radius: 14,                 // --radius-m
      fontFamily: 'barlow',
      weight: 700,
      transform: 'uppercase',
      tracking: 'wider',
      transition: '180ms ease-out',
    },
    sizeMap: {
      sm: { paddingX: 12, paddingY: 12, fontSize: 12, minHeight: 48 },
      md: { paddingX: 16, paddingY: 12, fontSize: 14, minHeight: 48 },
      lg: { paddingX: 20, paddingY: 14, fontSize: 16, minHeight: 52 },
    },
    variantMap: {
      primary:   { bg: 'var(--accent)', color: '#050d05', tone: 'accent', shine: true,  gloss: true,  hairlineTop: true  },
      secondary: { bg: 'var(--card2)',  color: 'var(--text)',   tone: 'glass',  shine: false, gloss: false, hairlineTop: false, border: 'var(--border)' },
      danger:    { bg: 'var(--red)',    color: '#fff',          tone: 'danger', shine: true,  gloss: true,  hairlineTop: true  },
      ghost:     { bg: 'transparent',   color: 'var(--muted)',  tone: 'glass',  shine: false, gloss: false, hairlineTop: false, border: 'var(--border)' },
    },
    hoverLift: { translateY: -1, shadow: 'lift' },
    activePress: { scale: 0.97, translateY: 0, shadow: 'depth1' },
  },

  rules: [
    'One primary per card/context — ever.',
    'primary text must be imperative (Guardar, Confirmar, Finalizar).',
    'Informational actions → ghost or secondary.',
    'shine-sweep is reserved for closing/finishing CTAs (e.g. "Finalizar partido") — NOT every primary.',
    'Never use ad-hoc bg-red-500 to make a red button — use variant="danger".',
  ],
}

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────

export const Card = {
  variants: ['surface-calm', 'surface-arena', 'card-hero'] as const,
  anatomy: {
    surfaceCalm: {
      bg: 'var(--bg2)',
      border: '1px solid var(--border)',
      radius: 14,
      shadow: 'depth1',
      hairlineTop: false,
    },
    surfaceArena: {
      bg: 'var(--card) (glass)',
      border: '1px solid color-mix(comm 28%, var(--border))',
      radius: 14,
      shadow: 'depth2',
      hairlineTop: true, // integrated via ::after
      overflow: 'hidden',
    },
    cardHero: {
      bg: 'var(--card)',
      border: '1px solid var(--border)',
      radius: 16,
      shadow: 'depth2',
      note: 'Use for the ONE protagonist card per screen.',
    },
    padding: 16,
    gap:     12, // 16 in hero/spacious
    innerHairline: '0 0 0 1px rgba(255,255,255,0.03) inset',
  },

  behaviors: {
    clickableArena: 'add card-glow + cursor-pointer + active:scale-[0.98]',
    highlighted: 'border-color=border-a + shadow-tint-strong',
  },

  rules: [
    'No custom bg-white/5 rounded-xl borders — use surface-calm or surface-arena.',
    'Arena in a calm section breaks the duality.',
    'No card-in-card. Use internal sections with divider.',
  ],
}

// ─────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────

export const Input = {
  states: ['default', 'focus', 'error', 'disabled'] as const,
  anatomy: {
    fontSize: 16,              // IMPORTANT: prevents iOS zoom
    paddingX: 12,
    paddingY: 12,
    minHeight: 48,
    radius: 10,                // --radius-s
    bg: 'var(--bg2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    placeholder: 'var(--muted)',
    focus: {
      outline: '2px solid var(--comm-color)',
      outlineOffset: 2,
    },
    error: {
      border: '1px solid var(--red)',
      message: 'var(--red) below, Barlow 12px 500',
    },
  },
}

// ─────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────

export const Modal = {
  variants: ['window', 'bottom-sheet'] as const,
  anatomy: {
    overlay: {
      bg: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 40, // overlay
    },
    content: {
      bg: 'var(--bg2)',
      border: '1px solid var(--border)',
      shadow: 'depth3',
      radius: 16,
      zIndex: 50, // modal
      safeArea: 'account for notch top + home indicator bottom',
    },
    window: {
      centered: true,
      mobileFullscreen: true,   // ocupa toda la pantalla en mobile
      useCase: 'editable forms (add player, VitrinaEditor, TeamGenerator)',
    },
    bottomSheet: {
      anchor: 'bottom',
      dragHandle: true,
      useCase: 'contextual actions (Valorar, confirmations)',
    },
  },
  rules: [
    'Form with editable content → variant="window".',
    'Short confirmation → variant="bottom-sheet".',
    'If input near bottom + keyboard obscures CTA → duplicate CTA at top.',
  ],
}

// ─────────────────────────────────────────────────────────────
// BADGE, AVATAR, ICON, TOAST, SKELETON
// ─────────────────────────────────────────────────────────────

export const Badge = {
  anatomy: {
    fontFamily: 'barlow',
    transform: 'uppercase',
    tracking: 'wider',
    color: 'var(--comm-color)',
    bg: 'var(--accent-d)',
    radius: 10,
    paddingX: 8,
    paddingY: 2,
  },
}

export const Avatar = {
  anatomy: {
    shape: 'circle',
    bg: 'var(--comm-color-d) (12% mix)',
    emojiSizeRatio: 0.65, // 60–70% of the circle
    sizes: { sm: 32, md: 48, lg: 72, hero: 96 },
    ring: { active: '2px solid var(--comm-color)' },
  },
  rules: ['Avatars are emoji-first (zero asset cost on web).'],
}

export const Icon = {
  anatomy: {
    wrapper: '<Icon> component — no raw emojis or loose SVGs in UI.',
    sizes: [16, 20, 24, 32],
    color: 'currentColor by default; var(--comm-color) for tinted.',
  },
  rules: ['Never mix outline + filled + flat in the same screen.'],
}

export const Toast = {
  anatomy: {
    position: { top: 'env(safe-area-inset-top) + 12px', left: '50%', transform: 'translateX(-50%)' },
    bg: 'var(--bg2)',
    border: '1px solid var(--border-a)',
    radius: 14,
    paddingX: 20,
    paddingY: 12,
    fontSize: 13,
    weight: 600,
    backdropFilter: 'blur(12px)',
    zIndex: 60,
    enterTransform: 'translateY(-120%) → 0 (spring 350ms)',
  },
}

export const Skeleton = {
  anatomy: {
    bg: 'linear-gradient(90deg, var(--card) 25%, var(--card2) 50%, var(--card) 75%)',
    animation: 'shimmer 1.5s infinite',
    radius: 10,
  },
  rules: ['Always same dimension as final content.'],
}

// ─────────────────────────────────────────────────────────────
// LAYOUT PRIMITIVES
// ─────────────────────────────────────────────────────────────

export const Header = {
  height: 56,
  bg: 'var(--bg2)',
  hasUnderline: true,            // .header-underline — gradient tinted
  safeAreaTop: true,
}

export const BottomNav = {
  height: 72,
  bg: 'var(--bg2)',
  borderTop: '1px solid var(--border)',
  items: 4,                      // usual slots: Home, Partido, Ranking, Perfil
  active: { wrapper: 'nav-icon-wrap[data-active=true]', halo: 'comm-color radial' },
  safeAreaBottom: true,
}

// ─────────────────────────────────────────────────────────────
// DOMAIN PRIMITIVES (v2) — composable, arena-centric
// ─────────────────────────────────────────────────────────────

export const MetricMajor = {
  // LA cifra protagonista de la pantalla (score, total puntos)
  stack: 'column',
  valueType: 'bebas',
  valueSize: 'clamp(48px, 10vw, 72px)',
  valueColor: 'var(--comm-color)',
  valueTabular: true,
  labelType: 'barlow',
  labelSize: 10,
  labelWeight: 700,
  labelTracking: 0.16,
  labelUppercase: true,
  labelColor: 'var(--muted)',
}

export const MetricMinor = {
  stack: 'column',
  valueType: 'bebas',
  valueSize: 22,
  labelType: 'barlow',
  labelSize: 10,
  labelWeight: 700,
  labelTracking: 0.12,
  labelUppercase: true,
  labelColor: 'var(--muted)',
}

export const ChipTier = {
  // Canonical value chip for Puntos Furbito. data-tier drives treatment.
  tiers: ['mal', 'regular', 'bueno', 'excelente', 'leyenda'] as const,
  anatomy: {
    fontFamily: 'bebas',
    fontSize: 20,
    paddingX: 10, paddingY: 2,
    minWidth: 48, minHeight: 28,
    radius: 10,
    tabular: true,
  },
  treatment: {
    mal:       { bg: 'linear-gradient(135deg,#7f1d1d,#ef4444)', color: '#fff5f5', glow: '#ef444488' },
    regular:   { bg: 'linear-gradient(135deg,#7c2d12,#f97316)', color: '#fff7ed', glow: '#f9731688' },
    bueno:     { bg: 'linear-gradient(135deg,#14532d,#22c55e)', color: '#f0fdf4', glow: '#22c55e88' },
    excelente: { bg: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: '#ecfeff', glow: '#06b6d488' },
    leyenda:   { bg: 'legend-rainbow (5.2s animated)', color: '#fff',
                 halo: 'legendHalo 2.8s breathing',
                 note: 'THE ONLY legitimate rainbow context in the app.' },
  },
}

export const ScoreSlab = {
  // Hero scoreboard for finalized match.
  padding: '28px 20px 22px',
  radius: 16,
  bgGradient: 'radial top 120% 80% comm-color 12% → bg2',
  border: '1px solid color-mix(comm 20%, border)',
  shadow: 'depth2 tinted',
  hairlineTop: true,
  score: {
    family: 'bebas',
    size: 'clamp(64px, 18vw, 96px)',
    tracking: -0.02,
    layout: 'flex baseline gap-20 centered',
    winColor: 'var(--comm-color) + text-shadow glow',
    loseColor: 'var(--muted)',
    separator: { char: '—', color: 'muted 60%', sizeRatio: 0.7 },
  },
  meta: {
    family: 'mono', size: 11, weight: 500, uppercase: true, color: 'var(--muted)',
    content: 'MVP · fecha · duración · pista',
    separator: 'divider-dot',
  },
}

export const DeltaChip = {
  // Rank delta or score delta. Mono, directional.
  directions: ['up', 'down', 'flat'] as const,
  anatomy: { family: 'mono', size: 11, weight: 500, tracking: -0.02, paddingX: 6, paddingY: 1, radius: 10 },
  treatment: {
    up:   { color: '#22c55e', bg: 'mix(#22c55e 14%)', glyph: '↑+N' },
    down: { color: '#ef4444', bg: 'mix(#ef4444 14%)', glyph: '↓−N' },
    flat: { color: 'var(--muted)', bg: 'var(--card)', glyph: '=' },
  },
}

export const Inkbar = {
  // Vertical 3px bar pegada a la izquierda de row/card — indica resultado/tier.
  width: 3,
  inset: '8px top & bottom',
  radius: '0 2px 2px 0',
  tones: {
    'community':     'var(--comm-color)',
    'tier-mal':      '#ef4444',
    'tier-regular':  '#f97316',
    'tier-bueno':    '#22c55e',
    'tier-excelente':'#06b6d4',
    'tier-leyenda':  'vertical rainbow gradient',
    'win':  '#22c55e',
    'loss': '#ef4444',
    'draw': '#eab308',
  },
  rule: 'Replaces ad-hoc border-left:3px solid X.',
}

export const DividerDot = {
  glyph: '·',
  size: 3,
  marginX: 8,
  color: 'var(--muted) at 50% opacity',
  rule: 'Replaces 40+ textual " · " across codebase.',
}

// ─────────────────────────────────────────────────────────────
// POLISH LAYER — opt-in utilities, conditional by surface
// ─────────────────────────────────────────────────────────────

export const polish = {
  'hairline-top':   { when: 'calm: primary CTA only. arena: hero cards, reward rows.' },
  'gloss-overlay':  { when: 'primary/danger buttons (already inside <Button>).' },
  'shine-sweep':    { when: 'ONLY closing/finishing CTAs (Finalizar partido). Not every primary.' },
  'aura-halo':      { when: 'ARENA only. 3s reveal, then static. Idle only on #1 invicto ≥3 ventanas.' },
  'micro-float':    { when: 'Podium 1st medal IF new leader this window.' },
  'card-glow':      { when: 'Arena interactive cards (onClick).' },
  'btn-tone':       { when: 'Buttons (already applied by <Button>).' },
  'chip-pulse':     { when: 'Live counters (real-time confirmed, MVP pending).' },
  'plinth-reflect': { when: 'Arena podium plinth.' },
  'stat-tile':      { when: 'Home stat cards (calm can carry this ONE polish).' },
  'legend-rainbow': { when: 'ONLY chip-tier[data-tier=leyenda]. Never on chrome/tabs/borders.' },
  'legend-halo':    { when: 'Only chip/row with tier=leyenda.' },
}

export const polishAntiPatterns = [
  'Stacking >2 polish utilities on one element — even in arena.',
  'legend-rainbow on tabs, borders, chrome.',
  'aura-halo idle on non-winning avatars/badges — wallpaper effect.',
  'shine-sweep on secondary/confirm buttons — casino vibe.',
  'Any wow utility in a calm surface.',
  'Copy-pasting a utility CSS into a new class — extract a primitive if repeated 3+ times.',
]

// ─────────────────────────────────────────────────────────────
// MOTION TRIGGERS (reveal-once on viewport)
// ─────────────────────────────────────────────────────────────

export const motionTriggers = {
  'is-reveal':     { duration: 650, easing: 'out',    keyframe: 'fade+translateY(10→0)' },
  'is-reveal-pop': { duration: 550, easing: 'spring', keyframe: 'scale(0.92→1.02→1) + translateY' },
  rule: 'Applied by useReveal() hook. Animation kicks in on viewport entry, then removed. Never idle.',
}
