import type { Level } from '@/types'

export const LEVELS: Level[] = [
  { level: 1, name: 'Rookie',      icon: '⚽', min: 0,     max: 99    },
  { level: 2, name: 'Aficionado',  icon: '🥅', min: 100,   max: 299   },
  { level: 3, name: 'Amateur',     icon: '👟', min: 300,   max: 599   },
  { level: 4, name: 'Semi-Pro',    icon: '🎯', min: 600,   max: 999   },
  { level: 5, name: 'Profesional', icon: '⭐', min: 1000,  max: 1999  },
  { level: 6, name: 'Crack',       icon: '🌟', min: 2000,  max: 3999  },
  { level: 7, name: 'Estrella',    icon: '💫', min: 4000,  max: 7499  },
  { level: 8, name: 'Leyenda',     icon: '👑', min: 7500,  max: 999999 },
]

export function getLevel(xp: number): Level {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) ?? LEVELS[LEVELS.length - 1]
}

export function getNextLevel(xp: number): Level | null {
  const current = getLevel(xp)
  return LEVELS.find(l => l.level === current.level + 1) ?? null
}

export function xpPercent(xp: number): number {
  const current = getLevel(xp)
  const next = getNextLevel(xp)
  if (!next) return 100
  return Math.round(((xp - current.min) / (next.min - current.min)) * 100)
}
