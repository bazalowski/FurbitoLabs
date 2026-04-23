'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/stores/session'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { showToast, ToastProvider } from '@/components/ui/Toast'
import type { Community } from '@/types'

interface CommunityRow extends Community {
  _counts?: { players: number; events: number; pistas: number }
}

export default function AdminPage() {
  const router = useRouter()
  const session = useSession()
  const [communities, setCommunities] = useState<CommunityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    // Verifica con el JWT real que el caller es el super-admin.
    // No basta con session.role='admin' (eso solo refleja estado cliente).
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const SUPER_ADMIN_UUID = '1a1c6670-552c-4114-abb2-98a1483fa7fa'

      if (!user || user.id !== SUPER_ADMIN_UUID) {
        router.replace('/admin/login')
        return
      }
      loadCommunities()
    })()
  }, [router])

  async function loadCommunities() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('communities').select('*').order('name')
    const rows = (data ?? []) as CommunityRow[]

    // Counts en paralelo para métricas rápidas
    const counts = await Promise.all(
      rows.map(async c => {
        const [p, e, pi] = await Promise.all([
          supabase.from('players').select('id', { count: 'exact', head: true }).eq('community_id', c.id),
          supabase.from('events').select('id',  { count: 'exact', head: true }).eq('community_id', c.id),
          supabase.from('pistas').select('id',  { count: 'exact', head: true }).eq('community_id', c.id),
        ])
        return { players: p.count ?? 0, events: e.count ?? 0, pistas: pi.count ?? 0 }
      }),
    )
    setCommunities(rows.map((c, i) => ({ ...c, _counts: counts[i] })))
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

  const filtered = query.trim()
    ? communities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.pin.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase()),
      )
    : communities

  const totals = communities.reduce(
    (acc, c) => ({
      players: acc.players + (c._counts?.players ?? 0),
      events:  acc.events  + (c._counts?.events  ?? 0),
      pistas:  acc.pistas  + (c._counts?.pistas  ?? 0),
    }),
    { players: 0, events: 0, pistas: 0 },
  )

  return (
    <div className="max-w-app mx-auto min-h-screen">
      <Header
        title="Panel Admin"
        right={
          <Button size="sm" variant="ghost" onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            await supabase.auth.signInAnonymously()
            session.logout()
            router.replace('/')
          }}>
            Salir
          </Button>
        }
      />

      <div className="px-4 space-y-4 pt-2 pb-10">
        {/* Métricas globales */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Comunidades', value: communities.length, color: 'var(--gold)' },
            { label: 'Jugadores',   value: totals.players,     color: 'var(--accent)' },
            { label: 'Eventos',     value: totals.events,      color: 'var(--accent)' },
            { label: 'Pistas',      value: totals.pistas,      color: 'var(--accent)' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-m p-3 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="font-bebas text-2xl leading-none" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, PIN o ID…"
          className="w-full px-3 py-2.5 rounded-m text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Sin resultados.</p>
        ) : (
          filtered.map(c => (
            <Card key={c.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{c.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    PIN <span className="font-mono font-bold">{c.pin}</span>
                    {' · '}
                    <span className="font-mono opacity-70">{c.id.slice(0, 8)}</span>
                  </p>
                </div>
                {c._counts && (
                  <div className="flex gap-2 text-[10px]" style={{ color: 'var(--muted)' }}>
                    <span>👥 {c._counts.players}</span>
                    <span>📅 {c._counts.events}</span>
                    <span>📍 {c._counts.pistas}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href={`/admin/${c.id}`}
                  className="py-2.5 rounded-m text-xs font-bold uppercase tracking-wider text-center transition-all active:scale-95 select-none"
                  style={{
                    background: 'rgba(255,215,0,0.12)',
                    color: 'var(--gold)',
                    border: '1px solid rgba(255,215,0,0.35)',
                    minHeight: 40,
                  }}
                >
                  🛠 Editar
                </Link>
                <Button size="sm" variant="secondary" onClick={() => enterCommunity(c)}>
                  Entrar
                </Button>
                <Button size="sm" variant="danger" onClick={() => deleteCommunity(c)}>
                  🗑️ Borrar
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
