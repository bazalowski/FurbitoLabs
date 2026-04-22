'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcMatchPoints } from '@/lib/game/scoring'

export interface RecentPointsMap {
  /** playerId → array cronológico (oldest first) de puntos de los últimos N partidos. */
  [playerId: string]: number[]
}

/**
 * Último N de partidos (finalizados) por jugador de la comunidad, cronológico asc.
 * Se usa para pintar sparklines tier-coloreados en el ranking.
 */
export function useRecentMatchPoints(communityId: string | null, limit = 5) {
  const [data, setData] = useState<RecentPointsMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!communityId) { setLoading(false); return }
    let cancelled = false

    ;(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: rows } = await supabase
        .from('match_players')
        .select('player_id, goles, asistencias, porteria_cero, event:events!inner(id, fecha, community_id, finalizado)')
        .eq('event.community_id', communityId)
        .eq('event.finalizado', true)
        .order('event(fecha)', { ascending: false })

      if (cancelled) return

      const grouped: Record<string, { fecha: string; pts: number }[]> = {}
      type Row = {
        player_id: string
        goles: number
        asistencias: number
        porteria_cero: number
        event: { fecha: string } | { fecha: string }[] | null
      }
      for (const r of ((rows ?? []) as unknown) as Row[]) {
        const ev = Array.isArray(r.event) ? r.event[0] : r.event
        const fecha = ev?.fecha
        if (!fecha) continue
        const pts = calcMatchPoints({
          goles: r.goles,
          asistencias: r.asistencias,
          porteria_cero: r.porteria_cero,
        }).total
        if (!grouped[r.player_id]) grouped[r.player_id] = []
        if (grouped[r.player_id].length < limit) {
          grouped[r.player_id].push({ fecha, pts })
        }
      }

      // Invertir a cronológico asc (para que en UI el último esté a la derecha)
      const out: RecentPointsMap = {}
      for (const [pid, arr] of Object.entries(grouped)) {
        out[pid] = arr.slice().reverse().map(x => x.pts)
      }

      setData(out)
      setLoading(false)
    })()

    return () => { cancelled = true }
  }, [communityId, limit])

  return { data, loading }
}
