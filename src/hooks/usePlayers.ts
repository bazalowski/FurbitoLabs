'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/types'

export function usePlayers(communityId: string | null) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!communityId) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('community_id', communityId)
      .order('xp', { ascending: false })
    if (error) setError(error.message)
    else setPlayers(data ?? [])
    setLoading(false)
  }, [communityId])

  useEffect(() => { load() }, [load])

  // Real-time subscription
  useEffect(() => {
    if (!communityId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`players:${communityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `community_id=eq.${communityId}` }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [communityId, load])

  return { players, loading, error, reload: load }
}

export function usePlayer(playerId: string | null) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!playerId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase.from('players').select('*').eq('id', playerId).single()
    setPlayer(data)
    setLoading(false)
  }, [playerId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!playerId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`player:${playerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `id=eq.${playerId}` }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [playerId, load])

  return { player, loading, reload: load }
}
