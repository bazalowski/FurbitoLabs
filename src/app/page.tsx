'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { lookupCommunityByPin, checkPinAvailable } from '@/lib/supabase/community-lookup'
import { useSession } from '@/stores/session'
import { COMMUNITY_COLORS, uid, genPlayerCode } from '@/lib/utils'
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type LoginTab = 'join' | 'create'
type Gate = 'chooser' | 'auth'

const GATE_KEY = 'furbito_gate_dismissed'
const GATE_VISITS = 'furbito_gate_visits'

export default function LoginPage() {
  const router = useRouter()
  const login = useSession(s => s.login)

  const [gate, setGate] = useState<Gate>('auth')
  const [gateVisits, setGateVisits] = useState(0)
  const [newUserOpen, setNewUserOpen] = useState(false)

  const [tab, setTab] = useState<LoginTab>('join')

  const [pin, setPin] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newColor, setNewColor] = useState(COMMUNITY_COLORS[0])
  const [adminName, setAdminName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

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

    const result = await lookupCommunityByPin(pin)

    if (!result.ok) {
      if (result.error === 'rate_limited') {
        setJoinError('Demasiados intentos. Espera un minuto e inténtalo de nuevo.')
      } else if (result.error === 'not_found') {
        setJoinError('PIN incorrecto. Revisa el código de tu comunidad.')
      } else {
        setJoinError('Error de conexión. Inténtalo de nuevo.')
      }
      triggerShake()
      setJoinLoading(false)
      return
    }

    login(result.data.id, result.data.color, 'guest')
    router.push(`/${result.data.id}`)
    setJoinLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newPin.trim() || !adminName.trim()) return
    if (newPin.length < 4) { setCreateError('El PIN debe tener al menos 4 caracteres.'); return }

    setCreateLoading(true)
    setCreateError('')
    const supabase = createClient()

    const check = await checkPinAvailable(newPin)
    if (!check.ok) {
      setCreateError(
        check.error === 'rate_limited'
          ? 'Demasiados intentos. Espera un minuto.'
          : 'Error de conexión. Inténtalo de nuevo.',
      )
      setCreateLoading(false)
      return
    }
    if (!check.available) {
      setCreateError('Ese PIN ya está en uso. Elige otro.')
      setCreateLoading(false)
      return
    }

    const communityId = uid()
    const playerId = uid()
    const playerCode = genPlayerCode()

    const { error } = await supabase
      .from('communities')
      .insert({
        id: communityId,
        name: newName.trim(),
        pin: newPin.toUpperCase(),
        color: newColor,
        comm_admin_id: playerId,
        admin_ids: [playerId],
      })

    if (error) {
      console.error('[FURBITO] Error al crear comunidad:', error)
      setCreateError(`Error Supabase (${error.code}): ${error.message}`)
      setCreateLoading(false)
      return
    }

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

    alert(`¡Tu comunidad ha sido creada!\n\nTu PIN de jugador es: ${playerCode}\n\nGuárdalo para poder identificarte.`)

    login(communityId, newColor, 'admin', playerId)
    router.push(`/${communityId}`)
  }

  /* ═════════ Gate inicial ═════════ */
  if (gate === 'chooser') {
    const canDismiss = gateVisits >= 2
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <OnboardingOverlay />
        <div className="w-full max-w-app">
          <LogoBlock />
          <p className="text-center text-sm mb-8" style={{ color: 'var(--muted)' }}>
            ¿Cómo quieres empezar?
          </p>

          {/* Chooser cards */}
          <div className="space-y-3">
            <button
              onClick={() => setNewUserOpen(true)}
              className="surface-arena hairline-top w-full text-left p-5 transition-all active:scale-[0.98] select-none block"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none" aria-hidden="true">🆕</span>
                <div className="flex-1">
                  <p className="font-bebas text-2xl leading-none tracking-display" style={{ color: 'var(--accent)' }}>
                    Usuario nuevo
                  </p>
                  <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                    Únete con el PIN de la comunidad. Te crea tu jugador y tu PIN personal.
                  </p>
                </div>
                <span className="text-lg" style={{ color: 'var(--accent)' }} aria-hidden="true">›</span>
              </div>
            </button>

            <button
              onClick={() => setGate('auth')}
              className="surface-calm w-full text-left p-5 transition-all active:scale-[0.98] select-none block"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none" aria-hidden="true">🔑</span>
                <div className="flex-1">
                  <p className="font-bebas text-2xl leading-none tracking-display">
                    Ya tengo un PIN
                  </p>
                  <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                    Entra directamente con el PIN de tu comunidad.
                  </p>
                </div>
                <span className="text-lg" style={{ color: 'var(--muted)' }} aria-hidden="true">›</span>
              </div>
            </button>
          </div>

          {canDismiss && (
            <button
              onClick={() => {
                localStorage.setItem(GATE_KEY, '1')
                setGate('auth')
              }}
              className="w-full mt-4 py-2 font-barlow text-[10px] font-bold uppercase tracking-widest active:scale-[0.98] transition-transform select-none"
              style={{ color: 'var(--muted)' }}
            >
              No volver a mostrar
            </button>
          )}

          <Footer />
        </div>

        <NewUserModal
          open={newUserOpen}
          onClose={() => setNewUserOpen(false)}
          triggerShake={triggerShake}
        />
      </div>
    )
  }

  /* ═════════ Login clásico (PIN comunidad) ═════════ */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <OnboardingOverlay />
      <div className="w-full max-w-app">
        <LogoBlock />
        <p className="text-center text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Introduce el PIN de tu comunidad
        </p>

        {/* Card */}
        <div className="surface-calm p-6">
          {/* Tabs */}
          <div className="flex rounded-m overflow-hidden mb-5" style={{ background: 'var(--card)' }}>
            {(['join', 'create'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 font-barlow text-[10px] font-bold uppercase tracking-widest transition-all min-h-[44px] active:scale-[0.97]"
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
                <label className="block font-barlow text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>
                  PIN de comunidad
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Ej: FURIA24"
                  maxLength={20}
                  data-autofocus
                  className={`w-full px-4 py-4 rounded-m text-center text-xl font-bold uppercase outline-none ${shaking ? 'animate-shake' : ''}`}
                  style={{
                    background: 'var(--card)',
                    border: joinError ? '1px solid var(--red)' : '1px solid var(--border)',
                    color: 'var(--accent)',
                    letterSpacing: '0.3em',
                    fontSize: '20px',
                  }}
                  required
                />
              </div>
              {joinError && (
                <p className="font-mono text-[12px] font-semibold text-center" style={{ color: 'var(--red)' }}>{joinError}</p>
              )}
              <Button type="submit" disabled={joinLoading} className="w-full">
                {joinLoading ? 'Buscando...' : 'Entrar'}
              </Button>
              <p className="font-mono text-center text-[11px]" style={{ color: 'var(--muted)' }}>
                Una vez dentro, pulsa 🔑 arriba a la derecha para identificarte con tu PIN personal.
              </p>
            </form>
          )}

          {/* Create form */}
          {tab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nombre de la comunidad"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej: Los Cracks FC"
                maxLength={40}
                required
              />
              <Input
                label="PIN de acceso (4-10 chars)"
                type="text"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                placeholder="Ej: CRACKS24"
                maxLength={10}
                className="uppercase tracking-widest"
                required
              />
              <div>
                <Input
                  label="Tu nombre (admin)"
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="Ej: Carlos"
                  maxLength={30}
                  required
                  hint="Serás el administrador de la comunidad."
                />
              </div>
              <div>
                <label className="block font-barlow text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>
                  Color de la comunidad
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COMMUNITY_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      aria-label={`Color ${c}`}
                      aria-pressed={newColor === c}
                      className="w-10 h-10 rounded-full border-2 transition-transform"
                      style={{
                        background: c,
                        borderColor: newColor === c ? 'var(--text)' : 'transparent',
                        transform: newColor === c ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: newColor === c ? `0 0 0 3px ${c}44` : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
              {createError && (
                <p className="font-mono text-[12px] font-semibold" style={{ color: 'var(--red)' }}>{createError}</p>
              )}
              <Button type="submit" disabled={createLoading} className="w-full">
                {createLoading ? 'Creando...' : 'Crear comunidad'}
              </Button>
            </form>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}

/** Hero logotipo + wordmark + tagline — arena-style para la primera impresión */
function LogoBlock() {
  return (
    <>
      <div className="text-center mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
          className="font-bebas text-6xl tracking-display leading-none"
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
        className="text-center font-barlow text-[11px] font-bold uppercase tracking-widest mt-2"
        style={{ color: 'var(--accent)' }}
      >
        Partidos, equipos y ranking. Sin WhatsApp.
      </p>
    </>
  )
}

/** Footer con links legales + versión — requerido por stores */
function Footer() {
  return (
    <div className="text-center mt-6 space-y-2">
      <p className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
        FURBITO v2.1 · Powered by Supabase
      </p>
      <div className="flex items-center justify-center gap-1 font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
        <a href="/privacidad" className="underline-offset-2 hover:underline">Privacidad</a>
        <span className="divider-dot" aria-hidden="true" />
        <a href="/terminos" className="underline-offset-2 hover:underline">Términos</a>
        <span className="divider-dot" aria-hidden="true" />
        <a href="/ayuda" className="underline-offset-2 hover:underline">Ayuda</a>
      </div>
    </div>
  )
}

/* ─────────── Modal: Usuario nuevo ─────────── */

interface NewUserModalProps {
  open: boolean
  onClose: () => void
  triggerShake: () => void
}

function NewUserModal({ open, onClose, triggerShake }: NewUserModalProps) {
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

    const lookup = await lookupCommunityByPin(communityPin)
    if (!lookup.ok) {
      setError(
        lookup.error === 'rate_limited'
          ? 'Demasiados intentos. Espera un minuto.'
          : 'PIN de comunidad no encontrado.',
      )
      triggerShake()
      setLoading(false)
      return
    }

    const playerId = uid()
    const playerCode = genPlayerCode()

    const { error: insertErr } = await supabase.from('players').insert({
      id: playerId,
      community_id: lookup.data.id,
      name: nm,
      code: playerCode,
    })

    if (insertErr) {
      setError(`No se pudo crear el jugador: ${insertErr.message}`)
      setLoading(false)
      return
    }

    setCreatedCode(playerCode)
    setCreatedCommunityId(lookup.data.id)
    setCreatedColor(lookup.data.color)
    setCreatedPlayerId(playerId)
    setLoading(false)
  }

  function enterAsNewPlayer() {
    if (!createdCommunityId || !createdColor || !createdPlayerId) return
    login(createdCommunityId, createdColor, 'player', createdPlayerId)
    router.push(`/${createdCommunityId}`)
  }

  return (
    <Modal
      open={open}
      onClose={() => { if (!loading) onClose() }}
      title="🆕 Usuario nuevo"
      footer={
        !createdCode ? (
          <Button type="submit" form="newuser-form" disabled={loading} className="w-full">
            {loading ? 'Creando…' : 'Crear mi usuario'}
          </Button>
        ) : (
          <Button className="w-full" onClick={enterAsNewPlayer}>
            Entrar a la comunidad
          </Button>
        )
      }
    >
      {!createdCode ? (
        <>
          <p className="font-mono text-[11px] mb-4" style={{ color: 'var(--muted)' }}>
            Pide a tu admin el PIN de la comunidad, elige tu nombre y te crearemos un PIN personal de 4 dígitos.
          </p>
          <form id="newuser-form" onSubmit={submit} className="space-y-3">
            <div>
              <label className="block font-barlow text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>
                PIN de comunidad
              </label>
              <input
                type="text"
                value={communityPin}
                onChange={e => { setCommunityPin(e.target.value); setError('') }}
                placeholder="Ej: FURIA24"
                maxLength={20}
                data-autofocus
                className="w-full px-4 py-3 rounded-m text-center font-bold uppercase outline-none"
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
                  color: 'var(--accent)',
                  letterSpacing: '0.3em',
                  fontSize: '16px',
                }}
                required
              />
            </div>
            <Input
              label="Tu nombre"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Ej: Carlos"
              maxLength={30}
              required
            />
            {error && (
              <p className="font-mono text-[11px] text-center font-semibold" style={{ color: 'var(--red)' }}>{error}</p>
            )}
          </form>
        </>
      ) : (
        <>
          <p className="font-mono text-[11px] text-center mb-4" style={{ color: 'var(--muted)' }}>
            Guarda este PIN — lo necesitas para identificarte como jugador.
          </p>
          <div className="surface-arena p-5 text-center hairline-top">
            <p className="font-barlow text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Tu PIN de jugador
            </p>
            <p
              className="font-mono text-5xl font-bold tabular-nums mt-2"
              style={{ color: 'var(--accent)', letterSpacing: '0.3em' }}
            >
              {createdCode}
            </p>
          </div>
        </>
      )}
    </Modal>
  )
}
