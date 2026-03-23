'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/stores/session'
import { COMMUNITY_COLORS, uid, genPlayerCode } from '@/lib/utils'
import type { Community } from '@/types'

type LoginTab = 'join' | 'create'

export default function LoginPage() {
  const router = useRouter()
  const login = useSession(s => s.login)

  const [tab, setTab] = useState<LoginTab>('join')

  // Join tab
  const [pin, setPin] = useState('')
  const [playerCode, setPlayerCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  // Create tab
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newColor, setNewColor] = useState(COMMUNITY_COLORS[0])
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Admin PIN
  const [adminPin, setAdminPin] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setJoinError('')
    setJoinLoading(true)

    const supabase = createClient()

    // Check admin PIN
    if (pin.toUpperCase() === (process.env.NEXT_PUBLIC_ADMIN_PIN ?? 'FURBITO2024')) {
      login('admin', '#ffd700', 'admin')
      router.push('/admin')
      return
    }

    // Find community by PIN
    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('pin', pin.toUpperCase())
      .maybeSingle()

    if (error) {
      console.error('[FURBITO] Error al buscar comunidad:', error)
      setJoinError(`Error de conexión: ${error.message}`)
      setJoinLoading(false)
      return
    }

    if (!community) {
      setJoinError('PIN incorrecto. Revisa el código de tu comunidad.')
      setJoinLoading(false)
      return
    }

    // If player code provided, identify as player
    if (playerCode.trim()) {
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('community_id', community.id)
        .eq('code', playerCode.toUpperCase())
        .maybeSingle()

      if (!player) {
        setJoinError('Código de jugador no encontrado en esta comunidad.')
        setJoinLoading(false)
        return
      }

      const isCommAdmin = community.comm_admin_id === player.id
      login(community.id, community.color, isCommAdmin ? 'admin' : 'player', player.id)
    } else {
      login(community.id, community.color, 'guest')
    }

    router.push(`/${community.id}`)
    setJoinLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newPin.trim()) return
    if (newPin.length < 4) { setCreateError('El PIN debe tener al menos 4 caracteres.'); return }

    setCreateLoading(true)
    setCreateError('')
    const supabase = createClient()

    // Check PIN not already used
    const { data: existing, error: checkError } = await supabase
      .from('communities')
      .select('id')
      .eq('pin', newPin.toUpperCase())
      .maybeSingle()

    if (checkError) {
      console.error('[FURBITO] Error al verificar PIN:', checkError)
      setCreateError(`Error de conexión con Supabase: ${checkError.message}`)
      setCreateLoading(false)
      return
    }

    if (existing) {
      setCreateError('Ese PIN ya está en uso. Elige otro.')
      setCreateLoading(false)
      return
    }

    const { data: community, error } = await supabase
      .from('communities')
      .insert({ id: uid(), name: newName.trim(), pin: newPin.toUpperCase(), color: newColor })
      .select()
      .single()

    if (error || !community) {
      console.error('[FURBITO] Error al crear comunidad:', error)
      setCreateError(
        error
          ? `Error Supabase (${error.code}): ${error.message}`
          : 'No se recibieron datos. Inténtalo de nuevo.'
      )
      setCreateLoading(false)
      return
    }

    login(community.id, community.color, 'guest')
    router.push(`/${community.id}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-app">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-bebas text-5xl tracking-widest" style={{ color: 'var(--accent)' }}>
            FURB<span style={{ color: 'var(--text)' }}>ITO</span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Tu comunidad de fútbol
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-l p-6"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
        >
          {/* Tabs */}
          <div className="flex rounded-m overflow-hidden mb-6" style={{ background: 'var(--card)' }}>
            {(['join', 'create'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wider transition-all"
                style={
                  tab === t
                    ? { background: 'var(--accent)', color: '#050d05' }
                    : { color: 'var(--muted)' }
                }
              >
                {t === 'join' ? '🔐 Entrar' : '➕ Crear'}
              </button>
            ))}
          </div>

          {/* Join form */}
          {tab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                  PIN de comunidad
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Ej: FURIA24"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-m text-base font-bold uppercase tracking-wider outline-none"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                  Tu código de jugador <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={playerCode}
                  onChange={e => setPlayerCode(e.target.value)}
                  placeholder="Ej: AX3K"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-m text-base font-bold uppercase tracking-widest outline-none"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Déjalo vacío para entrar como invitado
                </p>
              </div>
              {joinError && (
                <p className="text-sm font-semibold" style={{ color: 'var(--red)' }}>{joinError}</p>
              )}
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full py-3 rounded-m font-bold text-sm uppercase tracking-wider transition-opacity disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#050d05' }}
              >
                {joinLoading ? 'Buscando...' : '⚽ Entrar'}
              </button>
            </form>
          )}

          {/* Create form */}
          {tab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                  Nombre de la comunidad
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Los Cracks FC"
                  maxLength={40}
                  className="w-full px-4 py-3 rounded-m text-base font-bold outline-none"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                  PIN de acceso (4-10 chars)
                </label>
                <input
                  type="text"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Ej: CRACKS24"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-m text-base font-bold uppercase tracking-wider outline-none"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                  Color de la comunidad
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COMMUNITY_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className="w-8 h-8 rounded-full border-2 transition-transform"
                      style={{
                        background: c,
                        borderColor: newColor === c ? 'white' : 'transparent',
                        transform: newColor === c ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
              {createError && (
                <p className="text-sm font-semibold" style={{ color: 'var(--red)' }}>{createError}</p>
              )}
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3 rounded-m font-bold text-sm uppercase tracking-wider transition-opacity disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#050d05' }}
              >
                {createLoading ? 'Creando...' : '🏟️ Crear comunidad'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          FURBITO v2.0 · Supabase + Vercel
        </p>
      </div>
    </div>
  )
}
