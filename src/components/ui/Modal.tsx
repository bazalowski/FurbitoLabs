'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  // Close on escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />

      {/* Panel */}
      <div
        className="relative w-full max-w-app rounded-t-l sm:rounded-l p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden" style={{ background: 'var(--border)' }} />

        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bebas text-2xl tracking-wider">{title}</h2>
            <button
              onClick={onClose}
              className="text-xl leading-none"
              style={{ color: 'var(--muted)' }}
            >
              ✕
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
