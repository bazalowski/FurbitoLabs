'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MvpVote } from '@/types'

export function useMvpVotes(eventId: string | null) {
  const [votes, setVotes] = useState<MvpVote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!eventId) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('mvp_votes')
      .select('*')
      .eq('event_id', eventId)
    setVotes(data ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => { load() }, [load])

  // Realtime: actualizar cuando se voten o retiren votos
  useEffect(() => {
    if (!eventId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`mvp_votes:${eventId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'mvp_votes',
        filter: `event_id=eq.${eventId}`,
      }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, load])

  return { votes, loading, reload: load }
}
