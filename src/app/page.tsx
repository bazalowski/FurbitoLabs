'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/stores/session'
import { COMMUNITY_COLORS, uid, genPlayerCode } from '@/lib/utils'
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay'
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
  const [adminName, setAdminName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Admin PIN
  const [adminPin, setAdminPin] = useState('')

  // Communities list
  const [communities, setCommunities] = useState<Community[]>([])

  // Shake animation flag
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    createClient().from('communities').select('id, name, color, pin').then(({ data }) => {
      if (data) setCommunities(data as Community[])
    })
  }, [])

  const triggerShake = useCallback(() => {
    setShaking(true)
    setTimeout(() => setShaking(false), 400)
  }, [])

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
      triggerShake()
      setJoinLoading(false)
      return
    }

    if (!community) {
      setJoinError('PIN incorrecto. Revisa el código de tu comunidad.')
      triggerShake()
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
        triggerShake()
        setJoinLoading(false)
        return
      }

      const adminIds: string[] = community.admin_ids ?? []
      const isCommAdmin = adminIds.includes(player.id) || community.comm_admin_id === player.id
      login(community.id, community.color, isCommAdmin ? 'admin' : 'player', player.id)
    } else {
      login(community.id, community.color, 'guest')
    }

    router.push(`/${community.id}`)
    setJoinLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newPin.trim() || !adminName.trim()) return
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
      setCreateError(`Error de conexion con Supabase: ${checkError.message}`)
      setCreateLoading(false)
      return
    }

    if (existing) {
      setCreateError('Ese PIN ya esta en uso. Elige otro.')
      setCreateLoading(false)
      return
    }

    // Create community
    const communityId = uid()
    const playerId = uid()
    const playerCode = genPlayerCode()

    const { data: community, error } = await supabase
      .from('communities')
      .insert({
        id: communityId,
        name: newName.trim(),
        pin: newPin.toUpperCase(),
        color: newColor,
        comm_admin_id: playerId,
        admin_ids: [playerId],
      })
      .select()
      .single()

    if (error || !community) {
      console.error('[FURBITO] Error al crear comunidad:', error)
      setCreateError(
        error
          ? `Error Supabase (${error.code}): ${error.message}`
          : 'No se recibieron datos. Intentalo de nuevo.'
      )
      setCreateLoading(false)
      return
    }

    // Create the admin player
    const { error: playerError } = await supabase.from('players').insert({
      id: playerId,
      community_id: communityId,
      name: adminName.trim(),
      code: playerCode,
    })

    if (playerError) {
      console.error('[FURBITO] Error al crear jugador admin:', playerError)
      setCreateError(`Comunidad creada pero error al crear jugador: ${playerError.message}`)
      setCreateLoading(false)
      return
    }

    // Show the player's PIN
    alert(`Tu comunidad ha sido creada!\n\nTu PIN de jugador es: ${playerCode}\n\nGuardalo para poder identificarte.`)

    login(community.id, community.color, 'admin', playerId)
    router.push(`/${community.id}`)
  }

  function handleCommunityCard(c: Community) {
    setPin(c.pin)
    setTab('join')
    // Auto-submit after filling PIN
    setTimeout(() => {
      const form = document.getElementById('join-form') as HTMLFormElement | null
      if (form) form.requestSubmit()
    }, 100)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <OnboardingOverlay />
      <div className="w-full max-w-app">

        {/* Crest */}
        <div className="text-center mb-3">
          <img
            src="/icons/icon.svg"
            alt="FURBITO"
            width={112}
            height={112}
            className="animate-float inline-block"
            style={{ filter: 'drop-shadow(0 6px 24px rgba(168,255,62,0.25))' }}
          />
        </div>

        {/* Wordmark */}
        <div className="text-center mb-1">
          <div
            className="font-bebas text-6xl tracking-widest"
            style={{
              color: 'var(--accent)',
              transform: 'skewX(-8deg)',
              display: 'inline-block',
              textShadow: '0 0 40px rgba(168,255,62,0.3), 0 0 80px rgba(168,255,62,0.15)',
            }}
          >
            FUR<span style={{ color: 'var(--text)' }}>BITO</span>
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-center text-[13px] font-bold mb-1"
          style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}
        >
          Tu app de comunidades de fútbol
        </p>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Introduce el PIN de tu comunidad
        </p>

        {/* Card */}
        <div
          className="rounded-l p-6"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
        >
          {/* Tabs */}
          <div className="flex rounded-m overflow-hidden mb-5" style={{ background: 'var(--card)' }}>
            {(['join', 'create'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] active:scale-[0.97]"
                style={
                  tab === t
                    ? { background: 'var(--accent)', color: '#050d05' }
                    : { color: 'var(--muted)' }
                }
              >
                {t === 'join' ? 'Entrar' : 'Crear'}
              </button>
            ))}
          </div>

          {/* Join form */}
          {tab === 'join' && (
            <form id="join-form" onSubmit={handleJoin} className="space-y-4">
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
                  className={`w-full px-4 py-4 rounded-m text-center text-xl font-bold uppercase tracking-[0.3em] outline-none ${shaking ? 'animate-shake' : ''}`}
                  style={{
                    background: 'var(--card)',
                    border: joinError ? '1px solid var(--red)' : '1px solid var(--border)',
                    color: 'var(--accent)',
                    letterSpacing: '0.3em',
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
                  className="w-full px-4 py-3 rounded-m text-base font-bold uppercase tracking-widest outline-none text-center"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs mt-1 text-center" style={{ color: 'var(--muted)' }}>
                  Déjalo vacío para entrar como invitado
                </p>
              </div>
              {joinError && (
                <p className="text-sm font-semibold text-center" style={{ color: 'var(--red)' }}>{joinError}</p>
              )}
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full py-3.5 rounded-m font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 min-h-[44px] active:scale-[0.97]"
                style={{ background: 'var(--accent)', color: '#050d05' }}
              >
                {joinLoading ? 'Buscando...' : 'ENTRAR'}
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
                  Tu nombre (admin)
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="Ej: Carlos"
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-m text-base font-bold outline-none"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  required
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Seras el administrador de la comunidad
                </p>
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
                      className="w-10 h-10 rounded-full border-2 transition-transform"
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
                className="w-full py-3.5 rounded-m font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 min-h-[44px] active:scale-[0.97]"
                style={{ background: 'var(--accent)', color: '#050d05' }}
              >
                {createLoading ? 'Creando...' : 'Crear comunidad'}
              </button>
            </form>
          )}
        </div>

        {/* Community cards grid */}
        {communities.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-wider mb-3 text-center" style={{ color: 'var(--muted)' }}>
              Comunidades disponibles
            </p>
            <div className="grid grid-cols-2 gap-3">
              {communities.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleCommunityCard(c)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-m text-left transition-all active:scale-[0.97]"
                  style={{
                    background: 'rgba(255,255,255,0.045)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: c.color }}
                  />
                  <span className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          FURBITO v2.1 · Powered by Supabase
        </p>
      </div>
    </div>
  )
}
