'use client'

import { useState } from 'react'
import { BADGE_DEFS } from '@/lib/game/badges'
import { BadgeArt } from '@/components/ui/BadgeArt'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

const VITRINA_SLOTS = 5

interface BadgeVitrinaProps {
  playerId: string
  vitrina: string[]
  unlocked: string[]
  accentColor: string
  editable: boolean
}

export function BadgeVitrina({
  playerId,
  vitrina,
  unlocked,
  accentColor,
  editable,
}: BadgeVitrinaProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  const slots: (string | null)[] = Array.from({ length: VITRINA_SLOTS }, (_, i) => vitrina[i] ?? null)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Expositor
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold" style={{ color: accentColor }}>
            {vitrina.length}/{VITRINA_SLOTS}
          </p>
          {editable && (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all active:scale-95 select-none"
              style={{
                background: `${accentColor}22`,
                color: accentColor,
                border: `1px solid ${accentColor}55`,
                minHeight: 28,
              }}
            >
              ✏️ Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {slots.map((key, idx) => {
          const def = key ? BADGE_DEFS[key] : null
          if (def) {
            return (
              <div
                key={idx}
                title={`${def.name} — ${def.desc}`}
                className="flex flex-col items-center justify-center gap-0.5 rounded-m p-2 aspect-square select-none"
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${accentColor}55`,
                  boxShadow: `0 4px 14px ${accentColor}11`,
                }}
              >
                <BadgeArt badgeKey={key!} size={40} />
                <span
                  className="text-[9px] font-bold leading-tight text-center line-clamp-1"
                  style={{ color: 'var(--fg)' }}
                >
                  {def.name}
                </span>
              </div>
            )
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={editable ? () => setEditorOpen(true) : undefined}
              disabled={!editable}
              className="flex flex-col items-center justify-center gap-0.5 rounded-m p-2 aspect-square select-none disabled:cursor-default"
              style={{
                background: 'var(--card)',
                border: '1px dashed var(--border)',
                color: 'var(--muted)',
                opacity: editable ? 1 : 0.5,
              }}
            >
              <span className="text-xl opacity-50">+</span>
              <span className="text-[9px] font-bold leading-tight">Vacío</span>
            </button>
          )
        })}
      </div>

      {editable && editorOpen && (
        <VitrinaEditor
          playerId={playerId}
          current={vitrina}
          unlocked={unlocked}
          accentColor={accentColor}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  )
}

interface VitrinaEditorProps {
  playerId: string
  current: string[]
  unlocked: string[]
  accentColor: string
  onClose: () => void
}

function VitrinaEditor({ playerId, current, unlocked, accentColor, onClose }: VitrinaEditorProps) {
  const [selected, setSelected] = useState<string[]>(() =>
    current.filter(k => unlocked.includes(k)).slice(0, VITRINA_SLOTS),
  )
  const [saving, setSaving] = useState(false)

  function toggle(key: string) {
    setSelected(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= VITRINA_SLOTS) return prev
      return [...prev, key]
    })
  }

  function move(key: string, dir: -1 | 1) {
    setSelected(prev => {
      const idx = prev.indexOf(key)
      if (idx < 0) return prev
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  async function save() {
    if (saving) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('players')
      .update({ vitrina: selected })
      .eq('id', playerId)
    setSaving(false)
    if (error) {
      showToast('No se pudo guardar la vitrina')
      return
    }
    showToast('🖼️ Vitrina actualizada')
    onClose()
  }

  const availableBadges = unlocked.filter(k => BADGE_DEFS[k])

  return (
    <Modal
      open
      onClose={() => { if (!saving) onClose() }}
      title="🖼️ Tu expositor"
      variant="window"
      footer={
        <button
          onClick={save}
          disabled={saving}
          className="w-full h-12 rounded-m font-bold text-sm uppercase tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50 select-none"
          style={{ background: accentColor, color: '#000' }}
        >
          {saving ? 'Guardando...' : '💾 Guardar expositor'}
        </button>
      }
    >
      <div>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
          Elige hasta {VITRINA_SLOTS} insignias para mostrar en tu perfil.
        </p>

        {/* CTA Guardar — siempre visible arriba (el footer puede quedar oculto por teclado) */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full h-11 rounded-m font-bold text-sm uppercase tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50 select-none mb-4"
          style={{ background: accentColor, color: '#000' }}
        >
          {saving ? 'Guardando...' : '💾 Guardar expositor'}
        </button>

        {/* Preview slots (ordenable) */}
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {Array.from({ length: VITRINA_SLOTS }).map((_, i) => {
            const key = selected[i]
            const def = key ? BADGE_DEFS[key] : null
            return (
              <div
                key={i}
                className="relative rounded-m p-1.5 aspect-square flex flex-col items-center justify-center select-none"
                style={{
                  background: 'var(--card)',
                  border: def ? `1px solid ${accentColor}55` : '1px dashed var(--border)',
                }}
              >
                {def ? (
                  <>
                    <BadgeArt badgeKey={key!} size={40} />
                    <span className="text-[8px] font-bold tabular-nums" style={{ color: 'var(--muted)' }}>
                      #{i + 1}
                    </span>
                    <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => move(key!, -1)}
                        disabled={i === 0}
                        aria-label="Mover antes"
                        className="w-4 h-4 rounded text-[9px] leading-none disabled:opacity-30 select-none"
                        style={{ background: 'var(--bg2)', color: 'var(--muted)' }}
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => move(key!, 1)}
                        disabled={i === selected.length - 1}
                        aria-label="Mover después"
                        className="w-4 h-4 rounded text-[9px] leading-none disabled:opacity-30 select-none"
                        style={{ background: 'var(--bg2)', color: 'var(--muted)' }}
                      >
                        ▶
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(key!)}
                      aria-label="Quitar"
                      className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded text-[9px] leading-none select-none"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {i + 1}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Catálogo de disponibles */}
        <div>
          {availableBadges.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>
              Aún no tienes insignias desbloqueadas. ¡Juega partidos para ganarlas!
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 pb-2">
              {availableBadges.map(key => {
                const def = BADGE_DEFS[key]
                const isSel = selected.includes(key)
                const disabled = !isSel && selected.length >= VITRINA_SLOTS
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    disabled={disabled}
                    title={`${def.name} — ${def.desc}`}
                    className="flex flex-col items-center gap-0.5 rounded-m p-2 transition-all active:scale-95 select-none disabled:opacity-40"
                    style={{
                      background: 'var(--card)',
                      border: `1px solid ${isSel ? accentColor : 'var(--border)'}`,
                      boxShadow: isSel ? `0 0 0 2px ${accentColor}55` : undefined,
                    }}
                  >
                    <BadgeArt badgeKey={key} size={38} />
                    <span
                      className="text-[10px] font-bold leading-tight text-center line-clamp-2"
                      style={{ color: isSel ? accentColor : 'var(--fg)' }}
                    >
                      {def.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
