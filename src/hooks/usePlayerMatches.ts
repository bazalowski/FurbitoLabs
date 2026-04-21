'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Event, MatchPlayer } from '@/types'

export interface PlayerMatch extends MatchPlayer {
  event: Event
}

export function usePlayerMatches(playerId: string | null, communityId: string | null) {
  const [matches, setMatches] = useState<PlayerMatch[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!playerId || !communityId) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('match_players')
      .select(`*, event:events(*, pista:pistas(*))`)
      .eq('player_id', playerId)

    const rows = (data ?? []) as PlayerMatch[]
    const filtered = rows.filter(m => m.event?.community_id === communityId && m.event?.finalizado)
    filtered.sort((a, b) => (b.event?.fecha ?? '').localeCompare(a.event?.fecha ?? ''))
    setMatches(filtered)
    setLoading(false)
  }, [playerId, communityId])

  useEffect(() => { load() }, [load])

  return { matches, loading, reload: load }
}
