'use client'

import { useRouter } from 'next/navigation'
import { EventForm } from '@/components/events/EventForm'
import { Header } from '@/components/layout/Header'
import { usePistas } from '@/hooks/usePistas'

interface NuevoEventoPageProps {
  params: { cid: string }
}

export default function NuevoEventoPage({ params }: NuevoEventoPageProps) {
  const { cid } = params
  const router = useRouter()
  const { pistas } = usePistas(cid)

  return (
    <div className="view-enter">
      <Header
        title="Nuevo evento"
        left={
          <button onClick={() => router.back()} className="text-lg" style={{ color: 'var(--muted)' }}>
            ←
          </button>
        }
      />
      <div className="px-4 pt-2">
        <EventForm
          communityId={cid}
          pistas={pistas}
          onDone={() => router.push(`/${cid}/partidos`)}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
