'use client'

import { useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { extractYoutubeIdFromText, parseYoutubeId } from '@/lib/youtube'
import type { Player } from '@/types'

interface WallComposerProps {
  communityId: string
  me: Player
  communityColor: string
  onPosted?: () => void
}

const MAX_BODY = 1000

export function WallComposer({ communityId, me, communityColor, onPosted }: WallComposerProps) {
  const [body, setBody] = useState('')
  const [ytUrl, setYtUrl] = useState('')
  const [showYtInput, setShowYtInput] = useState(false)
  const [posting, setPosting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const ytFromText = useMemo(() => extractYoutubeIdFromText(body), [body])
  const ytFromInput = useMemo(() => parseYoutubeId(ytUrl), [ytUrl])
  const ytId = ytFromInput ?? ytFromText
  const ytInputInvalid = showYtInput && ytUrl.trim().length > 0 && !ytFromInput

  const bodyTrimmed = body.trim()
  const canPost = bodyTrimmed.length > 0 && bodyTrimmed.length <= MAX_BODY && !posting
  const isDirty = body.length > 0 || showYtInput

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canPost) return
    setPosting(true)
    const supabase = createClient()
    const { error } = await supabase.from('wall_posts').insert({
      community_id: communityId,
      author_id: me.id,
      body: bodyTrimmed,
      youtube_id: ytId,
    })
    setPosting(false)
    if (error) {
      showToast('No se pudo publicar')
      return
    }
    setBody('')
    setYtUrl('')
    setShowYtInput(false)
    setExpanded(false)
    textareaRef.current?.blur()
    onPosted?.()
  }

  function handleExpand() {
    setExpanded(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function handleCollapseIfClean() {
    if (!isDirty) setExpanded(false)
  }

  const remaining = MAX_BODY - body.length

  // ─── Colapsado: row compacto clickable ───
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={handleExpand}
        className="surface-calm w-full p-2.5 flex items-center gap-2.5 text-left active:scale-[0.995] transition-transform"
        style={{
          boxShadow: 'var(--shadow-depth-1)',
        }}
      >
        <PlayerAvatar player={me} size={32} communityColor={communityColor} />
        <span
          className="flex-1 min-w-0 truncate text-[13px] font-barlow"
          style={{ color: 'var(--muted)' }}
        >
          ¿Qué cuentas al vestuario?
        </span>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-s"
          style={{
            background: `${communityColor}1a`,
            color: communityColor,
            border: `1px solid ${communityColor}44`,
          }}
          aria-hidden="true"
        >
          Publicar
        </span>
      </button>
    )
  }

  // ─── Expandido: form completo ───
  return (
    <form
      onSubmit={handleSubmit}
      onBlur={handleCollapseIfClean}
      className="surface-calm p-3 space-y-2"
    >
      <div className="flex items-center gap-2.5">
        <PlayerAvatar player={me} size={28} communityColor={communityColor} />
        <span
          className="flex-1 font-barlow text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--muted)' }}
        >
          {me.name}
        </span>
        {!isDirty && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Cerrar"
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm active:scale-[0.95]"
            style={{
              background: 'var(--card2)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={body}
        onChange={e => setBody(e.target.value.slice(0, MAX_BODY))}
        placeholder="¿Qué cuentas al vestuario?"
        rows={3}
        className="w-full bg-transparent resize-none outline-none text-sm font-barlow"
        style={{ color: 'var(--text)', minHeight: '64px' }}
      />

      {showYtInput && (
        <div className="space-y-1">
          <input
            type="url"
            inputMode="url"
            value={ytUrl}
            onChange={e => setYtUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-s px-3 py-2 text-[13px] outline-none"
            style={{
              background: 'var(--bg2)',
              color: 'var(--text)',
              border: `1px solid ${ytInputInvalid ? 'var(--red)' : 'var(--border)'}`,
            }}
          />
          {ytInputInvalid && (
            <p className="font-mono text-[10px]" style={{ color: 'var(--red)' }}>
              URL de YouTube no reconocida
            </p>
          )}
        </div>
      )}

      {ytId && (
        <div
          className="rounded-s overflow-hidden"
          style={{ border: '1px solid var(--border)', aspectRatio: '16 / 9' }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title="YouTube preview"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowYtInput(v => !v)}
          aria-pressed={showYtInput}
          className="rounded-s px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors active:scale-[0.97]"
          style={{
            background: showYtInput ? `${communityColor}1a` : 'var(--card2)',
            color: showYtInput ? communityColor : 'var(--muted)',
            border: `1px solid ${showYtInput ? communityColor + '55' : 'var(--border)'}`,
          }}
        >
          ▶ YouTube
        </button>

        <span
          className="font-mono text-[10px] tabular-nums ml-auto"
          style={{ color: remaining < 100 ? 'var(--orange)' : 'var(--muted)' }}
        >
          {remaining}
        </span>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!canPost}
          style={{ background: communityColor }}
        >
          {posting ? 'Publicando…' : 'Publicar'}
        </Button>
      </div>
    </form>
  )
}
