'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useEvents } from '@/hooks/useEvents'
import { usePlayers } from '@/hooks/usePlayers'
import { EventCard } from '@/components/events/EventCard'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
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
  const searchParams = useSearchParams()
  const initialTab: Tab = searchParams.get('tab') === 'historial' ? 'historial' : 'proximos'
  const [tab, setTab] = useState<Tab>(initialTab)

  const canCreate = session.role === 'admin'
  const communityColor = session.communityColor || '#a8ff3e'
  const shown = tab === 'proximos' ? upcoming : past

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: 'proximos',  label: 'Próximos',  icon: '📅', count: upcoming.length },
    { key: 'historial', label: 'Historial', icon: '📚', count: past.length },
  ]

  return (
    <div className="view-enter" style={{ ['--comm-color' as string]: communityColor }}>
      <Header
        title="Partidos"
        right={
          canCreate ? (
            <Link
              href={`/${cid}/partidos/nuevo`}
              className="inline-flex items-center px-3 min-h-[36px] rounded-full font-barlow text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform"
              style={{
                background: communityColor,
                color: '#050d05',
                boxShadow: 'var(--shadow-depth-1)',
              }}
            >
              + Nuevo
            </Link>
          ) : null
        }
      />

      {/* Tab selector — pills premium con community tint */}
      <div className="px-4 mb-4">
        <div className="flex gap-1.5">
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={active}
                className="flex-1 px-3 min-h-[40px] rounded-full font-barlow text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                style={
                  active
                    ? {
                        background: communityColor,
                        color: '#040807',
                        boxShadow: 'var(--shadow-depth-1)',
                      }
                    : {
                        background: 'var(--card)',
                        color: 'var(--muted)',
                        border: '1px solid var(--border)',
                      }
                }
              >
                <span aria-hidden="true">{t.icon}</span>
                <span>{t.label}</span>
                <span className="font-mono tabular-nums" style={{ opacity: 0.7 }}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 space-y-3 pb-28">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : shown.length === 0 ? (
          <div className="surface-calm py-12 px-6 text-center space-y-3">
            <p className="text-4xl leading-none" aria-hidden="true">
              {tab === 'proximos' ? '📅' : '📚'}
            </p>
            <p className="font-bebas text-3xl leading-none tracking-display">
              {tab === 'proximos' ? 'Sin partidos próximos' : 'Sin historial todavía'}
            </p>
            <p className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
              {tab === 'proximos'
                ? 'Cuando se cree un partido, aparecerá aquí.'
                : 'Los partidos finalizados aparecerán aquí.'}
            </p>
            {tab === 'proximos' && canCreate && (
              <div className="pt-2">
                <Link href={`/${cid}/partidos/nuevo`}>
                  <Button variant="primary" size="md">
                    + Crear el primer partido
                  </Button>
                </Link>
              </div>
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
