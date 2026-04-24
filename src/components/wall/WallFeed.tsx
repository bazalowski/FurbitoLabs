'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWallPosts } from '@/hooks/useWallPosts'
import { getWallLastSeen, setWallLastSeen } from '@/lib/wall-last-seen'
import { WallComposer } from './WallComposer'
import { WallPost } from './WallPost'
import type { Community, Player } from '@/types'

interface WallFeedProps {
  communityId: string
  community: Community | null
  me: Player | null
  communityColor: string
  /** 'full' en pantalla dedicada (composer sticky, sin título inline); 'compact' en Home (deprecated, usar WallPreview) */
  variant?: 'full' | 'compact'
}

export function WallFeed({ communityId, community, me, communityColor, variant = 'compact' }: WallFeedProps) {
  const { posts, loading, hasMore, loadingMore, loadMore } = useWallPosts(communityId)
  const [lastSeenAtMount, setLastSeenAtMount] = useState<string | null>(null)

  const canDeleteAny = useMemo(() => {
    if (!me || !community) return false
    if (community.comm_admin_id === me.id) return true
    return community.admin_ids?.includes(me.id) ?? false
  }, [me, community])

  // Capturar "último visto" al montar, antes de reescribir
  useEffect(() => {
    setLastSeenAtMount(getWallLastSeen(communityId))
  }, [communityId])

  // Marcar leído cuando hay posts cargados
  useEffect(() => {
    if (!posts.length) return
    setWallLastSeen(communityId, posts[0].created_at)
  }, [communityId, posts])

  const newCount = useMemo(() => {
    if (!lastSeenAtMount) return 0
    const cutoff = new Date(lastSeenAtMount).getTime()
    const authorId = me?.id
    return posts.filter(p => {
      if (p.author_id === authorId) return false
      return new Date(p.created_at).getTime() > cutoff
    }).length
  }, [posts, lastSeenAtMount, me])

  const isFull = variant === 'full'

  return (
    <section className="space-y-3" aria-label="Muro de la comunidad">
      {!isFull && (
        <header className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2
              className="font-barlow text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--muted)' }}
            >
              Muro de la comunidad
            </h2>
            {newCount > 0 && (
              <span
                className="font-mono text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full"
                style={{
                  background: `${communityColor}22`,
                  color: communityColor,
                  border: `1px solid ${communityColor}55`,
                }}
              >
                +{newCount} nuevo{newCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {!loading && (
            <span
              className="font-mono text-[10px] tabular-nums"
              style={{ color: 'var(--muted)' }}
            >
              {posts.length}{hasMore ? '+' : ''}
            </span>
          )}
        </header>
      )}

      {isFull && newCount > 0 && (
        <div
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-m font-mono text-[10px] font-bold tabular-nums uppercase tracking-widest"
          style={{
            background: `${communityColor}14`,
            color: communityColor,
            border: `1px solid ${communityColor}44`,
          }}
        >
          <span>+{newCount} nuevo{newCount === 1 ? '' : 's'} desde tu última visita</span>
        </div>
      )}

      {me && (
        <div
          className={isFull ? 'sticky z-[20]' : ''}
          style={
            isFull
              ? { top: 'var(--header-h)', background: 'var(--bg)', paddingTop: '4px', paddingBottom: '4px' }
              : undefined
          }
        >
          <WallComposer
            communityId={communityId}
            me={me}
            communityColor={communityColor}
          />
        </div>
      )}

      {loading ? (
        <div
          className="surface-calm p-6 text-center font-mono text-[11px]"
          style={{ color: 'var(--muted)' }}
        >
          Cargando muro…
        </div>
      ) : posts.length === 0 ? (
        <div className="surface-calm p-6 text-center space-y-1">
          <p className="font-barlow text-[13px] font-bold">Nadie ha escrito todavía</p>
          <p className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
            Rompe el hielo. Comparte un vídeo o manda un toque al vestuario.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => {
            const isAuthor = me ? post.author_id === me.id : false
            return (
              <WallPost
                key={post.id}
                post={post}
                meId={me?.id ?? ''}
                canDelete={isAuthor || canDeleteAny}
                communityColor={communityColor}
              />
            )
          })}

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2.5 rounded-m font-mono text-[10px] font-bold uppercase tracking-widest active:scale-[0.98] transition-transform"
              style={{
                background: 'var(--card2)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {loadingMore ? 'Cargando…' : 'Cargar más'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
