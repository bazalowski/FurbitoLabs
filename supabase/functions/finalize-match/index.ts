// ════════════════════════════════════════════════════
//  Supabase Edge Function: finalize-match
//
//  Valida y ejecuta la finalización de un partido. Antes, el cliente
//  hacía `events.update` + `match_players.upsert` + `players.update`
//  directamente. Las policies RLS ya impedían abuso cross-community,
//  pero un admin de su propia comu podía enviar stats arbitrarias
//  (inflar goles, dar XP descomunal, asignar badges aleatorios).
//
//  Este endpoint:
//    · Verifica que el caller es admin de la comunidad del evento.
//    · Valida coherencia interna del payload (suma de goles, jugadores
//      pertenecen a la comu, XP y badges en rangos razonables).
//    · Rechaza doble-finalización (idempotencia por event_id).
//    · Si todo válido → ejecuta los writes con service_role.
//
//  El cálculo de stats/badges/XP sigue siendo cliente (lo hace
//  src/lib/game/) — esta función es el CHECKPOINT, no el cálculo.
// ════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

// ── Rate-limit en memoria ──────────────────
// Finalizar partidos es una operación infrecuente (1 partido = 1 call).
// Limitamos a 10 req/min/IP — si alguien envía más está atacando.
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

// ── Schema del payload ──────────────────────
interface MatchPlayerInput {
  player_id: string
  goles: number
  asistencias: number
  porteria_cero: number
  parada_penalti: boolean
  chilena: boolean
  olimpico: boolean
  tacon: boolean
  equipo: 'A' | 'B'
  xp_ganado: number
}

interface PlayerUpdate {
  id: string
  partidos: number
  goles: number
  asistencias: number
  partidos_cero: number
  xp: number
  badges: string[]
}

interface FinalizeMatchBody {
  event_id: string
  goles_a: number
  goles_b: number
  equipo_a: string[]
  equipo_b: string[]
  match_players: MatchPlayerInput[]
  player_updates: PlayerUpdate[]
  mvp_voting_closes_at: string
}

// ── Validadores ──────────────────────────────
const BADGE_KEY_RE = /^[a-z0-9_]{2,48}$/i
const MAX_XP_PER_MATCH = 5000 // cota muy holgada; un match real da <500
const MAX_GOLES_PER_MATCH = 30
const MAX_ASIST_PER_MATCH = 30
const MAX_BADGES_TOTAL = 500

