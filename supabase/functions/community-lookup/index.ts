// ════════════════════════════════════════════════════
//  Supabase Edge Function: community-lookup
//
//  Único endpoint autorizado para buscar comunidades por PIN.
//  Sustituye al `GET /rest/v1/communities?pin=eq.X` que el cliente
//  usaba antes. Permite a la policy `communities_select` cerrarse
//  al propio community_id del caller, eliminando el vector de
//  bruteforce por REST directa.
//
//  POST /functions/v1/community-lookup
//  Body:
//    { op: 'lookup', pin: 'ABC123' }
//      → 200 { id, color }     (existe)
//      → 404 { error: 'not_found' }
//      → 429 { error: 'rate_limited' }
//
//    { op: 'check_pin', pin: 'NEW123' }
//      → 200 { available: true | false }
//      → 429 { error: 'rate_limited' }
//
//  Rate-limit en memoria (por instancia de edge runtime):
//    · Por IP: 20 requests / minuto.
//    · Por PIN consultado: 5 requests / minuto (anti-enumeración).
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

// ── Rate-limit sencillo en memoria ──────────────────
// Nota: cada instancia del edge runtime tiene su propia memoria, así que
// este RL es best-effort. Cumple su objetivo (frenar scripting trivial)
// pero un atacante distribuido podría saltárselo. Mitigable más adelante
// con Redis o un rate-limiter externo.
interface Bucket { count: number; resetAt: number }
const byIp = new Map<string, Bucket>()
const byPin = new Map<string, Bucket>()

const WINDOW_MS = 60_000
const IP_LIMIT = 20
const PIN_LIMIT = 5

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

// ── Helpers ──────────────────────────────────────────
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
  if (!/^[A-Z0-9]+$/i.test(trimmed)) return null
  return trimmed
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// ── Handler ──────────────────────────────────────────
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

  let body: { op?: unknown; pin?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_body' })
  }

  const pin = sanitizePin(body.pin)
  if (!pin) return json(400, { error: 'invalid_pin' })

  if (!hit(byPin, pin, PIN_LIMIT)) {
    return json(429, { error: 'rate_limited' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  if (body.op === 'lookup') {
    const { data, error } = await supabase
      .from('communities')
      .select('id, color')
      .eq('pin', pin)
      .maybeSingle()

    if (error) return json(500, { error: 'db_error' })
    if (!data) return json(404, { error: 'not_found' })
    return json(200, { id: data.id, color: data.color })
  }

  if (body.op === 'check_pin') {
    const { data, error } = await supabase
      .from('communities')
      .select('id')
      .eq('pin', pin)
      .maybeSingle()

    if (error) return json(500, { error: 'db_error' })
    return json(200, { available: !data })
  }

  return json(400, { error: 'invalid_op' })
})
