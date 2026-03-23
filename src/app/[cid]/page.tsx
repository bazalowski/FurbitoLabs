'use client'

import { useSession } from '@/stores/session'
import { useEvents } from '@/hooks/useEvents'
import { usePlayers } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { EventCard } from '@/components/events/EventCard'
import { Header, Logo } from '@/components/layout/Header'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ActivityFeed } from '@/components/feed/ActivityFeed'
import Link from 'next/link'

interface HomePageProps {
  params: { cid: string }
}

export default function HomePage({ params }: HomePageProps) {
  const { cid } = params
  const session = useSession()
  const { community } = useCommunity(cid)
  const { upcoming, past, loading: eventsLoading } = useEvents(cid)
  const { players } = usePlayers(cid)

  const nextEvent = upcoming[0]
  const recentPast = past.slice(0, 3)

  return (
    <div className="view-enter">
      <Header
        title={<Logo />}
        right={
          community && (
            <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>
              {community.name}
            </span>
          )
        }
      />

      <div className="px-4 space-y-5 pt-2">
        {/* Next event banner */}
        {eventsLoading ? (
          <SkeletonCard />
        ) : nextEvent ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Próximo partido
            </p>
            <EventCard event={nextEvent} communityId={cid} players={players} />
          </div>
        ) : (
          <div
            className="rounded-m p-5 text-center space-y-2"
            style={{ background: 'var(--card)', border: '1px solid var(--border-a)' }}
          >
            <p className="text-2xl">⚽</p>
            <p className="font-bold text-sm">No hay partidos próximos</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Crea un nuevo evento para empezar</p>
            {(session.role === 'admin' || session.role === 'player') && (
              <Link
                href={`/${cid}/partidos/nuevo`}
                className="inline-block mt-2 px-4 py-2 rounded-m font-bold text-sm"
                style={{ background: 'var(--accent)', color: '#050d05' }}
              >
                + Nuevo partido
              </Link>
            )}
          </div>
        )}

        {/* Stats quick */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Jugadores', value: players.length, icon: '👥' },
            { label: 'Próximos', value: upcoming.length, icon: '📅' },
            { label: 'Jugados', value: past.length, icon: '🏆' },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-m p-3 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xl">{stat.icon}</p>
              <p className="font-bebas text-2xl tracking-wider" style={{ color: 'var(--comm-color, var(--accent))' }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming events */}
        {upcoming.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Próximos eventos
              </p>
              <Link href={`/${cid}/partidos`} className="text-xs font-bold" style={{ color: 'var(--comm-color, var(--accent))' }}>
                Ver todos
              </Link>
            </div>
            <div className="space-y-2">
              {upcoming.slice(1, 4).map(ev => (
                <EventCard key={ev.id} event={ev} communityId={cid} players={players} />
              ))}
            </div>
          </div>
        )}

        {/* Recent results */}
        {recentPast.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Últimos resultados
              </p>
              <Link href={`/${cid}/partidos`} className="text-xs font-bold" style={{ color: 'var(--comm-color, var(--accent))' }}>
                Historial
              </Link>
            </div>
            <div className="space-y-2">
              {recentPast.map(ev => (
                <EventCard key={ev.id} event={ev} communityId={cid} players={players} />
              ))}
            </div>
          </div>
        )}

        {/* Activity feed */}
        <ActivityFeed events={[...upcoming, ...past]} players={players} />
      </div>
    </div>
  )
}
