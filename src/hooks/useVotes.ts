'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Vote } from '@/types'

export function useVotes(communityId: string | null) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!communityId) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('votes')
      .select('*')
      .eq('community_id', communityId)
    setVotes(data ?? [])
    setLoading(false)
  }, [communityId])

  useEffect(() => { load() }, [load])

  return { votes, loading, reload: load }
}
