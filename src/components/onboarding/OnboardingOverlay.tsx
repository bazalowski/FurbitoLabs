'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'furbito_onboarding_done'

interface Step {
  icon: string
  title: string
  description: string
}

const steps: Step[] = [
  {
    icon: '\u26BD',
    title: 'Bienvenido a FURBITO',
    description: 'Organiza partidos con tus amigos',
  },
  {
    icon: '\u2B50',
    title: 'Todo lo que necesitas',
    description: 'Crea eventos, genera equipos, gana insignias',
  },
  {
    icon: '\uD83D\uDE80',
    title: '\u00A1Empieza ya!',
    description: 'Empieza creando o uni\u00E9ndote a una comunidad',
  },
]

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)
  const [fadeClass, setFadeClass] = useState<'in' | 'out'>('in')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setVisible(true)
  }, [])

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function goTo(next: number) {
    setFadeClass('out')
    setTimeout(() => {
      setCurrent(next)
      setFadeClass('in')
    }, 200)
  }

  if (!visible) return null

  const step = steps[current]
  const isLast = current === steps.length - 1

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(5, 13, 5, 0.96)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          opacity: fadeClass === 'in' ? 1 : 0,
          transition: 'opacity 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 360,
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 24 }}>{step.icon}</div>
        <h2
          className="font-bebas"
          style={{
            fontSize: 36,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            marginBottom: 8,
          }}
        >
          {step.title}
        </h2>
        <p
          style={{
            fontSize: 15,
            color: 'var(--muted)',
            lineHeight: 1.5,
          }}
        >
          {step.description}
        </p>
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', gap: 8, marginTop: 40 }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? 'var(--accent)' : 'var(--border)',
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 40, width: '100%', maxWidth: 320 }}>
        {!isLast && (
          <button
            onClick={finish}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 'var(--radius-m)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            Saltar
          </button>
        )}
        <button
          onClick={() => (isLast ? finish() : goTo(current + 1))}
          style={{
            flex: isLast ? undefined : 1,
            width: isLast ? '100%' : undefined,
            padding: '12px 0',
            borderRadius: 'var(--radius-m)',
            background: 'var(--accent)',
            color: '#050d05',
            fontWeight: 700,
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isLast ? 'Empezar' : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}
