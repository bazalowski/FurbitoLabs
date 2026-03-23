'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { ToastProvider } from '@/components/ui/Toast'
import type { Community } from '@/types'

export default function AdminPage() {
  const router = useRouter()
  const session = useSession()
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session.role !== 'admin') {
      router.replace('/')
      return
    }
    loadCommunities()
  }, [session.role, router])

  async function loadCommunities() {
    const supabase = createClient()
    const { data } = await supabase.from('communities').select('*').order('name')
    setCommunities(data ?? [])
    setLoading(false)
  }

  async function deleteCommunity(c: Community) {
    if (!confirm(`¿Eliminar "${c.name}"? Se borrarán TODOS sus datos.`)) return
    const supabase = createClient()
    await supabase.from('communities').delete().eq('id', c.id)
    showToast(`🗑️ "${c.name}" eliminada`)
    loadCommunities()
  }

  function enterCommunity(c: Community) {
    session.login(c.id, c.color, 'admin')
    router.push(`/${c.id}`)
  }

  return (
    <div className="max-w-app mx-auto min-h-screen">
      <Header
        title="👑 Panel Admin"
        right={
          <Button size="sm" variant="ghost" onClick={() => { session.logout(); router.replace('/') }}>
            Salir
          </Button>
        }
      />

      <div className="px-4 space-y-4 pt-2">
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
            Comunidades registradas
          </p>
          <p className="font-bebas text-3xl" style={{ color: 'var(--gold)' }}>
            {communities.length}
          </p>
        </Card>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Cargando...</p>
        ) : communities.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No hay comunidades todavía.</p>
        ) : (
          communities.map(c => (
            <Card key={c.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <div className="flex-1">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    PIN: <span className="font-mono font-bold">{c.pin}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => enterCommunity(c)}>
                  Entrar
                </Button>
                <Button size="sm" variant="danger" onClick={() => deleteCommunity(c)}>
                  🗑️
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      <ToastProvider />
    </div>
  )
}
