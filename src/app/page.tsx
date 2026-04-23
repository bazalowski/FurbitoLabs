'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/stores/session'
import { COMMUNITY_COLORS, uid, genPlayerCode } from '@/lib/utils'
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay'

type LoginTab = 'join' | 'create'
type Gate = 'chooser' | 'auth'

const GATE_KEY = 'furbito_gate_dismissed'
const GATE_VISITS = 'furbito_gate_visits'

export default function LoginPage() {
  const router = useRouter()
  const login = useSession(s => s.login)

  // Gate inicial: "Usuario nuevo" / "Ya tengo un PIN".
  // La primera vez se muestra siempre; a partir de la segunda el usuario
  // puede marcar "No volver a mostrar" y saltarlo.
  const [gate, setGate] = useState<Gate>('auth')
  const [gateVisits, setGateVisits] = useState(0)
  const [newUserOpen, setNewUserOpen] = useState(false)

  const [tab, setTab] = useState<LoginTab>('join')

  // Join tab — solo PIN de comunidad (código opcional eliminado)
  const [pin, setPin] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  // Create tab
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newColor, setNewColor] = useState(COMMUNITY_COLORS[0])
  const [adminName, setAdminName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Shake animation flag
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = localStorage.getItem(GATE_KEY) === '1'
    const visits = Number(localStorage.getItem(GATE_VISITS) ?? '0')
    setGateVisits(visits)
    if (!dismissed) {
      setGate('chooser')
      localStorage.setItem(GATE_VISITS, String(visits + 1))
    }
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

    // Entra como guest; el usuario introduce su PIN de jugador luego
    // desde el icono 🔑 del layout para identificarse.
    login(community.id, community.color, 'guest')

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

  /* ═════════ Gate inicial ═════════ */
  if (gate === 'chooser') {
    const canDismiss = gateVisits >= 2
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <OnboardingOverlay />
        <div className="w-full max-w-app">

          {/* Crest + wordmark */}
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
          <p
            className="text-center text-[13px] font-bold mb-1"
            style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}
          >
            Tu app de comunidades de fútbol
          </p>
          <p className="text-center text-sm mb-8" style={{ color: 'var(--muted)' }}>
            ¿Cómo quieres empezar?
          </p>

          {/* Chooser cards */}
          <div className="space-y-3">
            <button
              onClick={() => setNewUserOpen(true)}
              className="w-full text-left rounded-l p-5 transition-all active:scale-[0.98] select-none"
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--accent)',
                boxShadow: '0 0 0 3px rgba(168,255,62,0.08), 0 10px 30px rgba(168,255,62,0.12)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">🆕</span>
                <div className="flex-1">
                  <p className="font-bebas text-2xl tracking-wider" style={{ color: 'var(--accent)' }}>
                    Usuario nuevo
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    Únete con el PIN de la comunidad. Te crea tu jugador y tu PIN personal.
                  </p>
                </div>
                <span className="text-lg" style={{ color: 'var(--muted)' }}>{'›'}</span>
              </div>
            </button>

            <button
              onClick={() => setGate('auth')}
              className="w-full text-left rounded-l p-5 transition-all active:scale-[0.98] select-none"
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">🔑</span>
                <div className="flex-1">
                  <p className="font-bebas text-2xl tracking-wider">
                    Ya tengo un PIN
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    Entra directamente con el PIN de tu comunidad.
                  </p>
                </div>
                <span className="text-lg" style={{ color: 'var(--muted)' }}>{'›'}</span>
              </div>
            </button>
          </div>

          {canDismiss && (
            <button
              onClick={() => {
                localStorage.setItem(GATE_KEY, '1')
                setGate('auth')
              }}
              className="w-full mt-4 py-2 text-xs uppercase tracking-wider font-bold active:scale-[0.98] transition-transform select-none"
              style={{ color: 'var(--muted)' }}
            >
              No volver a mostrar
            </button>
          )}

          <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
            FURBITO v2.1 · Powered by Supabase
          </p>
        </div>

        {newUserOpen && (
          <NewUserModal
            onClose={() => setNewUserOpen(false)}
            triggerShake={triggerShake}
          />
        )}
      </div>
    )
  }

  /* ═════════ Login clásico (PIN comunidad) ═════════ */
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
              <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
                Una vez dentro, pulsa 🔑 arriba a la derecha para identificarte con tu PIN personal.
              </p>
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

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          FURBITO v2.1 · Powered by Supabase
        </p>
      </div>
    </div>
  )
}

