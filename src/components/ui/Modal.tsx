'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
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
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
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
  }, [])

  const handleTouchEnd = useCallback(() => {
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
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-app rounded-t-l sm:rounded-l p-6 max-h-[90vh] overflow-y-auto overscroll-contain animate-slide-up"
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div
          className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden cursor-grab active:cursor-grabbing"
          style={{ background: 'var(--border)' }}
        />

        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bebas text-2xl tracking-wider">{title}</h2>
            <button
              onClick={onClose}
              className="text-xl leading-none flex items-center justify-center w-11 h-11 rounded-full"
              style={{ color: 'var(--muted)', background: 'var(--card)' }}
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
