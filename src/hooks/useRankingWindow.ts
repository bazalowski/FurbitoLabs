'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcMatchPoints } from '@/lib/game/scoring'

export type RankingWindow = '7d' | '30d' | 'temporada' | 'historico'

export interface WindowStats {
  partidos: number
  goles: number
  asistencias: number
  porteria_cero: number
  mvps: number
  puntos: number
}

export interface RankingWindowData {
  /** playerId → stats agregados en la ventana seleccionada. */
  stats: Record<string, WindowStats>
  loading: boolean
}

function startOfSeason(now: Date): Date {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const seasonYear = month >= 7 ? year : year - 1
  return new Date(Date.UTC(seasonYear, 7, 1))
}

function windowStartISO(window: RankingWindow, now = new Date()): string | null {
  if (window === 'historico') return null
  if (window === '7d') {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - 7)
    return d.toISOString().slice(0, 10)
  }
  if (window === '30d') {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - 30)
    return d.toISOString().slice(0, 10)
  }
  return startOfSeason(now).toISOString().slice(0, 10)
}

export function useRankingWindow(communityId: string | null, window: RankingWindow) {
  const [rows, setRows] = useState<AggRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  const fromDate = useMemo(() => windowStartISO(window), [window])

  useEffect(() => {
    if (!communityId) { setLoading(false); return }
    if (window === 'historico') {
      setRows(null)
      setLoading(false)
      return
    }
    let cancelled = false

    ;(async () => {
      setLoading(true)
      const supabase = createClient()
      let q = supabase
        .from('match_players')
        .select('player_id, goles, asistencias, porteria_cero, event:events!inner(id, fecha, community_id, finalizado, mvp_id)')
        .eq('event.community_id', communityId)
        .eq('event.finalizado', true)
      if (fromDate) q = q.gte('event.fecha', fromDate)

      const { data } = await q
      if (cancelled) return
      setRows(((data ?? []) as unknown) as AggRow[])
      setLoading(false)
    })()

    return () => { cancelled = true }
  }, [communityId, window, fromDate])

  const stats = useMemo<Record<string, WindowStats>>(() => {
    if (!rows) return {}
    const out: Record<string, WindowStats> = {}
    for (const r of rows) {
      const ev = Array.isArray(r.event) ? r.event[0] : r.event
      if (!ev) continue
      const cur = out[r.player_id] ?? emptyStats()
      cur.partidos += 1
      cur.goles += r.goles
      cur.asistencias += r.asistencias
      cur.porteria_cero += r.porteria_cero
      if (ev.mvp_id === r.player_id) cur.mvps += 1
      cur.puntos += calcMatchPoints({
        goles: r.goles,
        asistencias: r.asistencias,
        porteria_cero: r.porteria_cero,
      }).total
      out[r.player_id] = cur
    }
    return out
  }, [rows])

  return { stats, loading, isHistoric: window === 'historico' }
}

function emptyStats(): WindowStats {
  return { partidos: 0, goles: 0, asistencias: 0, porteria_cero: 0, mvps: 0, puntos: 0 }
}

type AggRow = {
  player_id: string
  goles: number
  asistencias: number
  porteria_cero: number
  event: { id: string; fecha: string; mvp_id: string | null } | { id: string; fecha: string; mvp_id: string | null }[] | null
}