function validatePayload(body: unknown): { ok: true; data: FinalizeMatchBody } | { ok: false; msg: string } {
  if (!body || typeof body !== 'object') return { ok: false, msg: 'body_not_object' }
  const b = body as Record<string, unknown>

  if (typeof b.event_id !== 'string' || b.event_id.length < 1 || b.event_id.length > 64)
    return { ok: false, msg: 'invalid_event_id' }

  const golesA = Number(b.goles_a), golesB = Number(b.goles_b)
  if (!Number.isInteger(golesA) || golesA < 0 || golesA > MAX_GOLES_PER_MATCH)
    return { ok: false, msg: 'invalid_goles_a' }
  if (!Number.isInteger(golesB) || golesB < 0 || golesB > MAX_GOLES_PER_MATCH)
    return { ok: false, msg: 'invalid_goles_b' }

  if (!Array.isArray(b.equipo_a) || !Array.isArray(b.equipo_b))
    return { ok: false, msg: 'invalid_teams' }
  const teamA = b.equipo_a as unknown[], teamB = b.equipo_b as unknown[]
  if (!teamA.every(x => typeof x === 'string') || !teamB.every(x => typeof x === 'string'))
    return { ok: false, msg: 'invalid_team_members' }
  // Nadie en ambos equipos
  const overlap = (teamA as string[]).some(p => (teamB as string[]).includes(p))
  if (overlap) return { ok: false, msg: 'player_in_both_teams' }

  if (!Array.isArray(b.match_players)) return { ok: false, msg: 'invalid_match_players' }
  if (!Array.isArray(b.player_updates)) return { ok: false, msg: 'invalid_player_updates' }

  const mps = b.match_players as MatchPlayerInput[]
  for (const mp of mps) {
    if (typeof mp.player_id !== 'string') return { ok: false, msg: 'mp_bad_player_id' }
    if (!Number.isInteger(mp.goles) || mp.goles < 0 || mp.goles > MAX_GOLES_PER_MATCH)
      return { ok: false, msg: 'mp_bad_goles' }
    if (!Number.isInteger(mp.asistencias) || mp.asistencias < 0 || mp.asistencias > MAX_ASIST_PER_MATCH)
      return { ok: false, msg: 'mp_bad_asist' }
    if (mp.equipo !== 'A' && mp.equipo !== 'B') return { ok: false, msg: 'mp_bad_equipo' }
    if (!Number.isInteger(mp.xp_ganado) || mp.xp_ganado < 0 || mp.xp_ganado > MAX_XP_PER_MATCH)
      return { ok: false, msg: 'mp_bad_xp' }
  }

  const pus = b.player_updates as PlayerUpdate[]
  for (const pu of pus) {
    if (typeof pu.id !== 'string') return { ok: false, msg: 'pu_bad_id' }
    if (!Number.isInteger(pu.partidos) || pu.partidos < 0) return { ok: false, msg: 'pu_bad_partidos' }
    if (!Number.isInteger(pu.goles) || pu.goles < 0) return { ok: false, msg: 'pu_bad_goles' }
    if (!Number.isInteger(pu.asistencias) || pu.asistencias < 0) return { ok: false, msg: 'pu_bad_asist' }
    if (!Number.isInteger(pu.xp) || pu.xp < 0) return { ok: false, msg: 'pu_bad_xp' }
    if (!Array.isArray(pu.badges) || pu.badges.length > MAX_BADGES_TOTAL)
      return { ok: false, msg: 'pu_bad_badges_array' }
    if (!pu.badges.every(k => typeof k === 'string' && BADGE_KEY_RE.test(k)))
      return { ok: false, msg: 'pu_bad_badge_key' }
  }

  if (typeof b.mvp_voting_closes_at !== 'string') return { ok: false, msg: 'invalid_mvp_closes_at' }

  return { ok: true, data: body as FinalizeMatchBody }
}

// Coherencia entre los arrays (solo matemática, no requiere DB)
function validateCoherence(data: FinalizeMatchBody): { ok: true } | { ok: false; msg: string } {
  const { goles_a, goles_b, equipo_a, equipo_b, match_players } = data

  // Cada match_player está en alguno de los equipos
  const teamSet = new Set([...equipo_a, ...equipo_b])
  for (const mp of match_players) {
    if (!teamSet.has(mp.player_id)) return { ok: false, msg: 'mp_not_in_teams' }
    const expectedTeam = equipo_a.includes(mp.player_id) ? 'A' : 'B'
    if (mp.equipo !== expectedTeam) return { ok: false, msg: 'mp_team_mismatch' }
  }

  // Suma de goles individuales = score del equipo (tolerancia: igual o menos,
  // porque puede haber goles en contra que no se atribuyen; pero NUNCA más).
  const sumA = match_players.filter(m => m.equipo === 'A').reduce((s, m) => s + m.goles, 0)
  const sumB = match_players.filter(m => m.equipo === 'B').reduce((s, m) => s + m.goles, 0)
  if (sumA > goles_a) return { ok: false, msg: 'team_a_individual_gt_score' }
  if (sumB > goles_b) return { ok: false, msg: 'team_b_individual_gt_score' }

  return { ok: true }
}

