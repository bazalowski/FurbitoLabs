'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /**
   * 'sheet'  — bottom-sheet en móvil, centrado en desktop (default).
   * 'window' — ventana interior centrada, ocupa la pantalla en móvil.
   */
  variant?: 'sheet' | 'window'
}

export function Modal({ open, onClose, title, children, variant = 'sheet' }: ModalProps) {
  const isWindow = variant === 'window'
  const panelRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef<{
    startY: number
    currentY: number
    startTime: number
    dragging: boolean
  }>({ startY: 0, currentY: 0, startTime: 0, dragging: false })
  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isWindow) return
    const panel = panelRef.current
    if (!panel) return

    // Only allow drag from the top 48px (drag handle area)
    const rect = panel.getBoundingClientRect()
    const touchY = e.touches[0].clientY
    if (touchY - rect.top > 48) return

    touchRef.current = {
      startY: e.touches[0].clientY,
      currentY: e.touches[0].clientY,
      startTime: Date.now(),
      dragging: true,
    }
  }, [isWindow])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isWindow) return
    if (!touchRef.current.dragging) return
    const panel = panelRef.current
    const backdrop = backdropRef.current
    if (!panel) return

    const currentY = e.touches[0].clientY
    touchRef.current.currentY = currentY
    const deltaY = currentY - touchRef.current.startY

    // Only allow dragging down
    if (deltaY < 0) {
      panel.style.transform = 'translateY(0)'
      if (backdrop) backdrop.style.opacity = '1'
      return
    }

    panel.style.transition = 'none'
    panel.style.transform = `translateY(${deltaY}px)`

    // Decrease backdrop opacity proportionally
    if (backdrop) {
      const progress = Math.min(deltaY / 300, 1)
      backdrop.style.opacity = `${1 - progress * 0.7}`
    }
  }, [isWindow])

  const handleTouchEnd = useCallback(() => {
    if (isWindow) return
    if (!touchRef.current.dragging) return
    touchRef.current.dragging = false

    const panel = panelRef.current
    const backdrop = backdropRef.current
    if (!panel) return

    const deltaY = touchRef.current.currentY - touchRef.current.startY
    const elapsed = Date.now() - touchRef.current.startTime
    const velocity = deltaY / Math.max(elapsed, 1)

    if (deltaY > 100 || velocity > 0.5) {
      // Dismiss: animate out then close
      panel.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 1, 1)'
      panel.style.transform = 'translateY(100%)'
      if (backdrop) {
        backdrop.style.transition = 'opacity 0.25s ease'
        backdrop.style.opacity = '0'
      }
      setTimeout(onClose, 250)
    } else {
      // Snap back
      panel.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
      panel.style.transform = 'translateY(0)'
      if (backdrop) {
        backdrop.style.transition = 'opacity 0.3s ease'
        backdrop.style.opacity = '1'
      }
    }
  }, [onClose, isWindow])

  // Body scroll lock mientras el modal está abierto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const rootClass = isWindow
    ? 'fixed inset-0 z-[100] flex items-center justify-center px-3'
    : 'fixed inset-0 z-[100] flex items-end justify-center sm:items-center'

  const panelClass = isWindow
    ? 'relative w-full max-w-app max-h-[92vh] h-[92vh] sm:h-auto sm:max-h-[88vh] rounded-l overflow-y-auto overscroll-contain animate-slide-up flex flex-col'
    : 'relative w-full max-w-app rounded-t-l sm:rounded-l p-6 max-h-[90vh] overflow-y-auto overscroll-contain animate-slide-up'

  const panelStyle: React.CSSProperties = isWindow
    ? {
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-depth-3)',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }
    : {
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-depth-3)',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }

  return (
    <div
      className={rootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 animate-fade-in"
        aria-hidden="true"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={panelClass}
        style={panelStyle}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isWindow ? (
          <>
            {/* Sticky header con X — siempre visible, no se tapa con scroll */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
              style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
            >
              <h2 id="modal-title" className="font-bebas text-2xl tracking-wider">
                {title || ''}
              </h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="text-lg leading-none flex items-center justify-center w-11 h-11 rounded-full cursor-pointer active:scale-95 transition-transform"
                style={{ color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                ✕
              </button>
            </div>
            <div
              className="flex-1 px-5 py-5"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {children}
            </div>
          </>
        ) : (
          <>
            {/* Drag handle */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden cursor-grab active:cursor-grabbing"
              style={{ background: 'var(--border)' }}
            />

            {title && (
              <div className="flex items-center justify-between mb-5">
                <h2 id="modal-title" className="font-bebas text-2xl tracking-wider">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="text-xl leading-none flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
                  style={{ color: 'var(--muted)', background: 'var(--card)' }}
                >
                  ✕
                </button>
              </div>
            )}

            {children}
          </>
        )}
      </div>
    </div>
  )
}
