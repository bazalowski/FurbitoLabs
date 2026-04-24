'use client'

const KEY = 'furbito:remembered-players'

type Map = Record<string, string>

function read(): Map {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function write(map: Map) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {}
}

export function getRememberedPlayer(communityId: string): string | null {
  return read()[communityId] ?? null
}

export function rememberPlayer(communityId: string, playerId: string) {
  const map = read()
  map[communityId] = playerId
  write(map)
}

export function forgetPlayer(communityId: string) {
  const map = read()
  delete map[communityId]
  write(map)
}
