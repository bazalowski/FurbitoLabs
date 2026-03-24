import type { Level } from '@/types'

// ════════════════════════════════════════════════════
//  99-level system
//  XP curve: totalXP = floor(N * N * 0.77)
//  Level 1 = 0 XP, Level 99 ~ 7547 XP
//  A player with 500 matches at 15 XP each = 7500 XP → ~level 98-99
// ════════════════════════════════════════════════════

const TIERS: { maxLevel: number; name: string; icon: string }[] = [
  { maxLevel: 10, name: 'Rookie',          icon: '⚽' },
  { maxLevel: 20, name: 'Amateur',         icon: '🥅' },
  { maxLevel: 30, name: 'Semi-Pro',        icon: '👟' },
  { maxLevel: 40, name: 'Profesional',     icon: '🎯' },
  { maxLevel: 50, name: 'Crack',           icon: '⭐' },
  { maxLevel: 60, name: 'Estrella',        icon: '🌟' },
  { maxLevel: 70, name: 'Crack Mundial',   icon: '💫' },
  { maxLevel: 80, name: 'Leyenda',         icon: '👑' },
  { maxLevel: 90, name: 'Leyenda Suprema', icon: '🏆' },
  { maxLevel: 99, name: 'GOAT',            icon: '🐐' },
]

function getTier(level: number): { name: string; icon: string } {
  for (const t of TIERS) {
    if (level <= t.maxLevel) return { name: t.name, icon: t.icon }
  }
  return { name: 'GOAT', icon: '🐐' }
}

function xpForLevel(n: number): number {
  if (n <= 1) return 0
  return Math.floor(n * n * 0.77)
}

// Generate all 99 levels
export const LEVELS: Level[] = Array.from({ length: 99 }, (_, i) => {
  const n = i + 1
  const tier = getTier(n)
  const nextMin = n < 99 ? xpForLevel(n + 1) : 999999
  return {
    level: n,
    name: `${tier.name} ${n}`,
    icon: tier.icon,
    min: xpForLevel(n),
    max: nextMin - 1,
  }
})

export function getLevel(xp: number): Level {
  // Walk backwards to find the highest level the player qualifies for
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getNextLevel(xp: number): Level | null {
  const current = getLevel(xp)
  if (current.level >= 99) return null
  return LEVELS[current.level] // LEVELS[current.level] is the next level (0-indexed)
}

export function xpPercent(xp: number): number {
  const current = getLevel(xp)
  const next = getNextLevel(xp)
  if (!next) return 100
  return Math.round(((xp - current.min) / (next.min - current.min)) * 100)
}
