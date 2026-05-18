'use client'

// Boundary global de Next 14 — captura errores que escapan a un layout
// específico. Sentry intercepta el error en `useEffect` y muestra un
// fallback minimalista para que el usuario pueda recargar.

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#050d05', color: '#e5e5e5', minHeight: '100vh', margin: 0, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <p style={{ fontSize: 48, margin: 0 }}>⚠️</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '1rem 0 0.5rem' }}>Algo se ha roto</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 1.5rem' }}>
            El error ha quedado registrado. Vuelve a intentarlo en un momento.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 12,
              border: 'none',
              background: '#a8ff3e',
              color: '#050d05',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
