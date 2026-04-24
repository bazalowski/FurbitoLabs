/**
 * FURBITO Design System v2 — portable export bundle.
 *
 * Everything a wireframing AI (Claude Design) or a native app engineer
 * needs to reconstruct the exact system without reading the Next.js code.
 *
 * Files in this folder:
 *
 *   tokens.ts          — colors, tiers, shadows, radii, typography, motion, z-index, a11y
 *   components.ts      — component specs (Button, Card, Input, Modal, Badge, …)
 *                        + domain primitives (MetricMajor, ChipTier, ScoreSlab, …)
 *                        + polish layer rules + calm/arena decision table
 *   screens.ts         — canonical screen inventory (sections, components, states, flows)
 *   tokens.css         — pure CSS drop-in (variables + primitives, no Tailwind needed)
 *   tokens.native.ts   — React Native adapter (color-mix precomputed, shadow→elevation)
 *
 * Rule: if the implementation disagrees with these files, the implementation is wrong.
 */

export * from './tokens'
export * from './components'
export * from './screens'

export const META = {
  version: '2.0.0',
  name: 'Athletic-Luxury',
  last_updated: '2026-04-24',
  source_of_truth: 'DOCS/FURBITO 2.1/FURBITO_DESIGN_SYSTEM.md',
  principles: [
    'Dualidad calm vs arena — the most important axis.',
    'Dark fotográfico por defecto; light es alternativa funcional.',
    '--comm-color como tinta, nunca fondo.',
    'Tres familias: Bebas (display), Barlow (body), IBM Plex Mono (tech data).',
    'Números = ciudadanos de primera (tabular-nums, letter-spacing calibrado).',
    'Polish is opt-in and conditional (max 1 in calm, max 2 in arena).',
    'Hairlines for structure, glows for reward.',
    'Respect prefers-reduced-motion — always.',
  ],
} as const
