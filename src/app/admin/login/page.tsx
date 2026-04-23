'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/stores/session'

export default function AdminLoginPage() {
  const router = useRouter()
  const session = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Cerrar la sesión anónima actual antes de hacer login real:
    // signInWithPassword sustituye la sesión pero solo si no hay
    // conflicto con anon_users de auth.users.
    await supabase.auth.signOut()

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInErr) {
      setError('Credenciales incorrectas.')
      setLoading(false)
      // Restauramos sesión anónima para que la app siga usable
      await supabase.auth.signInAnonymously()
      return
    }

    // Marcamos el session store con rol super-admin
    await session.login('admin', '#ffd700', 'admin')

    router.replace('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1
          className="font-bebas text-4xl tracking-widest text-center mb-6"
          style={{ color: 'var(--accent)' }}
        >
          Panel Admin
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={loading}
            className="w-full rounded-l px-4 py-3 text-base"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
            className="w-full rounded-l px-4 py-3 text-base"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />

          {error && (
            <p className="text-sm" style={{ color: '#ff6b6b' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-l py-3 font-bebas text-xl tracking-wider transition-opacity"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
              opacity: loading || !email || !password ? 0.5 : 1,
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="text-center pt-3">
            <Link
              href="/"
              className="text-sm"
              style={{ color: 'var(--muted)' }}
            >
              ← Volver
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
