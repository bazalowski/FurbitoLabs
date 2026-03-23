'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'furbito_theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY) as 'dark' | 'light' | null
    const initial = saved ?? 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button
      onClick={toggle}
      className="rounded-m font-bold text-sm transition-opacity"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        padding: '10px 16px',
        cursor: 'pointer',
        color: 'var(--text)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>{theme === 'dark' ? '\uD83C\uDF19 Modo oscuro' : '\u2600\uFE0F Modo claro'}</span>
      <span
        style={{
          fontSize: 12,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
      </span>
    </button>
  )
}
