'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useCommunity } from '@/hooks/useCommunity'
import { usePlayers } from '@/hooks/usePlayers'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { showToast } from '@/components/ui/Toast'
import { PlayerAvatar } from '@/components/players/PlayerCard'

const MAX_ADMINS = 3

interface AjustesPageProps {
  params: { cid: string }
}

export default function AjustesPage({ params }: AjustesPageProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()
  const { community } = useCommunity(cid)
  const { players } = usePlayers(cid)
  const logout = useSession(s => s.logout)

  const [promoteOpen, setPromoteOpen] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  const isAdmin = session.role === 'admin'
  const adminIds = community?.admin_ids ?? []
  const isPrimaryAdmin = community?.comm_admin_id === session.playerId

  // Players who are admins
  const adminPlayers = players.filter(p => adminIds.includes(p.id))
  // Players who can be promoted (not already admin)
  const promotablePlayers = players.filter(p => !adminIds.includes(p.id))

  async function promoteToAdmin(playerId: string) {
    if (adminIds.length >= MAX_ADMINS) {
      showToast(`Maximo ${MAX_ADMINS} admins permitidos`)
      return
    }
    setAdminLoading(true)
    const supabase = createClient()
    const newAdminIds = [...adminIds, playerId]
    const { error } = await supabase
      .from('communities')
      .update({ admin_ids: newAdminIds })
      .eq('id', cid)
    if (error) {
      showToast('Error al hacer admin')
    } else {
      showToast('Admin anadido')
      setPromoteOpen(false)
      // Force page refresh to get updated community data
      window.location.reload()
    }
    setAdminLoading(false)
  }

  async function demoteAdmin(playerId: string) {
    // Cannot demote the primary (creator) admin
    if (playerId === community?.comm_admin_id) {
      showToast('No se puede quitar admin al creador de la comunidad')
      return
    }
    if (!confirm('Quitar permisos de admin a este jugador?')) return
    setAdminLoading(true)
    const supabase = createClient()
    const newAdminIds = adminIds.filter(id => id !== playerId)
    const { error } = await supabase
      .from('communities')
      .update({ admin_ids: newAdminIds })
      .eq('id', cid)
    if (error) {
      showToast('Error al quitar admin')
    } else {
      showToast('Admin removido')
      // If demoting yourself, update session
      if (playerId === session.playerId) {
        session.setRole('player')
      }
      window.location.reload()
    }
    setAdminLoading(false)
  }

  function handleLogout() {
    logout()
    router.replace('/')
  }

  return (
    <div className="view-enter">
      <Header title="Ajustes" />

      <div className="px-4 space-y-4 pt-2">
        {/* Community info */}
        {community && (
          <Card>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Comunidad
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{ background: community.color }}
              />
              <div>
                <p className="font-bold">{community.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  PIN: <span className="font-mono font-bold tracking-widest">{community.pin}</span>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Session info */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
            Tu sesion
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Rol</span>
              <span className="font-bold capitalize">
                {session.role === 'admin' ? (
                  <span style={{ color: 'var(--gold, #ffd700)' }}>{'\uD83D\uDC51'} Admin</span>
                ) : session.role}
              </span>
            </div>
            {session.playerId && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>ID jugador</span>
                <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {session.playerId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Admin Management Section — only visible to admins */}
        {isAdmin && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--gold, #ffd700)' }}>
                {'\uD83D\uDC51'} Administradores ({adminPlayers.length}/{MAX_ADMINS})
              </p>
              {isPrimaryAdmin && adminIds.length < MAX_ADMINS && (
                <button
                  onClick={() => setPromoteOpen(true)}
                  className="px-2.5 py-1.5 rounded-m text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: 'rgba(255,215,0,0.15)',
                    color: 'var(--gold, #ffd700)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    minHeight: '36px',
                  }}
                >
                  + Hacer admin
                </button>
              )}
            </div>

            {adminPlayers.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin admins configurados</p>
            ) : (
              <div className="space-y-2">
                {adminPlayers.map(p => {
                  const isPrimary = p.id === community?.comm_admin_id
                  return (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <PlayerAvatar player={p} size={36} communityColor={session.communityColor} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold truncate">{p.name}</span>
                          {isPrimary && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold, #ffd700)' }}
                            >
                              Creador
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Demote button — primary admin can demote others, but nobody can demote the creator */}
                      {isPrimaryAdmin && !isPrimary && (
                        <button
                          onClick={() => demoteAdmin(p.id)}
                          disabled={adminLoading}
                          className="px-2.5 py-1.5 rounded-m text-xs font-bold transition-all active:scale-95"
                          style={{
                            background: 'rgba(239,68,68,0.12)',
                            color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.3)',
                            minHeight: '36px',
                            opacity: adminLoading ? 0.5 : 1,
                          }}
                        >
                          Quitar admin
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        {/* Theme */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
            Apariencia
          </p>
          <ThemeToggle />
        </Card>

        {/* Exit community */}
        <Card>
          <button
            onClick={() => setShowExitModal(true)}
            className="w-full flex items-center gap-3 py-3 px-1 rounded-m text-sm font-bold transition-all active:scale-[0.98] select-none"
            style={{ color: 'var(--muted)', minHeight: '48px' }}
          >
            <span className="text-lg select-none">{'\u{1F6AA}'}</span>
            <span>Salir de la comunidad</span>
          </button>
        </Card>

        {/* App info */}
        <div className="text-center pt-4" style={{ color: 'var(--muted)' }}>
          <p className="font-bebas text-xl tracking-widest">FURBITO</p>
          <p className="text-xs">v2.0 · Next.js + Supabase + Vercel</p>
        </div>
      </div>

      {/* Promote Player Modal */}
      <Modal open={promoteOpen} onClose={() => setPromoteOpen(false)} title={'\uD83D\uDC51 Hacer admin'}>
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Selecciona un jugador para hacerlo administrador. Maximo {MAX_ADMINS} admins por comunidad.
          </p>
          {promotablePlayers.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
              Todos los jugadores ya son admins
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {promotablePlayers.map(p => (
                <button
                  key={p.id}
                  onClick={() => promoteToAdmin(p.id)}
                  disabled={adminLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-m transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    minHeight: '48px',
                    opacity: adminLoading ? 0.5 : 1,
                  }}
                >
                  <PlayerAvatar player={p} size={32} communityColor={session.communityColor} />
                  <span className="text-sm font-bold flex-1 text-left truncate">{p.name}</span>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded"
                    style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold, #ffd700)' }}
                  >
                    {'\uD83D\uDC51'} Hacer admin
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowExitModal(false) }}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-6 flex flex-col items-center gap-5 animate-slide-up"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <span className="text-3xl select-none">{'\u{1F6AA}'}</span>
            <h2 className="text-lg font-bold text-center" style={{ color: 'var(--fg)' }}>
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
                  minHeight: '48px',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 select-none"
                style={{
                  background: 'var(--muted)',
                  color: 'var(--bg)',
                  minHeight: '48px',
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
