import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ── Tailwind helper ───────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── ID generator ─────────────────────────────────────
export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ── Player PIN generator (4 digitos numericos) ──
export function genPlayerCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// ── Iniciales ─────────────────────────────────────────
export function initials(name: string): string {
  return (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ── Formato de fecha ──────────────────────────────────
export function fmtDate(d: string | null | undefined): string {
  if (!d) return 'Sin fecha'
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return d
  }
}

export function fmtDateTime(d: string | null | undefined, t: string | null | undefined): string {
  return t ? `${fmtDate(d)} · ${t}h` : fmtDate(d)
}

export function isPast(fecha: string | null, hora: string | null): boolean {
  if (!fecha) return false
  return new Date(`${fecha}T${hora ?? '23:59'}`) < new Date()
}

// ── Colores disponibles para comunidades ─────────────
export const COMMUNITY_COLORS = [
  '#a8ff3e', '#ff5c5c', '#ff9030', '#ffd700',
  '#38bdf8', '#c084fc', '#f472b6', '#34d399',
]
