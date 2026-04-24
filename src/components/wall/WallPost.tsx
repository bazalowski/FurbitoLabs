'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import type { WallPost as WallPostType } from '@/types'

export const REACTION_EMOJIS = ['🔥', '⚽', '👏', '😂', '💀', '🎯'] as const
type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

interface WallPostProps {
  post: WallPostType
  meId: string
  canDelete: boolean
  communityColor: string
}

function timeAgo(dateStr: string): string {
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

export function WallPost({ post, meId, canDelete, communityColor }: WallPostProps) {
  const [busyEmoji, setBusyEmoji] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const reactions = post.reactions ?? []

  const grouped = useMemo(() => {
    const map: Record<string, { count: number; mine: boolean }> = {}
    for (const emoji of REACTION_EMOJIS) map[emoji] = { count: 0, mine: false }
    for (const r of reactions) {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, mine: false }
      map[r.emoji].count += 1
      if (r.player_id === meId) map[r.emoji].mine = true
    }
    return map
  }, [reactions, meId])

  async function toggleReaction(emoji: ReactionEmoji) {
    if (busyEmoji) return
    setBusyEmoji(emoji)
    const supabase = createClient()
    const mine = grouped[emoji]?.mine
    if (mine) {
      const { error } = await supabase
        .from('wall_reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('player_id', meId)
        .eq('emoji', emoji)
      if (error) showToast('No se pudo quitar la reacción')
    } else {
      const { error } = await supabase
        .from('wall_reactions')
        .insert({ post_id: post.id, player_id: meId, emoji })
      if (error) showToast('No se pudo reaccionar')
    }
    setBusyEmoji(null)
  }

  async function handleDelete() {
    if (!confirm('¿Borrar este post?')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('wall_posts').delete().eq('id', post.id)
    if (error) {
      showToast('No se pudo borrar')
      setDeleting(false)
    }
  }

  const authorName = post.author?.name ?? 'Desconocido'
  const isMyPost = post.author_id === meId

  return (
    <article className="surface-calm p-3 space-y-2.5">
      <header className="flex items-center gap-2.5">
        {post.author ? (
          <PlayerAvatar player={post.author} size={32} communityColor={communityColor} />
        ) : (
          <div
            className="rounded-full flex-shrink-0"
            style={{ width: 32, height: 32, background: 'var(--card2)' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold truncate font-barlow">{authorName}{isMyPost && <span style={{ color: 'var(--muted)' }}> · tú</span>}</p>
          <p className="font-mono text-[10px] tabular-nums" style={{ color: 'var(--muted)' }}>
            hace {timeAgo(post.created_at)}
          </p>
        </div>

        {canDelete && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Opciones"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[15px] font-bold active:scale-[0.95] transition-transform"
              style={{
                background: 'var(--card2)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-9 z-[10] rounded-m overflow-hidden"
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-depth-3)',
                  minWidth: 140,
                }}
              >
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full text-left px-3 py-2.5 text-[13px] font-bold active:opacity-70"
                  style={{ color: 'var(--red)' }}
                >
                  {deleting ? 'Borrando…' : 'Borrar'}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <p className="text-[14px] font-barlow leading-snug whitespace-pre-wrap break-words">
        {post.body}
      </p>

      {post.youtube_id && (
        <div
          className="rounded-s overflow-hidden"
          style={{ border: '1px solid var(--border)', aspectRatio: '16 / 9' }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${post.youtube_id}`}
            title="YouTube"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {REACTION_EMOJIS.map(emoji => {
          const { count, mine } = grouped[emoji]
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggleReaction(emoji)}
              disabled={busyEmoji !== null}
              aria-pressed={mine}
              className="rounded-s px-2 py-1 inline-flex items-center gap-1 active:scale-[0.94] transition-transform"
              style={{
                background: mine ? `${communityColor}1a` : 'var(--card2)',
                border: `1px solid ${mine ? communityColor + '66' : 'var(--border)'}`,
              }}
            >
              <span className="text-[13px] leading-none" aria-hidden="true">{emoji}</span>
              <span
                className="font-mono text-[10px] tabular-nums"
                style={{ color: count > 0 ? (mine ? communityColor : 'var(--text)') : 'var(--muted)' }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </article>
  )
}
