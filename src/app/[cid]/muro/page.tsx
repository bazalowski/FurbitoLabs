'use client'

import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useCommunity } from '@/hooks/useCommunity'
import { usePlayer } from '@/hooks/usePlayers'
import { WallFeed } from '@/components/wall/WallFeed'
import { Header } from '@/components/layout/Header'

interface WallPageProps {
  params: { cid: string }
}

export default function WallPage({ params }: WallPageProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()
  const { community } = useCommunity(cid)
  const { player: me } = usePlayer(
    (session.role === 'player' || session.role === 'admin') ? session.playerId : null,
  )
  const communityColor = session.communityColor || '#a8ff3e'
  const isLoggedIn = (session.role === 'player' || session.role === 'admin') && !!session.playerId

  return (
    <div className="view-enter">
      <Header
        title="Muro"
        left={
          <button onClick={() => router.back()} className="text-lg" style={{ color: 'var(--muted)' }}>
            ←
          </button>
        }
      />

      <div
        className="px-4 pt-2 pb-28"
        style={{ ['--comm-color' as string]: communityColor }}
      >
        {!isLoggedIn ? (
          <div className="surface-calm p-6 text-center space-y-2">
            <p className="font-barlow text-[13px] font-bold">Accede para ver el muro</p>
            <p className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
              El muro es un espacio privado de la comunidad.
            </p>
          </div>
        ) : (
          <WallFeed
            communityId={cid}
            community={community}
            me={me ?? null}
            communityColor={communityColor}
            variant="full"
          />
        )}
      </div>
    </div>
  )
}
