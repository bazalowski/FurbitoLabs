'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Pista } from '@/types'

export function usePistas(communityId: string | null) {
  const [pistas, setPistas] = useState<Pista[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!communityId) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('pistas')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
    setPistas(data ?? [])
    setLoading(false)
  }, [communityId])

  useEffect(() => { load() }, [load])

  return { pistas, loading, reload: load }
}
