// ════════════════════════════════════════════════════
//  Supabase Edge Function: send-reminders
//  Recorre los eventos que empiezan en ~24h y no tienen
//  reminder_sent_at — envía push a cada comunidad y
//  marca el evento para no repetir.
//
//  Pensada para invocarse cada hora via pg_cron (ver migración
//  003_push_reminders_cron.sql) o manualmente desde un CI.
//
//  Ventana: fecha/hora del evento entre NOW()+23h y NOW()+25h.
//
//  Requiere env vars en Supabase Dashboard → Edge Functions → Secrets:
//    VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
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

interface EventRow {
  id: string
  titulo: string
  community_id: string
  fecha: string | null
  hora: string | null
  reminder_sent_at: string | null
  finalizado: boolean
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

  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    return json(500, { error: 'VAPID keys not configured' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Buscar eventos futuros sin recordatorio enviado.
  // Filtramos la ventana ~24h en código (fecha + hora vienen por separado).
  const { data: events, error } = await supabase
    .from('events')
    .select('id, titulo, community_id, fecha, hora, reminder_sent_at, finalizado')
    .eq('finalizado', false)
    .is('reminder_sent_at', null)

  if (error) {
    return json(500, { error: 'Failed to fetch events', detail: error.message })
  }

  const now = Date.now()
  const minTs = now + 23 * 60 * 60 * 1000
  const maxTs = now + 25 * 60 * 60 * 1000

  const toRemind = ((events ?? []) as EventRow[]).filter(ev => {
    if (!ev.fecha || !ev.hora) return false
    // fecha es YYYY-MM-DD, hora es HH:MM
    const ts = Date.parse(`${ev.fecha}T${ev.hora}:00`)
    if (Number.isNaN(ts)) return false
    return ts >= minTs && ts <= maxTs
  })

  let totalTargets = 0
  let totalSent = 0
  let totalFailed = 0
  let totalRemoved = 0

  for (const ev of toRemind) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, key_auth, key_p256dh, player_id, preferences')
      .eq('community_id', ev.community_id)

    const targets = ((subs ?? []) as Subscription[]).filter(sub => {
      const prefs = sub.preferences
      if (prefs && prefs.event_reminder === false) return false
      return true
    })

    totalTargets += targets.length

    const pushPayload = JSON.stringify({
      title: 'Partido mañana',
      body: `${ev.titulo} · ${ev.hora}`,
      url: `/${ev.community_id}/partidos/${ev.id}`,
      tag: 'event-reminder',
      icon: '/icons/icon-192x192.png',
    })

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
        totalSent += 1
      } catch (err: unknown) {
        totalFailed += 1
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          totalRemoved += 1
        } else {
          console.error('[send-reminders] delivery error', {
            endpoint: sub.endpoint,
            status,
            message: (err as Error)?.message,
          })
        }
      }
    }))

    // Marcar evento como recordado (aunque falle algún endpoint, evitamos spam)
    await supabase
      .from('events')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', ev.id)
  }

  const body = {
    events_processed: toRemind.length,
    targets: totalTargets,
    sent: totalSent,
    failed: totalFailed,
    removed: totalRemoved,
  }
  console.log('[send-reminders]', body)
  return json(200, body)
})
