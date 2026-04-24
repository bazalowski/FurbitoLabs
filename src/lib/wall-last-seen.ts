'use client'

const KEY = 'furbito:wall-last-seen'

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

export function getWallLastSeen(communityId: string): string | null {
  return read()[communityId] ?? null
}

export function setWallLastSeen(communityId: string, timestamp: string) {
  const map = read()
  map[communityId] = timestamp
  write(map)
}
