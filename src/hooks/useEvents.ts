'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types'

export function useEvents(communityId: string | null) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!communityId) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        pista:pistas(*),
        confirmations(*,player:players(*)),
        match_players(*,player:players(*)),
        mvp:players!events_mvp_id_fkey(*)
      `)
      .eq('community_id', communityId)
      .order('fecha', { ascending: false })
    setEvents((data as Event[]) ?? [])
    setLoading(false)
  }, [communityId])

  useEffect(() => { load() }, [load])

  // Real-time
  useEffect(() => {
    if (!communityId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`events:${communityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `community_id=eq.${communityId}` }, () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmations' }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [communityId, load])

  const upcoming = events.filter(e => !e.finalizado)
  const past     = events.filter(e => e.finalizado)

  return { events, upcoming, past, loading, reload: load }
}

export function useEvent(eventId: string | null) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!eventId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase.from('events')
      .select(`
        *,
        pista:pistas(*),
        confirmations(*,player:players(*)),
        match_players(*,player:players(*)),
        mvp:players!events_mvp_id_fkey(*)
      `)
      .eq('id', eventId)
      .single()
    setEvent((data as Event) ?? null)
    setLoading(false)
  }, [eventId])

  useEffect(() => { load() }, [load])

  return { event, loading, reload: load }
}
