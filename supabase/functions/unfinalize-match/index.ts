// ════════════════════════════════════════════════════
//  Supabase Edge Function: unfinalize-match
//
//  Permite a un admin revertir la finalización de un partido durante
//  los 15 minutos siguientes a haberlo cerrado. Pensado para corregir
//  errores honestos (gol mal asignado, MVP confundido, alineación
//  movida en último momento) sin tocar SQL.
//
//  Restaura el estado previo de cada jugador desde
//  `event_player_snapshots` (poblado por `finalize-match`), borra
//  los `match_players` del evento, borra los `mvp_votes` y resetea
//  los flags del `events` row.
//
//  POST /functions/v1/unfinalize-match
//  Headers: Authorization: Bearer <jwt del admin>
//  Body:    { event_id: string }
//
//  Respuestas:
//    200 { ok: true }
//    400 { error: 'invalid_body' | 'invalid_event_id' }
//    401 { error: 'no_auth' | 'invalid_auth' }
//    403 { error: 'not_admin_of_community' }
//    404 { error: 'event_not_found' | 'snapshot_not_found' }
//    409 { error: 'not_finalized' | 'window_expired' }
//    429 { error: 'rate_limited' }
//    500 { error: 'db_error' | 'server_misconfigured' }
// ════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const UNDO_WINDOW_MS = 15 * 60 * 1000

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

interface Bucket { count: number; resetAt: number }
const byIp = new Map<string, Bucket>()
const WINDOW_MS = 60_000
const IP_LIMIT = 10

function rateLimitOk(ip: string): boolean {
  const now = Date.now()
  const b = byIp.get(ip)
  if (!b || b.resetAt < now) {
    byIp.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (b.count >= IP_LIMIT) return false
  b.count += 1
  return true
}

function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  )
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return json(500, { error: 'server_misconfigured' })
  }

  const ip = getIp(req)
  if (!rateLimitOk(ip)) return json(429, { error: 'rate_limited' })

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!jwt) return json(401, { error: 'no_auth' })

  const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userErr } = await supaUser.auth.getUser()
  if (userErr || !userData.user) return json(401, { error: 'invalid_auth' })
  const callerUid = userData.user.id

  let rawBody: unknown
  try { rawBody = await req.json() }
  catch { return json(400, { error: 'invalid_body' }) }

  const eventId = (rawBody as { event_id?: unknown })?.event_id
  if (typeof eventId !== 'string' || eventId.length < 1 || eventId.length > 64) {
    return json(400, { error: 'invalid_event_id' })
  }

  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // 1) Cargar evento + chequeos
  const { data: event, error: evErr } = await supa
    .from('events')
    .select('id, community_id, finalizado, finalizado_at')
    .eq('id', eventId)
    .maybeSingle()
  if (evErr || !event) return json(404, { error: 'event_not_found' })
  if (!event.finalizado) return json(409, { error: 'not_finalized' })

  const finalizadoAtMs = event.finalizado_at ? new Date(event.finalizado_at).getTime() : null
  if (finalizadoAtMs === null || Date.now() - finalizadoAtMs >= UNDO_WINDOW_MS) {
    return json(409, { error: 'window_expired' })
  }

  // 2) Caller admin de la comunidad
  const { data: pubUser } = await supa
    .from('users')
    .select('community_id, role')
    .eq('id', callerUid)
    .maybeSingle()
  if (!pubUser || pubUser.community_id !== event.community_id || pubUser.role !== 'admin') {
    return json(403, { error: 'not_admin_of_community' })
  }

  // 3) Leer snapshots y restaurar players uno a uno
  const { data: snaps, error: snapErr } = await supa
    .from('event_player_snapshots')
    .select('player_id, partidos, goles, asistencias, partidos_cero, mvps, xp, badges')
    .eq('event_id', eventId)
  if (snapErr) return json(500, { error: 'db_error_snapshot_read', detail: snapErr.message })
  if (!snaps || snaps.length === 0) return json(404, { error: 'snapshot_not_found' })

  for (const s of snaps) {
    const { error: puErr } = await supa
      .from('players')
      .update({
        partidos: s.partidos,
        goles: s.goles,
        asistencias: s.asistencias,
        partidos_cero: s.partidos_cero,
        mvps: s.mvps,
        xp: s.xp,
        badges: s.badges ?? [],
      })
      .eq('id', s.player_id)
      .eq('community_id', event.community_id)
    if (puErr) {
      return json(500, { error: 'db_error_player_restore', detail: puErr.message, player_id: s.player_id })
    }
  }

  // 4) Borrar match_players + mvp_votes del evento
  const { error: mpDelErr } = await supa
    .from('match_players')
    .delete()
    .eq('event_id', eventId)
  if (mpDelErr) return json(500, { error: 'db_error_match_players_delete', detail: mpDelErr.message })

  const { error: mvDelErr } = await supa
    .from('mvp_votes')
    .delete()
    .eq('event_id', eventId)
  if (mvDelErr) return json(500, { error: 'db_error_mvp_votes_delete', detail: mvDelErr.message })

  // 5) Resetear flags del evento
  const { error: evUpdErr } = await supa
    .from('events')
    .update({
      finalizado: false,
      finalizado_at: null,
      goles_a: null,
      goles_b: null,
      mvp_id: null,
      mvp_voting_closes_at: null,
    })
    .eq('id', eventId)
  if (evUpdErr) return json(500, { error: 'db_error_event_update', detail: evUpdErr.message })

  // 6) Borrar snapshots (ya no son necesarios — el evento vuelve a estado pre-finalización)
  await supa.from('event_player_snapshots').delete().eq('event_id', eventId)

  return json(200, { ok: true })
})
