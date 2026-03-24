'use client'

import { useState } from 'react'
import { useSession } from '@/stores/session'
import { usePistas } from '@/hooks/usePistas'
import { PistaMap } from '@/components/pistas/PistaMap'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { uid } from '@/lib/utils'

interface PistasPageProps {
  params: { cid: string }
}

export default function PistasPage({ params }: PistasPageProps) {
  const { cid } = params
  const session = useSession()
  const { pistas, loading, reload } = usePistas(cid)

  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [userLat, setUserLat] = useState<number>()
  const [userLng, setUserLng] = useState<number>()
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null)

  const canAdd = session.role === 'admin' || session.role === 'player'

  function handleMapClick(clickLat: number, clickLng: number) {
    if (!canAdd) return
    setLat(clickLat.toFixed(6))
    setLng(clickLng.toFixed(6))
    setTempMarker({ lat: clickLat, lng: clickLng })
    setAddOpen(true)
  }

  function closeAddModal() {
    setAddOpen(false)
    setTempMarker(null)
  }

  function getMyLocation() {
    if (!navigator.geolocation) { showToast('Geolocalización no disponible'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setLocating(false)
      },
      () => { showToast('No se pudo obtener tu ubicación'); setLocating(false) }
    )
  }

  async function savePista() {
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('pistas').insert({
      id: uid(),
      community_id: cid,
      name: name.trim(),
      address: address || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      added_by: session.playerId,
    })
    if (error) {
      showToast('❌ Error al guardar')
    } else {
      showToast('✅ Pista añadida')
      setName('')
      setAddress('')
      setLat('')
      setLng('')
      setAddOpen(false)
      setTempMarker(null)
      reload()
    }
    setSaving(false)
  }

  return (
    <div className="view-enter">
      <Header
        title={`Pistas (${pistas.length})`}
        right={
          canAdd && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              + Añadir
            </Button>
          )
        }
      />

      <div className="px-4 space-y-4 pt-2">
        {/* Map */}
        <PistaMap
          pistas={pistas}
          userLat={userLat}
          userLng={userLng}
          onMapClick={canAdd ? handleMapClick : undefined}
          tempMarker={tempMarker}
          onTempMarkerClear={closeAddModal}
        />

        {/* Pista list */}
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Cargando...</p>
        ) : pistas.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
            <p className="text-3xl mb-3">🗺️</p>
            <p className="font-bold">Sin pistas registradas</p>
            {canAdd && <p className="text-sm mt-1">Añade la primera pista</p>}
          </div>
        ) : (
          pistas.map(p => (
            <Card key={p.id}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">📍</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{p.name}</p>
                  {p.address && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{p.address}</p>
                  )}
                  {p.lat && p.lng && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Pista Modal */}
      <Modal open={addOpen} onClose={closeAddModal} title="📍 Nueva pista">
        <div className="space-y-4">
          <Input
            label="Nombre de la pista"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Campo Municipal Norte"
            required
          />
          <Input
            label="Dirección (opcional)"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Calle Mayor 12, Madrid"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitud"
              value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder="40.4168"
              type="number"
              step="0.000001"
            />
            <Input
              label="Longitud"
              value={lng}
              onChange={e => setLng(e.target.value)}
              placeholder="-3.7038"
              type="number"
              step="0.000001"
            />
          </div>
          <Button variant="ghost" className="w-full" onClick={getMyLocation} disabled={locating}>
            {locating ? '📡 Obteniendo...' : '📡 Usar mi ubicación actual'}
          </Button>
          <Button className="w-full" onClick={savePista} disabled={saving || !name.trim()}>
            {saving ? 'Guardando...' : '💾 Guardar pista'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
