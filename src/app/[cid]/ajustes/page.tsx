'use client'

import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useCommunity } from '@/hooks/useCommunity'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { COMMUNITY_COLORS } from '@/lib/utils'

interface AjustesPageProps {
  params: { cid: string }
}

export default function AjustesPage({ params }: AjustesPageProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()
  const { community } = useCommunity(cid)
  const logout = useSession(s => s.logout)

  function handleLogout() {
    logout()
    router.replace('/')
  }

  return (
    <div className="view-enter">
      <Header title="⚙️ Ajustes" />

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
            Tu sesión
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Rol</span>
              <span className="font-bold capitalize">{session.role}</span>
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

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => router.push('/')}>
            🔄 Cambiar de comunidad
          </Button>
          <Button variant="danger" className="w-full" onClick={handleLogout}>
            🚪 Cerrar sesión
          </Button>
        </div>

        {/* App info */}
        <div className="text-center pt-4" style={{ color: 'var(--muted)' }}>
          <p className="font-bebas text-xl tracking-widest">FURBITO</p>
          <p className="text-xs">v2.0 · Next.js + Supabase + Vercel</p>
        </div>
      </div>
    </div>
  )
}
