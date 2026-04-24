'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { usePlayer } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { createClient } from '@/lib/supabase/client'
import { isPlayerAdmin } from '@/stores/session'
import { rememberPlayer, forgetPlayer } from '@/lib/remembered-player'
import { BottomNav } from '@/components/layout/BottomNav'
import { ToastProvider, showToast } from '@/components/ui/Toast'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt'

interface CommunityLayoutProps {
  children: React.ReactNode
  params: { cid: string }
}

export default function CommunityLayout({ children, params }: CommunityLayoutProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()
  const { player } = usePlayer(session.playerId)
  const { community } = useCommunity(session.communityId)

  // PIN login modal state
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  // Reveal progresivo: al tipear se muestra brevemente el último dígito y luego
  // se enmascara. El resto siempre van con •. Paste → sin reveal.
  const [pinRevealIdx, setPinRevealIdx] = useState<number | null>(null)

  // Exit confirmation modal state
  const [showExitModal, setShowExitModal] = useState(false)

  // Push notifications
  const push = usePushNotifications(session.playerId, session.communityId)

  function handleExit() {
    forgetPlayer(cid)
    session.logout()
    router.push('/')
  }

  // Redirect to login if no active community in session
  useEffect(() => {
    if (!session.communityId || session.communityId !== cid) {
      router.replace('/')
    }
  }, [session.communityId, cid, router])

  // Apply community color CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--comm-color', session.communityColor)
    return () => {
      document.documentElement.style.setProperty('--comm-color', '#a8ff3e')
    }
  }, [session.communityColor])

  // Escucha evento global para abrir el modal PIN desde cualquier página
  useEffect(() => {
    const handler = () => setShowPinModal(true)
    window.addEventListener('furbito:open-pin', handler)
    return () => window.removeEventListener('furbito:open-pin', handler)
  }, [])

  // Enmascarar dígito recién tipeado tras 650ms (patrón estilo iOS)
  useEffect(() => {
    if (pinRevealIdx === null) return
    const t = setTimeout(() => setPinRevealIdx(null), 650)
    return () => clearTimeout(t)
  }, [pinRevealIdx])

  // Si el modal se cierra, resetea el reveal
  useEffect(() => {
    if (!showPinModal) setPinRevealIdx(null)
  }, [showPinModal])

  async function handlePinSubmit() {
    if (pinInput.length !== 4) {
      setPinError('El PIN debe tener 4 digitos')
      return
    }

    setPinLoading(true)
    setPinError('')

    try {
      const supabase = createClient()
      const { data: foundPlayer, error } = await supabase
        .from('players')
        .select('*')
        .eq('community_id', cid)
        .eq('code', pinInput)
        .single()

      if (error || !foundPlayer) {
        setPinError('PIN no encontrado')
        setPinLoading(false)
        return
      }

      // Fetch fresh community data to check admin_ids
      const { data: freshCommunity } = await supabase
        .from('communities')
        .select('comm_admin_id, admin_ids')
        .eq('id', cid)
        .single()

      // Determine role: check if this player is a community admin (admin_ids array or legacy comm_admin_id)
      const role = isPlayerAdmin(foundPlayer.id, freshCommunity ?? community) ? 'admin' : 'player'
      rememberPlayer(cid, foundPlayer.id)
      session.login(cid, session.communityColor, role, foundPlayer.id)

      setShowPinModal(false)
      setPinInput('')
      setPinError('')
      showToast(`Bienvenido, ${foundPlayer.name}!`)
    } catch {
      setPinError('Error de conexion')
    } finally {
      setPinLoading(false)
    }
  }

  if (!session.communityId) return null

  return (
    <div className="max-w-app mx-auto min-h-screen relative flex flex-col">
      {/* PIN / Exit — alineados al borde derecho del contenedor centrado */}
      <div
        className="fixed top-0 z-50 flex items-center gap-1 pr-2"
        style={{
          height: 'var(--header-h)',
          right: 'max(0px, calc((100vw - 500px) / 2))',
        }}
      >
        <button
          onClick={() => setShowPinModal(true)}
          aria-label="Cambiar jugador"
          title="Cambiar jugador"
          className="w-10 h-10 rounded-full flex items-center justify-center text-base active:scale-90 transition-opacity"
          style={{ color: 'var(--muted)', opacity: 0.5 }}
        >
          🔑
        </button>
        <button
          onClick={() => setShowExitModal(true)}
          aria-label="Salir de la comunidad"
          title="Salir de la comunidad"
          className="w-10 h-10 rounded-full flex items-center justify-center text-base active:scale-90 transition-opacity"
          style={{ color: 'var(--muted)', opacity: 0.5 }}
        >
          🚪
        </button>
      </div>

      <main className="flex-1 pb-nav view-enter">
        {children}
      </main>

      <BottomNav
        communityId={session.communityId}
        communityColor={session.communityColor}
        role={session.role}
        playerId={session.playerId}
        playerName={player?.name}
        onAcceder={() => setShowPinModal(true)}
      />
      <ToastProvider />

      {/* Push Notification Prompt */}
      {push.showPrompt && (
        <NotificationPrompt
          onAccept={push.subscribe}
          onDismiss={push.dismissPrompt}
        />
      )}

      {/* PIN Login Modal */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowPinModal(false); setPinInput(''); setPinError('') } }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-modal-title"
            className="w-full max-w-xs rounded-2xl p-6 flex flex-col items-center gap-4 animate-slide-up"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <h2 id="pin-modal-title" className="text-lg font-bold text-center">Introduce tu PIN de jugador</h2>

            <label htmlFor="pin-input" className="sr-only">PIN de 4 dígitos</label>
            <div className="relative w-full">
              {/* Slots visibles: 4 celdas con dígito revelado / enmascarado */}
              <div
                className="flex justify-center gap-2 pointer-events-none select-none"
                aria-hidden="true"
              >
                {[0, 1, 2, 3].map(i => {
                  const filled = i < pinInput.length
                  const reveal = filled && i === pinRevealIdx
                  const active = !filled && i === pinInput.length && !pinLoading
                  return (
                    <div
                      key={i}
                      className="w-12 h-14 rounded-xl flex items-center justify-center font-mono text-2xl font-bold transition-all"
                      style={{
                        border: `1.5px solid ${pinError ? '#ef4444' : active ? session.communityColor : 'var(--border)'}`,
                        background: 'var(--card2, rgba(255,255,255,0.03))',
                        color: 'var(--fg)',
                        boxShadow: active
                          ? `0 0 0 3px ${session.communityColor}22`
                          : reveal
                            ? `0 0 0 3px ${session.communityColor}33`
                            : undefined,
                      }}
                    >
                      {filled ? (reveal ? pinInput[i] : '•') : ''}
                    </div>
                  )
                })}
              </div>

              {/* Input transparente encima para capturar teclado (numérico en móvil) */}
              <input
                id="pin-input"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
                  // Solo revelamos si se ha añadido un carácter (teclear, no borrar/pegar 1-0)
                  if (raw.length > pinInput.length) {
                    setPinRevealIdx(raw.length - 1)
                  } else {
                    setPinRevealIdx(null)
                  }
                  setPinInput(raw)
                  setPinError('')
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePinSubmit() }}
                autoFocus
                pattern="[0-9]*"
                autoComplete="one-time-code"
                aria-describedby={pinError ? 'pin-error' : undefined}
                aria-invalid={!!pinError}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{
                  // Oculta el caret; los slots ya dan feedback visual del cursor
                  caretColor: 'transparent',
                  // Mantiene el teclado numérico foco sin mostrar nada
                  color: 'transparent',
                  background: 'transparent',
                }}
              />
            </div>

            {pinError && (
              <p id="pin-error" role="alert" className="text-xs text-red-400 font-medium">{pinError}</p>
            )}

            <button
              onClick={handlePinSubmit}
              disabled={pinLoading || pinInput.length !== 4}
              className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: session.communityColor,
                color: '#000',
              }}
            >
              {pinLoading ? 'Verificando...' : 'Entrar'}
            </button>

            <button
              onClick={() => { setShowPinModal(false); setPinInput(''); setPinError('') }}
              className="text-xs uppercase tracking-wide opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--muted)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowExitModal(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            className="w-full max-w-xs rounded-2xl p-6 flex flex-col items-center gap-5 animate-slide-up"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <span className="text-3xl select-none" aria-hidden="true">{'\u{1F6AA}'}</span>
            <h2 id="exit-modal-title" className="text-lg font-bold text-center" style={{ color: 'var(--fg)' }}>
              {'\u00BF'}Seguro que quieres salir?
            </h2>
            <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
              Volver{'\u00E1'}s a la pantalla de selecci{'\u00F3'}n de comunidad.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 select-none"
                style={{
                  background: 'var(--border)',
                  color: 'var(--fg)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 select-none"
                style={{
                  background: 'var(--muted)',
                  color: 'var(--bg)',
                }}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
