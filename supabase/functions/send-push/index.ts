// ════════════════════════════════════════════════════
//  Supabase Edge Function: send-push
//  Envía Web Push notifications a suscriptores usando VAPID.
//
//  POST /functions/v1/send-push
//  Body (uno de estos dos bloques + el resto):
//    { community_id, title, body, type, url?, icon?, exclude_player_id? }
//    { target_player_id, title, body, type, url?, icon? }
//
//  Requiere env vars en Supabase Dashboard → Edge Functions → Secrets:
//    VAPID_PUBLIC_KEY
//    VAPID_PRIVATE_KEY
//    VAPID_SUBJECT   (e.g. "mailto:admin@furbito.app")
// ════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@furbito.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

interface PushBody {
  community_id?: string
  target_player_id?: string
  title: string
  body: string
  url?: string
  type: string
  icon?: string
  exclude_player_id?: string
}

interface Subscription {
  id: string
  endpoint: string
  key_auth: string
  key_p256dh: string
  player_id: string
  preferences: Record<string, boolean> | null
}

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    return json(500, { error: 'VAPID keys not configured' })
  }

  let payload: PushBody
  try {
    payload = await req.json() as PushBody
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const { community_id, target_player_id, title, body, url, type, icon, exclude_player_id } = payload
  if (!title || !type) return json(400, { error: 'title and type required' })
  if (!community_id && !target_player_id) {
    return json(400, { error: 'community_id or target_player_id required' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let query = supabase
    .from('push_subscriptions')
    .select('id, endpoint, key_auth, key_p256dh, player_id, preferences')

  if (target_player_id) {
    query = query.eq('player_id', target_player_id)
  } else if (community_id) {
    query = query.eq('community_id', community_id)
  }

  const { data: subs, error } = await query
  if (error) return json(500, { error: 'Failed to fetch subscriptions', detail: error.message })

  const allSubs = (subs ?? []) as Subscription[]
  const targets = allSubs.filter(sub => {
    if (exclude_player_id && sub.player_id === exclude_player_id) return false
    const prefs = sub.preferences
    // Un pref desconocido se trata como "permitido" — por defecto enviamos.
    if (prefs && prefs[type] === false) return false
    return true
  })

  const pushPayload = JSON.stringify({
    title,
    body: body ?? '',
    url: url ?? '/',
    tag: type,
    icon: icon ?? '/icons/icon-192x192.png',
  })

  const results = {
    total: allSubs.length,
    targeted: targets.length,
    sent: 0,
    failed: 0,
    removed: 0,
  }

  await Promise.all(targets.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { auth: sub.key_auth, p256dh: sub.key_p256dh },
        },
        pushPayload,
        { TTL: 86400 }
      )
      results.sent += 1
    } catch (err: unknown) {
      results.failed += 1
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 404 || status === 410) {
        // Endpoint expirado → limpiar suscripción muerta
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        results.removed += 1
      } else {
        console.error('[send-push] delivery error', {
          endpoint: sub.endpoint,
          status,
          message: (err as Error)?.message,
        })
      }
    }
  }))

  console.log(
    `[send-push] type=${type} total=${results.total} targeted=${results.targeted} ` +
    `sent=${results.sent} failed=${results.failed} removed=${results.removed}`
  )

  return json(200, results)
})
