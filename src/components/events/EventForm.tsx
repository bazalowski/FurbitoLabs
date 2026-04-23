'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/stores/session'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import { uid } from '@/lib/utils'
import { notifyEventCreated } from '@/lib/notifications/notification-service'
import type { Event, Pista, NewEventForm } from '@/types'

const NEW_PISTA_OPTION = '__new__'

interface EventFormProps {
  communityId: string
  pistas: Pista[]
  event?: Event            // si se provee, es modo edición
  onDone: () => void
  onCancel: () => void
  onPistaCreated?: (pista: Pista) => void
}

const DEFAULTS: NewEventForm = {
  titulo: '', tipo: 'partido', fecha: '', hora: '',
  lugar: '', max_jugadores: 10, notas: '', pista_id: '', abierto: false,
}

export function EventForm({ communityId, pistas, event, onDone, onCancel, onPistaCreated }: EventFormProps) {
  const [form, setForm] = useState<NewEventForm>(
    event
      ? {
          titulo: event.titulo,
          tipo: event.tipo,
          fecha: event.fecha ?? '',
          hora: event.hora ?? '',
          lugar: event.lugar ?? '',
          max_jugadores: event.max_jugadores,
          notas: event.notas ?? '',
          pista_id: event.pista_id ?? '',
          abierto: event.abierto,
        }
      : DEFAULTS
  )
  const [loading, setLoading] = useState(false)
  const [pistaModalOpen, setPistaModalOpen] = useState(false)
  const [pistaName, setPistaName] = useState('')
  const [pistaAddress, setPistaAddress] = useState('')
  const [pistaSaving, setPistaSaving] = useState(false)
  const session = useSession()

  const set = (key: keyof NewEventForm, value: string | number | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  function handlePistaChange(value: string) {
    if (value === NEW_PISTA_OPTION) {
      setPistaModalOpen(true)
      return
    }
    set('pista_id', value)
  }

  function closePistaModal() {
    setPistaModalOpen(false)
    setPistaName('')
    setPistaAddress('')
  }

  async function savePista() {
    const trimmedName = pistaName.trim()
    if (!trimmedName) return
    setPistaSaving(true)
    const supabase = createClient()
    const newId = uid()
    const { data, error } = await supabase
      .from('pistas')
      .insert({
        id: newId,
        community_id: communityId,
        name: trimmedName,
        address: pistaAddress.trim() || null,
        added_by: session.playerId,
      })
      .select()
      .single()
    setPistaSaving(false)
    if (error) {
      showToast('❌ Error al guardar pista')
      return
    }
    showToast('✅ Pista creada')
    set('pista_id', newId)
    if (data && onPistaCreated) onPistaCreated(data as Pista)
    closePistaModal()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) return
    setLoading(true)

    const supabase = createClient()
    const payload = {
      community_id: communityId,
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      fecha: form.fecha || null,
      hora: form.hora || null,
      lugar: form.lugar || null,
      max_jugadores: form.max_jugadores,
      notas: form.notas || null,
      pista_id: form.pista_id || null,
      abierto: form.abierto,
    }

    if (event) {
      await supabase.from('events').update(payload).eq('id', event.id)
      showToast('✅ Evento actualizado')
    } else {
      const newId = uid()
      await supabase.from('events').insert({ id: newId, ...payload })
      showToast('✅ Evento creado')
      notifyEventCreated(
        communityId,
        payload.titulo,
        `/${communityId}/partidos/${newId}`,
        session.playerId ?? ''
      )
    }

    setLoading(false)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Título del evento"
        value={form.titulo}
        onChange={e => set('titulo', e.target.value)}
        placeholder="Partido del viernes"
        required
      />

      <Select label="Tipo" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
        <option value="partido">⚽ Partido</option>
        <option value="entrenamiento">🏃 Entrenamiento</option>
        <option value="otro">📅 Otro</option>
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fecha" type="date"
          value={form.fecha} onChange={e => set('fecha', e.target.value)}
        />
        <Input
          label="Hora" type="time"
          value={form.hora} onChange={e => set('hora', e.target.value)}
        />
      </div>

      <Select
        label="Pista"
        value={form.pista_id}
        onChange={e => handlePistaChange(e.target.value)}
      >
        <option value="">Sin pista vinculada</option>
        {pistas.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
        <option value={NEW_PISTA_OPTION}>+ Nueva pista…</option>
      </Select>

      {!form.pista_id && (
        <Input
          label="Lugar (opcional)"
          value={form.lugar}
          onChange={e => set('lugar', e.target.value)}
          placeholder="Polideportivo, Campo 3..."
        />
      )}

      <Input
        label="Máx. jugadores"
        type="number"
        min={2}
        max={100}
        value={form.max_jugadores}
        onChange={e => set('max_jugadores', parseInt(e.target.value))}
      />

      <Textarea
        label="Notas (opcional)"
        value={form.notas}
        onChange={e => set('notas', e.target.value)}
        placeholder="Info extra, material a llevar..."
        rows={3}
      />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.abierto}
          onChange={e => set('abierto', e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm font-semibold">Visible para otras comunidades</span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Guardando...' : event ? '💾 Guardar' : '✅ Crear evento'}
        </Button>
      </div>

      <Modal open={pistaModalOpen} onClose={closePistaModal} title="📍 Nueva pista">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={pistaName}
            onChange={e => setPistaName(e.target.value)}
            placeholder="Campo Municipal Norte"
            autoFocus
          />
          <Input
            label="Dirección (opcional)"
            value={pistaAddress}
            onChange={e => setPistaAddress(e.target.value)}
            placeholder="Calle Mayor 12, Madrid"
          />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={closePistaModal} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={savePista}
              disabled={pistaSaving || !pistaName.trim()}
              className="flex-1"
            >
              {pistaSaving ? 'Guardando...' : '💾 Guardar'}
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  )
}
