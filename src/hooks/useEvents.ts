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

  // Realtime: refetch on any change to this event, its confirmations, match_players or mvp_votes.
  // (Filters supported only for events/confirmations/match_players where the FK column lives on the row;
  // mvp_votes has no FK filter support at the RLS level so we re-query on any change to be safe.)
  useEffect(() => {
    if (!eventId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`event:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events',        filter: `id=eq.${eventId}` },        () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmations', filter: `event_id=eq.${eventId}` },  () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_players', filter: `event_id=eq.${eventId}` },  () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_votes',     filter: `event_id=eq.${eventId}` },  () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, load])

  return { event, loading, reload: load }
}
