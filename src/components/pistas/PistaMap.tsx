'use client'

import { useEffect, useRef } from 'react'
import type { Pista } from '@/types'

interface PistaMapProps {
  pistas: Pista[]
  height?: number
  userLat?: number
  userLng?: number
}

export function PistaMap({ pistas, height = 300, userLat, userLng }: PistaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)

  useEffect(() => {
    // Leaflet must run only client-side
    if (typeof window === 'undefined' || !mapRef.current) return
    if (instanceRef.current) return // already initialized

    import('leaflet').then(L => {
      const defaultLat = userLat ?? (pistas[0]?.lat ?? 40.4168)
      const defaultLng = userLng ?? (pistas[0]?.lng ?? -3.7038)

      const map = L.map(mapRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: 13,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      pistas.forEach(p => {
        if (!p.lat || !p.lng) return
        L.marker([p.lat, p.lng])
          .addTo(map)
          .bindPopup(`<b>${p.name}</b>${p.address ? `<br>${p.address}` : ''}`)
      })

      if (userLat && userLng) {
        L.circleMarker([userLat, userLng], { radius: 8, color: '#a8ff3e', fillColor: '#a8ff3e', fillOpacity: 0.4 })
          .addTo(map)
          .bindPopup('Tu ubicación')
      }

      instanceRef.current = map
    })

    return () => {
      instanceRef.current?.remove()
      instanceRef.current = null
    }
  }, [pistas, userLat, userLng])

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: 'var(--radius-m)', overflow: 'hidden' }}
    />
  )
}
