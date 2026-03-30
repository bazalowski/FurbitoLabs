// ════════════════════════════════════════════════════
//  Supabase Edge Function: send-push
//  Envía Web Push notifications a suscriptores de una comunidad
//
//  POST /functions/v1/send-push
//  Body: { community_id, title, body, url, type, exclude_player_id? }
//
//  Requiere env vars en Supabase Dashboard → Edge Functions → Secrets:
//    VAPID_PRIVATE_KEY
//    VAPID_PUBLIC_KEY
//    VAPID_SUBJECT (e.g. "mailto:admin@furbito.app")
// ════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Web Push signing con VAPID (usando la lib web-push para Deno)
// En Deno no hay web-push nativo, usamos crypto API directamente
// Por simplicidad, usamos fetch al push endpoint con headers VAPID

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@furbito.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface PushPayload {
  community_id: string
  title: string
  body: string
  url?: string
  type: string
  exclude_player_id?: string
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload: PushPayload = await req.json()
    const { community_id, title, body, url, type, exclude_player_id } = payload

    if (!community_id || !title) {
      return new Response(JSON.stringify({ error: 'community_id and title required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Obtener suscripciones de la comunidad
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, key_auth, key_p256dh, player_id, preferences')
      .eq('community_id', community_id)

    if (error || !subs) {
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Filtrar por preferencias y excluir emisor
    const targets = subs.filter(sub => {
      if (exclude_player_id && sub.player_id === exclude_player_id) return false
      const prefs = sub.preferences as Record<string, boolean> | null
      if (prefs && prefs[type] === false) return false
      return true
    })

    // Preparar payload de notificación
    const pushPayload = JSON.stringify({
      title,
      body,
      url: url ?? '/',
      tag: type,
      icon: '/icons/icon-192x192.png',
    })

    // Enviar push a cada suscriptor
    // NOTA: Para producción real necesitas firmar con VAPID.
    // Esto requiere la librería web-push o implementar JWT signing.
    // Por ahora logueamos los targets — la implementación completa
    // requiere importar una lib de Web Push compatible con Deno.
    const results = {
      total: subs.length,
      targeted: targets.length,
      sent: 0,
      failed: 0,
    }

    // TODO: Implementar envío real con VAPID signing
    // Cada target necesita: POST a target.endpoint con headers:
    //   Authorization: vapid t=<JWT>, k=<public_key>
    //   Content-Encoding: aes128gcm
    //   TTL: 86400
    // Body: pushPayload encriptado con target.key_p256dh + target.key_auth

    console.log(`[send-push] ${results.targeted} targets for "${type}" in community ${community_id}`)

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
