'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcReliability, type Reliability } from '@/lib/game/reliability'
import type { Event } from '@/types'

const WINDOW_SIZE = 20

/**
 * Carga los últimos 20 eventos finalizados de la comunidad con sus
 * confirmaciones y match_players, y calcula la fiabilidad del jugador
 * indicado. Pensado para mostrar un chip en perfil; el coste es 1
 * query embedded por uso (~20 events + nested rows).
 */
export function usePlayerReliability(
  communityId: string | null,
  playerId: string | null,
): { reliability: Reliability | null; loading: boolean } {
  const [reliability, setReliability] = useState<Reliability | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!communityId || !playerId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('events')
        .select('id, finalizado, confirmations(player_id, status), match_players(player_id)')
        .eq('community_id', communityId)
        .eq('finalizado', true)
        .order('fecha', { ascending: false })
        .limit(WINDOW_SIZE)
      if (cancelled) return
      const events = (data ?? []) as unknown as Pick<Event, 'id' | 'finalizado' | 'confirmations' | 'match_players'>[]
      setReliability(calcReliability(playerId, events))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [communityId, playerId])

  return { reliability, loading }
}