// ── Handler ──────────────────────────────────
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

  // ── Auth del caller ──
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!jwt) return json(401, { error: 'no_auth' })

  // Cliente con el JWT del caller (respeta RLS)
  const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userErr } = await supaUser.auth.getUser()
  if (userErr || !userData.user) return json(401, { error: 'invalid_auth' })
  const callerUid = userData.user.id

  // ── Parse y valida payload ──
  let rawBody: unknown
  try { rawBody = await req.json() }
  catch { return json(400, { error: 'invalid_body' }) }

  const parsed = validatePayload(rawBody)
  if (!parsed.ok) return json(400, { error: 'schema', detail: parsed.msg })
  const payload = parsed.data

  const coherent = validateCoherence(payload)
  if (!coherent.ok) return json(400, { error: 'incoherent', detail: coherent.msg })

  // ── Cliente privilegiado para leer detalles y escribir ──
  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // 1) Cargar el evento + caller role en la comu
  const { data: event, error: evErr } = await supa
    .from('events')
    .select('id, community_id, finalizado')
    .eq('id', payload.event_id)
    .maybeSingle()
  if (evErr || !event) return json(404, { error: 'event_not_found' })
  if (event.finalizado) return json(409, { error: 'already_finalized' })

  // 2) Caller debe ser admin de la comunidad del evento
  //    (policy check duplicado en servidor — defensa en profundidad)
  const { data: pubUser } = await supa
    .from('users')
    .select('community_id, role')
    .eq('id', callerUid)
    .maybeSingle()
  if (!pubUser || pubUser.community_id !== event.community_id || pubUser.role !== 'admin') {
    return json(403, { error: 'not_admin_of_community' })
  }

  // 3) Todos los player_ids (de equipos + updates + match_players) pertenecen a la comu
  const allIds = new Set<string>([
    ...payload.equipo_a,
    ...payload.equipo_b,
    ...payload.match_players.map(m => m.player_id),
    ...payload.player_updates.map(u => u.id),
  ])
  const { data: commPlayers, error: plErr } = await supa
    .from('players')
    .select('id')
    .eq('community_id', event.community_id)
    .in('id', Array.from(allIds))
  if (plErr) return json(500, { error: 'db_error_players' })
  const commIdsSet = new Set((commPlayers ?? []).map(p => p.id))
  for (const id of allIds) {
    if (!commIdsSet.has(id)) return json(400, { error: 'player_not_in_community', detail: id })
  }

  // 4) Ejecutar los writes con service_role
  const { error: evUpdErr } = await supa
    .from('events')
    .update({
      finalizado: true,
      goles_a: payload.goles_a,
      goles_b: payload.goles_b,
      equipo_a: payload.equipo_a,
      equipo_b: payload.equipo_b,
      mvp_id: null,
      mvp_voting_closes_at: payload.mvp_voting_closes_at,
    })
    .eq('id', payload.event_id)
  if (evUpdErr) return json(500, { error: 'db_error_event_update', detail: evUpdErr.message })

  // Upsert match_players en lote (clave natural: event_id + player_id)
  const mpRows = payload.match_players.map(mp => ({
    ...mp,
    event_id: payload.event_id,
  }))
  const { error: mpErr } = await supa
    .from('match_players')
    .upsert(mpRows, { onConflict: 'event_id,player_id' })
  if (mpErr) return json(500, { error: 'db_error_match_players', detail: mpErr.message })

  // Update players uno a uno (Supabase no soporta UPDATE con WHERE distinto por fila en upsert estándar)
  for (const pu of payload.player_updates) {
    const { error: puErr } = await supa
      .from('players')
      .update({
        partidos: pu.partidos,
        goles: pu.goles,
        asistencias: pu.asistencias,
        partidos_cero: pu.partidos_cero,
        xp: pu.xp,
        badges: pu.badges,
      })
      .eq('id', pu.id)
      .eq('community_id', event.community_id)
    if (puErr) return json(500, { error: 'db_error_player_update', detail: puErr.message, player_id: pu.id })
  }

  return json(200, { ok: true })
})
