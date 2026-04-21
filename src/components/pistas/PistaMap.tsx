'use client'

import { useEffect, useRef, useState } from 'react'
import type { Pista } from '@/types'

interface PistaMapProps {
  pistas: Pista[]
  height?: number
  userLat?: number
  userLng?: number
  onMapClick?: (lat: number, lng: number) => void
  tempMarker?: { lat: number; lng: number } | null
  onTempMarkerClear?: () => void
}

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTR = '© OpenStreetMap contributors'
const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SAT_ATTR = '© Esri — Source: Esri, Maxar, Earthstar Geographics'

export function PistaMap({ pistas, height = 300, userLat, userLng, onMapClick, tempMarker, onTempMarkerClear }: PistaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const tempMarkerRef = useRef<any>(null)
  const onMapClickRef = useRef(onMapClick)
  const onTempMarkerClearRef = useRef(onTempMarkerClear)
  const leafletRef = useRef<any>(null)
  const [satellite, setSatellite] = useState(false)

  // Keep callback refs up to date without re-creating the map
  onMapClickRef.current = onMapClick
  onTempMarkerClearRef.current = onTempMarkerClear

  useEffect(() => {
    // Leaflet must run only client-side
    if (typeof window === 'undefined' || !mapRef.current) return
    if (instanceRef.current) return // already initialized

    import('leaflet').then(L => {
      leafletRef.current = L
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

      // Click-to-add handler
      map.on('click', (e: any) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng)
        }
      })

      instanceRef.current = map
    })

    return () => {
      instanceRef.current?.remove()
      instanceRef.current = null
      tileLayerRef.current = null
      tempMarkerRef.current = null
      leafletRef.current = null
    }
  }, [pistas, userLat, userLng])

  // Manage temporary marker (red) for click-to-add
  useEffect(() => {
    const map = instanceRef.current
    const L = leafletRef.current
    if (!map || !L) return

    // Remove previous temp marker
    if (tempMarkerRef.current) {
      map.removeLayer(tempMarkerRef.current)
      tempMarkerRef.current = null
    }

    if (tempMarker) {
      const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
      tempMarkerRef.current = L.marker([tempMarker.lat, tempMarker.lng], { icon: redIcon })
        .addTo(map)
        .bindPopup('Nueva pista aqui (click para quitar)')
        .openPopup()
        .on('click', () => {
          if (onTempMarkerClearRef.current) {
            onTempMarkerClearRef.current()
          }
        })
    }
  }, [tempMarker])

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
          boxShadow: 'var(--shadow-depth-1)',
        }}
        title={satellite ? 'Cambiar a mapa' : 'Cambiar a satélite'}
      >
        {satellite ? '\u{1F5FA}\u{FE0F}' : '\u{1F6F0}\u{FE0F}'}
      </button>
    </div>
  )
}
