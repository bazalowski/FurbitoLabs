/**
 * Capa de alto nivel para emitir notificaciones.
 *
 * - Local (showLocalNotification): avisos instantáneos para el dispositivo
 *   actual cuando la app está en primer plano.
 * - Push real (notifyCommunity / notifyPlayer): invoca la Edge Function
 *   send-push, que firma con VAPID y envía a los endpoints suscritos.
 */

import { createClient } from '@/lib/supabase/client'

export type NotificationType =
  | 'event_created'
  | 'event_reminder'
  | 'match_finished'
  | 'badge_earned'
  | 'mvp_selected'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  tag?: string
  url?: string
  type: NotificationType
}

const DEFAULT_ICON = '/icons/icon-192x192.png'

/**
 * Muestra una notificación local (cuando la app está en primer plano).
 * No requiere red — usa la Notification API del navegador.
 */
export function showLocalNotification(payload: NotificationPayload): void {
  if (typeof window === 'undefined') return
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

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

async function invokeSendPush(body: Record<string, unknown>): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase.functions.invoke('send-push', { body })
    if (error) console.warn('[FURBITO Push] send-push error:', error.message)
  } catch (err) {
    console.warn('[FURBITO Push] invoke failed:', err)
  }
}

/**
 * Envía push a todos los suscriptores de una comunidad.
 */
export async function notifyCommunity(
  communityId: string,
  payload: NotificationPayload,
  excludePlayerId?: string
): Promise<void> {
  await invokeSendPush({
    community_id: communityId,
    title: payload.title,
    body: payload.body,
    url: payload.url,
    type: payload.type,
    icon: payload.icon,
    exclude_player_id: excludePlayerId,
  })
}

/**
 * Envía push a todos los dispositivos de un jugador concreto.
 */
export async function notifyPlayer(
  playerId: string,
  payload: NotificationPayload
): Promise<void> {
  await invokeSendPush({
    target_player_id: playerId,
    title: payload.title,
    body: payload.body,
    url: payload.url,
    type: payload.type,
    icon: payload.icon,
  })
}

// ── Helpers por tipo de evento ────────────────────────────────────────

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

  // Confirmación local inmediata al creador
  showLocalNotification({
    ...payload,
    title: 'Partido creado',
    body: `"${eventTitle}" publicado`,
  })

  // Push real al resto de la comunidad
  void notifyCommunity(communityId, payload, creatorPlayerId)
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
  void notifyCommunity(communityId, payload)
}

export function notifyBadgeEarned(
  playerId: string,
  badgeName: string,
  badgeEmoji: string,
  url?: string
) {
  const payload: NotificationPayload = {
    title: 'Nueva insignia',
    body: `${badgeEmoji} ${badgeName}`,
    type: 'badge_earned',
    tag: `badge-${badgeName}`,
    url,
  }

  // Fallback local (solo útil si el jugador es el que está viendo la app)
  showLocalNotification(payload)

  // Push real a todos los dispositivos del jugador que ganó la insignia
  void notifyPlayer(playerId, payload)
}

export function notifyMvpSelected(
  playerId: string,
  eventTitle: string,
  eventUrl: string
) {
  const payload: NotificationPayload = {
    title: '👑 ¡Eres MVP!',
    body: `Elegido MVP en "${eventTitle}"`,
    type: 'mvp_selected',
    tag: 'mvp-selected',
    url: eventUrl,
  }

  showLocalNotification(payload)
  void notifyPlayer(playerId, payload)
}