/* ─────────── Modal: Usuario nuevo ─────────── */

interface NewUserModalProps {
  onClose: () => void
  triggerShake: () => void
}

function NewUserModal({ onClose, triggerShake }: NewUserModalProps) {
  const router = useRouter()
  const login = useSession(s => s.login)

  const [communityPin, setCommunityPin] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [createdCommunityId, setCreatedCommunityId] = useState<string | null>(null)
  const [createdColor, setCreatedColor] = useState<string | null>(null)
  const [createdPlayerId, setCreatedPlayerId] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const nm = name.trim()
    if (nm.length < 2) { setError('Introduce un nombre de al menos 2 caracteres.'); return }
    if (!communityPin.trim()) { setError('Introduce el PIN de la comunidad.'); return }

    setLoading(true)
    const supabase = createClient()

    const { data: community, error: commErr } = await supabase
      .from('communities')
      .select('id, color, pin')
      .eq('pin', communityPin.toUpperCase())
      .maybeSingle()

    if (commErr || !community) {
      setError('PIN de comunidad no encontrado.')
      triggerShake()
      setLoading(false)
      return
    }

    // Evitar duplicados por nombre exacto en la misma comunidad (opcional defensivo)
    const playerId = uid()
    const playerCode = genPlayerCode()

    const { error: insertErr } = await supabase.from('players').insert({
      id: playerId,
      community_id: community.id,
      name: nm,
      code: playerCode,
    })

    if (insertErr) {
      setError(`No se pudo crear el jugador: ${insertErr.message}`)
      setLoading(false)
      return
    }

    setCreatedCode(playerCode)
    setCreatedCommunityId(community.id)
    setCreatedColor(community.color)
    setCreatedPlayerId(playerId)
    setLoading(false)
  }

  function enterAsNewPlayer() {
    if (!createdCommunityId || !createdColor || !createdPlayerId) return
    login(createdCommunityId, createdColor, 'player', createdPlayerId)
    router.push(`/${createdCommunityId}`)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="newuser-title"
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 animate-slide-up"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {!createdCode ? (
          <>
            <h2 id="newuser-title" className="text-lg font-bold text-center">🆕 Usuario nuevo</h2>
            <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
              Pide a tu admin el PIN de la comunidad, elige tu nombre y te crearemos un PIN personal de 4 dígitos.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>
                  PIN de comunidad
                </label>
                <input
                  type="text"
                  value={communityPin}
                  onChange={e => { setCommunityPin(e.target.value); setError('') }}
                  placeholder="Ej: FURIA24"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-m text-center text-base font-bold uppercase tracking-[0.3em] outline-none"
                  style={{
                    background: 'var(--bg2)',
                    border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
                    color: 'var(--accent)',
                  }}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  placeholder="Ej: Carlos"
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-m text-base font-bold outline-none"
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-center font-semibold" style={{ color: 'var(--red)' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-m font-bold text-sm uppercase tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50 select-none"
                style={{ background: 'var(--accent)', color: '#050d05', minHeight: 48 }}
              >
                {loading ? 'Creando…' : 'Crear mi usuario'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-xs uppercase tracking-wide opacity-60 hover:opacity-100 transition-opacity select-none"
                style={{ color: 'var(--muted)', minHeight: 44 }}
              >
                Cancelar
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-center">✅ ¡Listo!</h2>
            <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
              Guarda este PIN — lo necesitas para identificarte como jugador.
            </p>
            <div
              className="rounded-m p-5 text-center"
              style={{ background: 'var(--bg2)', border: '1px solid var(--accent)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Tu PIN de jugador
              </p>
              <p
                className="font-bebas text-5xl tracking-[0.3em] mt-1"
                style={{ color: 'var(--accent)', textShadow: '0 0 20px rgba(168,255,62,0.4)' }}
              >
                {createdCode}
              </p>
            </div>
            <button
              onClick={enterAsNewPlayer}
              className="w-full py-3 rounded-m font-bold text-sm uppercase tracking-wide active:scale-[0.98] transition-transform select-none"
              style={{ background: 'var(--accent)', color: '#050d05', minHeight: 48 }}
            >
              Entrar a la comunidad
            </button>
          </>
        )}
      </div>
    </div>
  )
}
