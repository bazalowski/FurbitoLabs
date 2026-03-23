'use client'

import { useEffect, useRef, useState } from 'react'
import type { Pista } from '@/types'

interface PistaMapProps {
  pistas: Pista[]
  height?: number
  userLat?: number
  userLng?: number
}

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTR = '© OpenStreetMap contributors'
const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SAT_ATTR = '© Esri — Source: Esri, Maxar, Earthstar Geographics'

export function PistaMap({ pistas, height = 300, userLat, userLng }: PistaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const [satellite, setSatellite] = useState(false)

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

      const tile = L.tileLayer(OSM_URL, { attribution: OSM_ATTR }).addTo(map)
      tileLayerRef.current = tile

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
      tileLayerRef.current = null
    }
  }, [pistas, userLat, userLng])

  // Swap tile layer when satellite state changes
  useEffect(() => {
    const map = instanceRef.current
    if (!map || !tileLayerRef.current) return

    import('leaflet').then(L => {
      map.removeLayer(tileLayerRef.current)
      const url = satellite ? SAT_URL : OSM_URL
      const attr = satellite ? SAT_ATTR : OSM_ATTR
      const tile = L.tileLayer(url, { attribution: attr }).addTo(map)
      tileLayerRef.current = tile
    })
  }, [satellite])

  return (
    <div style={{ position: 'relative', height: Math.max(height, 250), width: '100%' }}>
      <div
        ref={mapRef}
        style={{ height: Math.max(height, 250), width: '100%', borderRadius: 'var(--radius-m)', overflow: 'hidden', touchAction: 'pan-x pan-y' }}
      />
      {/* Satellite / Map toggle */}
      <button
        onClick={() => setSatellite(s => !s)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          background: 'var(--card, #1a1a1a)',
          border: '2px solid var(--border, #333)',
          borderRadius: 8,
          padding: '10px 12px',
          minHeight: 44,
          minWidth: 44,
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
        title={satellite ? 'Cambiar a mapa' : 'Cambiar a satélite'}
      >
        {satellite ? '\u{1F5FA}\u{FE0F}' : '\u{1F6F0}\u{FE0F}'}
      </button>
    </div>
  )
}
