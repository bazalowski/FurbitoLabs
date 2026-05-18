'use client'

import Link from 'next/link'
import type { WallPost as WallPostType } from '@/types'

interface WallSystemPostProps {
  post: WallPostType
  communityId: string
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

// Render compacto + neutral. Sin avatar de autor, icono de sistema y deep
// link al recurso (partido o jugador) para que sea un atajo, no ruido.
export function WallSystemPost({ post, communityId, communityColor }: WallSystemPostProps) {
  const payload = post.payload ?? {}
  const eventId = payload.event_id

  let icon = '📣'
  let title = ''
  let detail: string | null = null
  let href: string | null = null

  switch (post.kind) {
    case 'system_match_created':
      icon = '📅'
      title = `Nuevo evento: ${payload.titulo ?? 'Sin título'}`
      detail = formatFechaHora(payload.fecha ?? null, payload.hora ?? null)
      if (eventId) href = `/${communityId}/partidos/${eventId}`
      break
    case 'system_match_result':
      icon = '🏁'
      title = payload.titulo ?? 'Partido finalizado'
      detail = `Resultado · ${payload.goles_a ?? 0} - ${payload.goles_b ?? 0}`
      if (eventId) href = `/${communityId}/partidos/${eventId}`
      break
    case 'system_mvp':
      icon = '👑'
      title = `MVP — ${payload.mvp_name ?? 'jugador'}`
      detail = payload.titulo ?? null
      if (eventId) href = `/${communityId}/partidos/${eventId}`
      break
    default:
      title = post.body || 'Aviso'
  }

  const body = (
    <article
      className="surface-calm flex items-center gap-2.5 p-2.5 hairline-top"
      style={{
        background: 'var(--card2)',
        ['--comm-color' as string]: communityColor,
      }}
    >
      <span
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          background: `${communityColor}1a`,
          border: `1px solid ${communityColor}55`,
          fontSize: 16,
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold font-barlow truncate leading-tight">{title}</p>
        {detail && (
          <p
            className="font-mono text-[10px] tabular-nums leading-tight mt-0.5 truncate"
            style={{ color: 'var(--muted)' }}
          >
            {detail}
          </p>
        )}
      </div>
      <span
        className="font-mono text-[10px] tabular-nums flex-shrink-0"
        style={{ color: 'var(--muted)' }}
      >
        {timeAgo(post.created_at)}
      </span>
      {href && (
        <span
          className="font-mono text-[14px] flex-shrink-0"
          style={{ color: 'var(--muted)' }}
          aria-hidden="true"
        >
          ›
        </span>
      )}
    </article>
  )

  if (href) {
    return (
      <Link href={href} className="block active:scale-[0.995] transition-transform">
        {body}
      </Link>
    )
  }
  return body
}

function formatFechaHora(fecha: string | null, hora: string | null): string | null {
  if (!fecha) return null
  try {
    const d = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short',
    })
    return hora ? `${d} · ${hora}h` : d
  } catch {
    return fecha
  }
}
