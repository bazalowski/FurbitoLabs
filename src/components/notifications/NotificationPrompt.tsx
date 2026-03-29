'use client'

interface NotificationPromptProps {
  onAccept: () => void
  onDismiss: () => void
}

/**
 * Modal centrado que pide permiso para enviar notificaciones.
 * Se muestra una vez al jugador identificado.
 */
export function NotificationPrompt({ onAccept, onDismiss }: NotificationPromptProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-prompt-title"
        className="w-full max-w-xs rounded-2xl p-6 flex flex-col items-center gap-4 animate-slide-up"
        style={{
          background: 'var(--bg2, #0a1a0a)',
          border: '1px solid var(--border-a)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <span className="text-4xl select-none" aria-hidden="true">
          {'\uD83D\uDD14'}
        </span>

        <h2
          id="notif-prompt-title"
          className="text-lg font-bold text-center"
          style={{ color: 'var(--fg)' }}
        >
          Activa las notificaciones
        </h2>

        <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
          Te avisamos de nuevos partidos, resultados y logros.
        </p>

        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 cursor-pointer select-none"
            style={{
              background: 'var(--border)',
              color: 'var(--fg)',
              minHeight: '48px',
            }}
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 cursor-pointer select-none"
            style={{
              background: 'var(--comm-color, var(--accent))',
              color: '#050d05',
              minHeight: '48px',
            }}
          >
            Activar
          </button>
        </div>
      </div>
    </div>
  )
}
