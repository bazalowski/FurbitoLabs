'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WallPost } from '@/types'

const PAGE_SIZE = 20

export function useWallPosts(communityId: string | null) {
  const [posts, setPosts] = useState<WallPost[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async () => {
    if (!communityId) { setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('wall_posts')
      .select('*, author:players!wall_posts_author_id_fkey(*), reactions:wall_reactions(*)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    const rows = (data as WallPost[]) ?? []
    setPosts(rows)
    setHasMore(rows.length === PAGE_SIZE)
    setLoading(false)
  }, [communityId])

  const loadMore = useCallback(async () => {
    if (!communityId || loadingMore || !hasMore) return
    const oldest = posts[posts.length - 1]?.created_at
    if (!oldest) return
    setLoadingMore(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('wall_posts')
      .select('*, author:players!wall_posts_author_id_fkey(*), reactions:wall_reactions(*)')
      .eq('community_id', communityId)
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    const rows = (data as WallPost[]) ?? []
    setPosts(prev => [...prev, ...rows])
    setHasMore(rows.length === PAGE_SIZE)
    setLoadingMore(false)
  }, [communityId, posts, loadingMore, hasMore])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!communityId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`wall:${communityId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'wall_posts', filter: `community_id=eq.${communityId}` },
        () => { load() })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'wall_reactions' },
        () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [communityId, load])

  return { posts, loading, hasMore, loadingMore, loadMore, reload: load }
}
