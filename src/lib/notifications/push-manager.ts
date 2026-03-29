import { createClient } from '@/lib/supabase/client'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

/**
 * Convierte base64url a Uint8Array (requerido por PushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

/**
 * Verifica si el navegador soporta Push Notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Estado actual del permiso de notificaciones
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * Pide permiso al usuario para mostrar notificaciones
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  return Notification.requestPermission()
}

/**
 * Suscribe al usuario a push notifications y guarda en Supabase
 */
export async function subscribeToPush(
  playerId: string,
  communityId: string
): Promise<PushSubscription | null> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null

  const permission = await requestPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.ready

  // Verificar si ya existe una suscripción
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  // Guardar en Supabase
  const subJson = subscription.toJSON()
  const supabase = createClient()

  await supabase.from('push_subscriptions').upsert(
    {
      player_id: playerId,
      community_id: communityId,
      endpoint: subscription.endpoint,
      key_auth: subJson.keys?.auth ?? '',
      key_p256dh: subJson.keys?.p256dh ?? '',
    },
    { onConflict: 'endpoint' }
  )

  return subscription
}

/**
 * Elimina la suscripción push del navegador y de Supabase
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()

    const supabase = createClient()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }
}

/**
 * Actualiza las preferencias de notificación del usuario
 */
export async function updatePreferences(
  playerId: string,
  communityId: string,
  preferences: Record<string, boolean>
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('push_subscriptions')
    .update({ preferences })
    .eq('player_id', playerId)
    .eq('community_id', communityId)
}

/**
 * Obtiene las preferencias de notificación del usuario
 */
export async function getPreferences(
  playerId: string,
  communityId: string
): Promise<Record<string, boolean> | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('push_subscriptions')
    .select('preferences')
    .eq('player_id', playerId)
    .eq('community_id', communityId)
    .maybeSingle()

  return data?.preferences ?? null
}
