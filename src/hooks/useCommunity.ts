'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Community } from '@/types'

export function useCommunity(communityId: string | null) {
  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!communityId) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    setLoading(true)

    supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setCommunity(data)
        setLoading(false)
      })
  }, [communityId])

  return { community, loading, error }
}

export function useAllCommunities() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('communities')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setCommunities(data ?? [])
        setLoading(false)
      })
  }, [])

  return { communities, loading }
}
