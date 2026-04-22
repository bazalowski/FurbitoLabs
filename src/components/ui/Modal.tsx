'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /**
   * 'sheet'  — caja auto-ajustable al contenido, centrada (default).
   * 'window' — ventana a pantalla completa en móvil, ocupa 90vh.
   */
  variant?: 'sheet' | 'window'
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, variant = 'sheet', footer }: ModalProps) {
  const isWindow = variant === 'window'

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const panelClass = isWindow
    ? 'relative w-full max-w-app rounded-l flex flex-col overflow-hidden animate-slide-up h-[90vh] sm:h-auto sm:max-h-[85vh]'
    : 'relative w-full max-w-app rounded-l flex flex-col overflow-hidden animate-slide-up max-h-[90vh] sm:max-h-[85vh]'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-3 py-[max(env(safe-area-inset-top,0px),0.5rem)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={onClose}
    >
      <div
        className="absolute inset-0 animate-fade-in"
        aria-hidden="true"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      />

      <div
        className={panelClass}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-depth-3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {title !== undefined && (
          <div
            className="flex items-center justify-between px-5 py-4 border-b shrink-0"
            style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
          >
            <h2 id="modal-title" className="font-bebas text-2xl tracking-wider truncate pr-2">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="text-lg leading-none flex items-center justify-center w-11 h-11 shrink-0 rounded-full cursor-pointer active:scale-95 transition-transform"
              style={{ color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              ✕
            </button>
          </div>
        )}

        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: footer ? '1.25rem' : 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="px-5 py-3 border-t shrink-0"
            style={{
              background: 'var(--bg2)',
              borderColor: 'var(--border)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
