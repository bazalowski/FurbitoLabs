'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'loading' | 'ready' | 'error'

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')

  async function ensureAnonSession() {
    setStatus('loading')
    setErrorMsg('')

    const supabase = createClient()

    const { data: { user: existing } } = await supabase.auth.getUser()
    if (existing) {
      setStatus('ready')
      return
    }

    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
      return
    }

    setStatus('ready')
  }

  useEffect(() => {
    ensureAnonSession()
  }, [])

  if (status === 'ready') return <>{children}</>

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        background: 'var(--bg, #0a1408)',
        color: 'var(--text, #eaf0d9)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {status === 'loading' && (
        <>
          <div
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '3px solid rgba(168,255,62,0.2)',
              borderTopColor: 'var(--accent, #a8ff3e)',
              animation: 'furbito-spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: 14, opacity: 0.7 }}>Preparando tu sesión…</p>
          <style>{`@keyframes furbito-spin{to{transform:rotate(360deg)}}`}</style>
        </>
      )}

      {status === 'error' && (
        <>
          <p style={{ fontSize: 16, fontWeight: 600 }}>No se pudo iniciar sesión</p>
          <p style={{ fontSize: 13, opacity: 0.75, maxWidth: 360, textAlign: 'center' }}>
            {errorMsg || 'Comprueba tu conexión e inténtalo de nuevo.'}
          </p>
          <button
            onClick={ensureAnonSession}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--accent, #a8ff3e)',
              background: 'transparent',
              color: 'var(--accent, #a8ff3e)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </>
      )}
    </div>
  )
}
