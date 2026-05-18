// ════════════════════════════════════════════════════
//  Supabase Edge Function: community-create
//
//  Único endpoint autorizado para crear comunidades. Sustituye al
//  INSERT directo del cliente, que tras la mig 014 ya no es viable
//  porque `communities` no expone INSERT a anon (anti-bruteforce +
//  anti-spam). El cliente llamaba a `supabase.from('communities')
//  .insert(...)` y recibía 42501; este endpoint lo hace con
//  service_role tras validar input y rate-limitar por IP.
//
//  POST /functions/v1/community-create
//  Body:
//    {
//      name:      string  (1..40 chars)
//      pin:       string  (3..32 chars, [A-Z0-9])
//      color:     string  (debe estar en COMMUNITY_COLORS)
//      adminName: string  (1..30 chars)
//    }
//
//  Respuestas:
//    200 { communityId, playerId, playerCode, color }
//    400 { error: 'invalid_body' | 'invalid_pin' | 'invalid_color' |
//                 'invalid_name' | 'invalid_admin_name' }
//    409 { error: 'pin_in_use' }
//    429 { error: 'rate_limited' }
//    500 { error: 'db_error' | 'server_misconfigured' }
//
//  Rate-limit en memoria: 5 creaciones / minuto por IP (más estricto
//  que community-lookup porque crear es destructivo / spammeable).
// ════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

// Allowlist server-side espejo de src/lib/utils.ts → COMMUNITY_COLORS.
// Si añades un color allí, replícalo aquí.
const ALLOWED_COLORS = new Set<string>([
  '#a8ff3e', '#ff5c5c', '#ff9030', '#ffd700',
  '#38bdf8', '#c084fc', '#f472b6', '#34d399',
])

interface Bucket { count: number; resetAt: number }
const byIp = new Map<string, Bucket>()
const WINDOW_MS = 60_000
const IP_LIMIT = 5

function hit(map: Map<string, Bucket>, key: string, limit: number): boolean {
  const now = Date.now()
  const b = map.get(key)
  if (!b || b.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (b.count >= limit) return false
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

function sanitizePin(pin: unknown): string | null {
  if (typeof pin !== 'string') return null
  const trimmed = pin.trim().toUpperCase()
  if (trimmed.length < 3 || trimmed.length > 32) return null
  if (!/^[A-Z0-9]+$/.test(trimmed)) return null
  return trimmed
}

function sanitizeName(raw: unknown, min: number, max: number): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed.length < min || trimmed.length > max) return null
  return trimmed
}

function genPlayerCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
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

  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'server_misconfigured' })
  }

  const ip = getIp(req)
  if (!hit(byIp, ip, IP_LIMIT)) {
    return json(429, { error: 'rate_limited' })
  }

  let body: { name?: unknown; pin?: unknown; color?: unknown; adminName?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_body' })
  }

  const name = sanitizeName(body.name, 1, 40)
  if (!name) return json(400, { error: 'invalid_name' })

  const adminName = sanitizeName(body.adminName, 1, 30)
  if (!adminName) return json(400, { error: 'invalid_admin_name' })

  const pin = sanitizePin(body.pin)
  if (!pin) return json(400, { error: 'invalid_pin' })

  const color = typeof body.color === 'string' ? body.color : ''
  if (!ALLOWED_COLORS.has(color)) return json(400, { error: 'invalid_color' })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Pre-check de unicidad del PIN. Sin UNIQUE en la columna esto es
  // best-effort; un atacante con timing perfecto podría duplicar.
  // Mitigable con `ALTER TABLE communities ADD CONSTRAINT communities_pin_key UNIQUE (pin)`.
  const { data: existing, error: lookupErr } = await supabase
    .from('communities')
    .select('id')
    .eq('pin', pin)
    .maybeSingle()

  if (lookupErr) return json(500, { error: 'db_error' })
  if (existing) return json(409, { error: 'pin_in_use' })

  const communityId = crypto.randomUUID()
  const playerId = crypto.randomUUID()
  const playerCode = genPlayerCode()

  const { error: communityErr } = await supabase.from('communities').insert({
    id: communityId,
    name,
    pin,
    color,
    comm_admin_id: playerId,
    admin_ids: [playerId],
  })

  if (communityErr) return json(500, { error: 'db_error' })

  const { error: playerErr } = await supabase.from('players').insert({
    id: playerId,
    community_id: communityId,
    name: adminName,
    code: playerCode,
  })

  if (playerErr) {
    // Rollback: si falla el alta del jugador, no dejamos comunidad huérfana.
    await supabase.from('communities').delete().eq('id', communityId)
    return json(500, { error: 'db_error' })
  }

  return json(200, { communityId, playerId, playerCode, color })
})
