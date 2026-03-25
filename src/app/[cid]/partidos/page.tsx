'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/stores/session'
import { useEvents } from '@/hooks/useEvents'
import { usePlayers } from '@/hooks/usePlayers'
import { EventCard } from '@/components/events/EventCard'
import { Header } from '@/components/layout/Header'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface PartidosPageProps {
  params: { cid: string }
}

type Tab = 'proximos' | 'historial'

export default function PartidosPage({ params }: PartidosPageProps) {
  const { cid } = params
  const session = useSession()
  const { upcoming, past, loading } = useEvents(cid)
  const { players } = usePlayers(cid)
  const [tab, setTab] = useState<Tab>('proximos')

  const canCreate = session.role === 'admin'
  const shown = tab === 'proximos' ? upcoming : past

  return (
    <div className="view-enter">
      <Header
        title="Partidos"
        right={
          canCreate && (
            <Link
              href={`/${cid}/partidos/nuevo`}
              className="px-3 py-1.5 rounded-m text-xs font-bold"
              style={{ background: 'var(--accent)', color: '#050d05' }}
            >
              + Nuevo
            </Link>
          )
        }
      />

      {/* Tab selector */}
      <div className="px-4 mb-4">
        <div className="flex rounded-m overflow-hidden" style={{ background: 'var(--card)' }}>
          {(['proximos', 'historial'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
              style={
                tab === t
                  ? { background: 'var(--comm-color, var(--accent))', color: '#050d05' }
                  : { color: 'var(--muted)' }
              }
            >
              {t === 'proximos' ? `📅 Próximos (${upcoming.length})` : `📚 Historial (${past.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : shown.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
            <p className="text-3xl mb-3">{tab === 'proximos' ? '📅' : '📚'}</p>
            <p className="font-bold">
              {tab === 'proximos' ? 'No hay eventos próximos' : 'Sin historial todavía'}
            </p>
            {tab === 'proximos' && canCreate && (
              <Link
                href={`/${cid}/partidos/nuevo`}
                className="inline-block mt-4 px-4 py-2 rounded-m font-bold text-sm"
                style={{ background: 'var(--accent)', color: '#050d05' }}
              >
                Crear el primer evento
              </Link>
            )}
          </div>
        ) : (
          shown.map(ev => (
            <EventCard key={ev.id} event={ev} communityId={cid} players={players} />
          ))
        )}
      </div>
    </div>
  )
}
