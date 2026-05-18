'use client'

import { createClient } from './client'

export type UnfinalizeError =
  | 'no_auth'
  | 'invalid_auth'
  | 'not_admin'
  | 'event_not_found'
  | 'not_finalized'
  | 'window_expired'
  | 'snapshot_not_found'
  | 'rate_limited'
  | 'invalid_event_id'
  | 'server_error'
  | 'network_error'

/**
 * Llama a la Edge Function `unfinalize-match` con el JWT actual.
 * Solo el admin de la comunidad puede revertir, y solo durante los
 * 15 minutos siguientes al `finalize-match`.
 */
export async function unfinalizeMatch(
  eventId: string,
): Promise<{ ok: true } | { ok: false; error: UnfinalizeError }> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { ok: false, error: 'no_auth' }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/unfinalize-match`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ event_id: eventId }),
  }).catch(() => null)

  if (!res) return { ok: false, error: 'network_error' }

  if (res.ok) return { ok: true }

  const body = await res.json().catch(() => null) as { error?: string } | null
  const code = body?.error ?? ''
  switch (code) {
    case 'no_auth': return { ok: false, error: 'no_auth' }
    case 'invalid_auth': return { ok: false, error: 'invalid_auth' }
    case 'not_admin_of_community': return { ok: false, error: 'not_admin' }
    case 'event_not_found': return { ok: false, error: 'event_not_found' }
    case 'not_finalized': return { ok: false, error: 'not_finalized' }
    case 'window_expired': return { ok: false, error: 'window_expired' }
    case 'snapshot_not_found': return { ok: false, error: 'snapshot_not_found' }
    case 'rate_limited': return { ok: false, error: 'rate_limited' }
    case 'invalid_event_id':
    case 'invalid_body': return { ok: false, error: 'invalid_event_id' }
    default: return { ok: false, error: 'server_error' }
  }
}

export const UNDO_WINDOW_MS = 15 * 60 * 1000

/** Devuelve ms restantes en la ventana de undo, o null si ya no aplica. */
export function undoMsRemaining(finalizadoAt: string | null | undefined): number | null {
  if (!finalizadoAt) return null
  const ms = UNDO_WINDOW_MS - (Date.now() - new Date(finalizadoAt).getTime())
  return ms > 0 ? ms : null
}
