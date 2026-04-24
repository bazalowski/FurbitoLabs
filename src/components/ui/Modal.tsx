'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /**
   * 'sheet'  — caja auto-ajustable al contenido, centrada (default).
   * 'window' — ventana a pantalla completa en móvil, ocupa 90dvh.
   */
  variant?: 'sheet' | 'window'
  footer?: React.ReactNode
  /** Si se pasa, se intenta enfocar al abrir en vez del primer focusable. */
  initialFocusRef?: RefObject<HTMLElement | null>
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getModalRoot(): HTMLElement {
  let root = document.getElementById('modal-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'modal-root'
    document.body.appendChild(root)
  }
  return root
}

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'sheet',
  footer,
  initialFocusRef,
}: ModalProps) {
  const isWindow = variant === 'window'
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Scroll-lock robusto (iOS Safari friendly)
  useLayoutEffect(() => {
    if (!open) return
    const body = document.body
    const y = window.scrollY
    scrollYRef.current = y
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }
    body.style.position = 'fixed'
    body.style.top = `-${y}px`
    body.style.width = '100%'
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      window.scrollTo(0, scrollYRef.current)
    }
  }, [open])

  // Focus trap + return focus
  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (!panel) return

    const focusInitial = () => {
      const target =
        initialFocusRef?.current ??
        panel.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
        panel
      target.focus({ preventScroll: true })
    }
    // esperar al próximo frame para evitar que el scroll-lock robe el foco
    const raf = requestAnimationFrame(focusInitial)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
      if (focusables.length === 0) {
        e.preventDefault()
        panel.focus({ preventScroll: true })
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus({ preventScroll: true })
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus({ preventScroll: true })
        }
      }
    }
    panel.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      panel.removeEventListener('keydown', onKey)
      triggerRef.current?.focus?.({ preventScroll: true })
    }
  }, [open, initialFocusRef])

  if (!open) return null
  if (typeof window === 'undefined') return null

  const panelClass = isWindow
    ? 'relative w-full max-w-app rounded-l flex flex-col overflow-hidden animate-slide-up h-[90dvh] sm:h-auto sm:max-h-[85dvh] outline-none'
    : 'relative w-full max-w-app rounded-l flex flex-col overflow-hidden animate-slide-up max-h-[90dvh] sm:max-h-[85dvh] outline-none'

  return createPortal(
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
        ref={panelRef}
        tabIndex={-1}
        className={panelClass}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-depth-3)',
        }}
        onClick={(e) => e.stopPropagation()}
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
    </div>,
    getModalRoot(),
  )
}
