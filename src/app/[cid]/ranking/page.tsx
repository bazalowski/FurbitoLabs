'use client'

import { useSession } from '@/stores/session'
import { usePlayers } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { useVotes } from '@/hooks/useVotes'
import { RankingTable } from '@/components/ranking/RankingTable'
import { Header } from '@/components/layout/Header'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface RankingPageProps {
  params: { cid: string }
}

export default function RankingPage({ params }: RankingPageProps) {
  const { cid } = params
  const session = useSession()
  const { players, loading } = usePlayers(cid)
  const { community } = useCommunity(cid)
  const { votes } = useVotes(cid)
  const adminIds = community?.admin_ids ?? []

  return (
    <div className="view-enter">
      <Header title="🏆 Ranking" />

      <div className="px-4 pt-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
            <p className="text-3xl mb-3">🏆</p>
            <p className="font-bold">Sin jugadores aún</p>
          </div>
        ) : (
          <RankingTable
            players={players}
            votes={votes}
            communityId={cid}
            communityColor={session.communityColor}
            adminIds={adminIds}
          />
        )}
      </div>
    </div>
  )
}
