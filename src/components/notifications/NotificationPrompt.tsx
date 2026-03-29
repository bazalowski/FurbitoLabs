'use client'

interface NotificationPromptProps {
  onAccept: () => void
  onDismiss: () => void
}

/**
 * Banner educativo que pide permiso para enviar notificaciones.
 * Se muestra una vez al jugador identificado.
 */
export function NotificationPrompt({ onAccept, onDismiss }: NotificationPromptProps) {
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-app z-[60] animate-slide-up"
      role="alert"
    >
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          background: 'var(--bg2, #0a1a0a)',
          border: '1px solid var(--border-a)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">
            {'\uD83D\uDD14'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
              Activa las notificaciones
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Te avisamos de nuevos partidos, resultados y logros.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-m text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            style={{
              background: 'var(--card)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              minHeight: '44px',
            }}
          >
            Ahora no
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-m text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            style={{
              background: 'var(--comm-color, var(--accent))',
              color: '#050d05',
              minHeight: '44px',
            }}
          >
            Activar
          </button>
        </div>
      </div>
    </div>
  )
}
