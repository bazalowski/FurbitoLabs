/**
 * Envía una notificación push a los suscriptores de una comunidad via Supabase.
 * Se usa desde el cliente como trigger — en producción debería ser una Edge Function.
 *
 * Por ahora: notificación local como fallback cuando la app está abierta.
 */

import { createClient } from '@/lib/supabase/client'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  tag?: string
  url?: string
  type: 'event_created' | 'event_reminder' | 'match_finished' | 'badge_earned'
}

const DEFAULT_ICON = '/icons/icon-192x192.png'

/**
 * Muestra una notificación local (cuando la app está en primer plano)
 */
export function showLocalNotification(payload: NotificationPayload): void {
  if (typeof window === 'undefined') return

  // Si la app está en primer plano, usar la Notification API directamente
  if (Notification.permission === 'granted') {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? DEFAULT_ICON,
      tag: payload.tag ?? payload.type,
      badge: DEFAULT_ICON,
    })

    if (payload.url) {
      notification.onclick = () => {
        window.focus()
        window.location.href = payload.url!
        notification.close()
      }
    }
  }
}

/**
 * Envía push notification a todos los suscriptores de una comunidad.
 * Filtra por preferencia del tipo de notificación.
 *
 * NOTA: En producción esto debería ser una Supabase Edge Function
 * que recibe el payload y envía push via web-push library.
 * Por ahora, solo emitimos notificación local + guardamos en log.
 */
export async function notifyCommunity(
  communityId: string,
  payload: NotificationPayload,
  excludePlayerId?: string
): Promise<void> {
  const supabase = createClient()

  // Obtener suscriptores de la comunidad
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('player_id, endpoint, key_auth, key_p256dh, preferences')
    .eq('community_id', communityId)

  if (!subs || subs.length === 0) return

  // Filtrar por preferencia y excluir al emisor
  const targets = subs.filter(sub => {
    if (excludePlayerId && sub.player_id === excludePlayerId) return false
    const prefs = sub.preferences as Record<string, boolean> | null
    if (prefs && prefs[payload.type] === false) return false
    return true
  })

  // TODO: Cuando se implemente la Edge Function, aquí se hará el POST
  // Por ahora logueamos los targets para debug
  if (targets.length > 0) {
    console.log(`[FURBITO Push] ${targets.length} targets para "${payload.type}" en comunidad ${communityId}`)
  }
}

/**
 * Triggers de notificación — funciones helpers para cada evento
 */
export function notifyEventCreated(
  communityId: string,
  eventTitle: string,
  eventUrl: string,
  creatorPlayerId: string
) {
  const payload: NotificationPayload = {
    title: 'Nuevo partido',
    body: eventTitle,
    type: 'event_created',
    url: eventUrl,
    tag: 'event-created',
  }

  // Notificación local para el que crea (confirmación)
  showLocalNotification({
    ...payload,
    title: 'Partido creado',
    body: `"${eventTitle}" publicado`,
  })

  // Push al resto de la comunidad
  notifyCommunity(communityId, payload, creatorPlayerId)
}

export function notifyMatchFinished(
  communityId: string,
  eventTitle: string,
  scoreA: number,
  scoreB: number,
  eventUrl: string
) {
  const payload: NotificationPayload = {
    title: 'Resultado final',
    body: `${eventTitle}: ${scoreA} - ${scoreB}`,
    type: 'match_finished',
    url: eventUrl,
    tag: 'match-finished',
  }

  showLocalNotification(payload)
  notifyCommunity(communityId, payload)
}

export function notifyBadgeEarned(
  playerId: string,
  badgeName: string,
  badgeEmoji: string
) {
  showLocalNotification({
    title: 'Nueva insignia',
    body: `${badgeEmoji} ${badgeName}`,
    type: 'badge_earned',
    tag: `badge-${badgeName}`,
  })
}
