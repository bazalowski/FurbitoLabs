'use client'

import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { EventForm } from '@/components/events/EventForm'
import { Header } from '@/components/layout/Header'
import { usePistas } from '@/hooks/usePistas'

interface NuevoEventoPageProps {
  params: { cid: string }
}

export default function NuevoEventoPage({ params }: NuevoEventoPageProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()
  const { pistas } = usePistas(cid)

  if (session.role !== 'admin') {
    return <div className="p-4" style={{ color: 'var(--muted)' }}>Solo admin puede crear eventos</div>
  }

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
