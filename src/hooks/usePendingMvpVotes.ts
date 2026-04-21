'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Devuelve el número de partidos finalizados de la comunidad en los que:
 *   - el jugador participó (match_players)
 *   - la votación MVP sigue abierta (mvp_voting_closes_at es NULL o futuro)
 *   - el jugador aún no ha votado
 */
export function usePendingMvpVotes(
  communityId: string | null,
  playerId: string | null,
) {
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!communityId || !playerId) { setLoading(false); setPendingCount(0); return }
    setLoading(true)
    const supabase = createClient()
    const nowIso = new Date().toISOString()

    // Partidos finalizados con votación aún abierta
    const { data: events } = await supabase
      .from('events')
      .select('id, mvp_voting_closes_at')
      .eq('community_id', communityId)
      .eq('finalizado', true)
    const openEvents = (events ?? []).filter(
      e => !e.mvp_voting_closes_at || e.mvp_voting_closes_at > nowIso,
    )
    if (openEvents.length === 0) { setPendingCount(0); setLoading(false); return }
    const openIds = openEvents.map(e => e.id)

    // Partidos en los que participé
    const { data: mps } = await supabase
      .from('match_players')
      .select('event_id')
      .eq('player_id', playerId)
      .in('event_id', openIds)
    const participated = new Set((mps ?? []).map(m => m.event_id))

    // Partidos en los que ya voté
    const { data: myVotes } = await supabase
      .from('mvp_votes')
      .select('event_id')
      .eq('voter_id', playerId)
      .in('event_id', openIds)
    const voted = new Set((myVotes ?? []).map(v => v.event_id))

    const pending = openIds.filter(id => participated.has(id) && !voted.has(id))
    setPendingCount(pending.length)
    setLoading(false)
  }, [communityId, playerId])

  useEffect(() => { load() }, [load])

  return { pendingCount, loading, reload: load }
}
