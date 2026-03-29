'use client'

import { useEffect, useState } from 'react'
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/notifications/push-manager'

const PROMPT_DISMISSED_KEY = 'furbito_push_dismissed'

interface UsePushNotificationsReturn {
  supported: boolean
  permission: NotificationPermission | 'unsupported'
  subscribed: boolean
  showPrompt: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  dismissPrompt: () => void
}

/**
 * Hook para gestionar push notifications dentro de una comunidad.
 * Solo se activa si el usuario está identificado como jugador.
 */
export function usePushNotifications(
  playerId: string | null,
  communityId: string | null
): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [subscribed, setSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const supported = isPushSupported()

  useEffect(() => {
    if (!supported || !playerId || !communityId) return

    const status = getPermissionStatus()
    setPermission(status)

    // Verificar si ya está suscrito
    if (status === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub)
        })
      })
    }

    // Mostrar prompt solo si no ha sido rechazado/cerrado antes
    if (status === 'default') {
      const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY)
      if (!dismissed) {
        // Esperar 3 segundos para no interrumpir al usuario inmediatamente
        const timer = setTimeout(() => setShowPrompt(true), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [supported, playerId, communityId])

  async function subscribe() {
    if (!playerId || !communityId) return

    try {
      const sub = await subscribeToPush(playerId, communityId)
      if (sub) {
        setSubscribed(true)
        setPermission('granted')
      } else {
        // Permiso denegado o error — actualizar estado
        setPermission(getPermissionStatus())
      }
    } catch {
      setPermission(getPermissionStatus())
    }
    // Siempre cerrar el prompt y marcar como visto
    setShowPrompt(false)
    localStorage.setItem(PROMPT_DISMISSED_KEY, '1')
  }

  async function unsubscribe() {
    await unsubscribeFromPush()
    setSubscribed(false)
  }

  function dismissPrompt() {
    setShowPrompt(false)
    localStorage.setItem(PROMPT_DISMISSED_KEY, '1')
  }

  return {
    supported,
    permission,
    subscribed,
    showPrompt,
    subscribe,
    unsubscribe,
    dismissPrompt,
  }
}
