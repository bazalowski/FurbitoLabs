'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { usePlayer } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { createClient } from '@/lib/supabase/client'
import { isPlayerAdmin } from '@/stores/session'
import { BottomNav } from '@/components/layout/BottomNav'
import { RoleBanner } from '@/components/layout/RoleBanner'
import { ToastProvider, showToast } from '@/components/ui/Toast'

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

  // Exit confirmation modal state
  const [showExitModal, setShowExitModal] = useState(false)

  function handleExit() {
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

  const isGuest = session.role === 'guest'

  return (
    <div className="max-w-app mx-auto min-h-screen relative flex flex-col">
      <RoleBanner role={session.role} playerName={player?.name} />

      {/* PIN Login Button + Exit Button */}
      <div className="flex justify-end items-center gap-2 px-4 py-1">
        {isGuest ? (
          <button
            onClick={() => setShowPinModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all active:scale-95"
            style={{
              background: session.communityColor,
              color: '#000',
            }}
          >
            <span>{'\u{1F511}'}</span> Identificarse
          </button>
        ) : (
          <button
            onClick={() => setShowPinModal(true)}
            aria-label="Cambiar jugador"
            className="flex items-center justify-center w-10 h-10 rounded-full text-sm opacity-50 hover:opacity-80 transition-opacity active:scale-95 cursor-pointer"
            style={{ background: 'var(--card)' }}
            title="Cambiar jugador"
          >
            {'\u{1F511}'}
          </button>
        )}

        {/* Exit community button */}
        <button
          onClick={() => setShowExitModal(true)}
          aria-label="Salir de la comunidad"
          className="flex items-center justify-center w-10 h-10 rounded-full text-sm opacity-40 hover:opacity-70 transition-opacity active:scale-95 select-none cursor-pointer"
          style={{ background: 'var(--card)' }}
          title="Salir de la comunidad"
        >
          {'\u{1F6AA}'}
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
      />
      <ToastProvider />

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
            <input
              id="pin-input"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPinInput(v)
                setPinError('')
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePinSubmit() }}
              placeholder="0000"
              autoFocus
              pattern="[0-9]*"
              aria-describedby={pinError ? 'pin-error' : undefined}
              aria-invalid={!!pinError}
              className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3 px-4 rounded-xl border bg-transparent outline-none focus:ring-2"
              style={{
                borderColor: pinError ? '#ef4444' : 'var(--border)',
                color: 'var(--fg)',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ['--tw-ring-color' as any]: session.communityColor,
              }}
            />

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
