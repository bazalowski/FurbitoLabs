'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useWallPosts } from '@/hooks/useWallPosts'
import { getWallLastSeen } from '@/lib/wall-last-seen'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import type { Player } from '@/types'

interface WallPreviewProps {
  communityId: string
  me: Player | null
  communityColor: string
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}sem`
}

export function WallPreview({ communityId, me, communityColor }: WallPreviewProps) {
  const { posts, loading } = useWallPosts(communityId)
  const [lastSeenAtMount, setLastSeenAtMount] = useState<string | null>(null)

  useEffect(() => {
    setLastSeenAtMount(getWallLastSeen(communityId))
  }, [communityId])

  // 3 autores únicos más recientes (para avatars apilados)
  const recentAuthors = useMemo(() => {
    const seen = new Set<string>()
    const authors: Player[] = []
    for (const p of posts) {
      if (!p.author || seen.has(p.author.id)) continue
      seen.add(p.author.id)
      authors.push(p.author)
      if (authors.length === 3) break
    }
    return authors
  }, [posts])

  const newCount = useMemo(() => {
    if (!lastSeenAtMount) return 0
    const cutoff = new Date(lastSeenAtMount).getTime()
    return posts.filter(p => {
      if (p.author_id === me?.id) return false
      return new Date(p.created_at).getTime() > cutoff
    }).length
  }, [posts, lastSeenAtMount, me])

  const last = posts[0]
  const lastIsNew = !!(lastSeenAtMount && last && new Date(last.created_at).getTime() > new Date(lastSeenAtMount).getTime() && last.author_id !== me?.id)
  const href = `/${communityId}/muro`

  // Loading inicial: placeholder discreto calm
  if (loading && posts.length === 0) {
    return (
      <Link
        href={href}
        className="block surface-calm p-3 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">💬</span>
          <span className="flex-1 font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
            Cargando muro…
          </span>
        </div>
      </Link>
    )
  }

  // Empty state: CTA claro
  if (posts.length === 0) {
    return (
      <Link
        href={href}
        className="block surface-calm hairline-top p-3.5 active:scale-[0.99] transition-transform"
        style={{ ['--comm-color' as string]: communityColor }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">💬</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold font-barlow">Muro de la comunidad</p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
              Sé el primero en escribir.
            </p>
          </div>
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-s"
            style={{
              background: `${communityColor}1a`,
              color: communityColor,
              border: `1px solid ${communityColor}44`,
            }}
          >
            Abrir ›
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="block surface-calm hairline-top p-3.5 active:scale-[0.99] transition-transform"
      style={{ ['--comm-color' as string]: communityColor }}
      aria-label="Abrir muro de la comunidad"
    >
      {/* Header: label + contador + badge nuevos */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h3
            className="font-barlow text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--muted)' }}
          >
            Muro
          </h3>
          {newCount > 0 && (
            <span
              className="font-mono text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full chip-pulse"
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
        <span
          className="font-mono text-[10px] tabular-nums"
          style={{ color: 'var(--muted)' }}
        >
          {posts.length} post{posts.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Bloque principal: avatars + post + YT thumb */}
      <div className="flex items-start gap-3">
        {/* Avatars apilados */}
        {recentAuthors.length > 0 && (
          <div className="flex -space-x-2 flex-shrink-0 mt-0.5" aria-hidden="true">
            {recentAuthors.map((author, idx) => (
              <div
                key={author.id}
                className="rounded-full"
                style={{
                  border: '2px solid var(--bg2)',
                  zIndex: recentAuthors.length - idx,
                }}
              >
                <PlayerAvatar player={author} size={30} communityColor={communityColor} />
              </div>
            ))}
          </div>
        )}

        {/* Último post */}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tabular-nums" style={{ color: 'var(--muted)' }}>
            <span
              className="font-barlow font-bold"
              style={{ color: lastIsNew ? communityColor : 'var(--text)' }}
            >
              {last.author?.name ?? 'Alguien'}
            </span>
            <span className="divider-dot" aria-hidden="true" />
            <span>hace {timeAgoShort(last.created_at)}</span>
          </p>
          <p
            className="text-[13px] font-barlow leading-snug mt-0.5 line-clamp-2 break-words"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {last.body}
          </p>
        </div>

        {/* YT thumbnail si el último tiene video */}
        {last.youtube_id && (
          <div
            className="relative flex-shrink-0 rounded-s overflow-hidden"
            style={{
              width: 52,
              height: 52,
              border: '1px solid var(--border)',
              background: 'var(--bg3)',
            }}
            aria-hidden="true"
          >
            <img
              src={`https://i.ytimg.com/vi/${last.youtube_id}/mqdefault.jpg`}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.35)' }}
            >
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 22,
                  height: 22,
                  background: `${communityColor}e6`,
                  color: '#050d05',
                  fontSize: 10,
                  paddingLeft: 2,
                }}
              >
                ▶
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Footer: CTA */}
      <div
        className="flex items-center justify-between mt-2.5 pt-2.5"
        style={{ borderTop: '1px dashed var(--border)' }}
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Ver muro completo
        </span>
        <span
          className="flex items-center justify-center rounded-full font-bold"
          style={{
            width: 24,
            height: 24,
            background: `${communityColor}1a`,
            color: communityColor,
            border: `1px solid ${communityColor}44`,
            fontSize: 14,
          }}
        >
          ›
        </span>
      </div>
    </Link>
  )
}
