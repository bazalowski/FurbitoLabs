'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { showToast, ToastProvider } from '@/components/ui/Toast'
import { COMMUNITY_COLORS, genPlayerCode, fmtDateTime } from '@/lib/utils'
import type { Community, Player, Event, Pista } from '@/types'

type Tab = 'community' | 'players' | 'events' | 'pistas'

interface AdminCommunityPageProps {
  params: { cid: string }
}

export default function AdminCommunityPage({ params }: AdminCommunityPageProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()

  const [tab, setTab] = useState<Tab>('community')
  const [loading, setLoading] = useState(true)
  const [community, setCommunity] = useState<Community | null>(null)
  const [players, setPlayers]   = useState<Player[]>([])
  const [events, setEvents]     = useState<Event[]>([])
  const [pistas, setPistas]     = useState<Pista[]>([])

  useEffect(() => {
    if (session.role !== 'admin') {
      router.replace('/')
      return
    }
    loadAll()
  }, [session.role, cid, router])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()
    const [c, p, e, pi] = await Promise.all([
      supabase.from('communities').select('*').eq('id', cid).single(),
      supabase.from('players').select('*').eq('community_id', cid).order('name'),
      supabase.from('events').select('*').eq('community_id', cid).order('fecha', { ascending: false }),
      supabase.from('pistas').select('*').eq('community_id', cid).order('name'),
    ])
    if (c.error || !c.data) {
      showToast('Error cargando comunidad')
      router.replace('/admin')
      return
    }
    setCommunity(c.data)
    setPlayers((p.data ?? []) as Player[])
    setEvents((e.data ?? []) as Event[])
    setPistas((pi.data ?? []) as Pista[])
    setLoading(false)
  }

  if (loading || !community) {
    return <div className="p-4" style={{ color: 'var(--muted)' }}>Cargando...</div>
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'community', label: 'Comunidad' },
    { key: 'players',   label: 'Jugadores', count: players.length },
    { key: 'events',    label: 'Eventos',   count: events.length },
    { key: 'pistas',    label: 'Pistas',    count: pistas.length },
  ]

  return (
    <div className="max-w-app mx-auto min-h-screen">
      <Header
        title={community.name}
        left={
          <button onClick={() => router.push('/admin')} style={{ color: 'var(--muted)' }}>
            ← Admin
          </button>
        }
        right={
          <button
            onClick={() => { session.login(community.id, community.color, 'admin'); router.push(`/${community.id}`) }}
            className="text-sm font-bold"
            style={{ color: 'var(--gold)' }}
          >
            Entrar →
          </button>
        }
      />

      <div className="px-4 space-y-4 pt-2 pb-10">
        {/* Tab bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
          {tabs.map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-shrink-0 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all min-h-[36px] active:scale-95"
              style={
                tab === t.key
                  ? { background: 'var(--gold)', color: '#1a1205' }
                  : { background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }
              }
            >
              {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {tab === 'community' && <CommunityEditor community={community} onSaved={loadAll} />}
        {tab === 'players'   && <PlayersEditor cid={cid} community={community} players={players} onChanged={loadAll} />}
        {tab === 'events'    && <EventsEditor cid={cid} events={events} players={players} pistas={pistas} onChanged={loadAll} />}
        {tab === 'pistas'    && <PistasEditor cid={cid} pistas={pistas} onChanged={loadAll} />}
      </div>

      <ToastProvider />
    </div>
  )
}

// ══════════════════════════════════════════════
//  COMMUNITY EDITOR
// ══════════════════════════════════════════════
function CommunityEditor({ community, onSaved }: { community: Community; onSaved: () => void }) {
  const [name, setName] = useState(community.name)
  const [pin, setPin]   = useState(community.pin)
  const [color, setColor] = useState(community.color)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim() || !pin.trim()) { showToast('Nombre y PIN requeridos'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('communities').update({
      name: name.trim(),
      pin: pin.trim().toUpperCase(),
      color,
    }).eq('id', community.id)
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast('✅ Comunidad actualizada')
    onSaved()
  }

  return (
    <div className="space-y-4">
      <AdminField label="Nombre">
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="admin-input" />
      </AdminField>
      <AdminField label="PIN">
        <input type="text" value={pin} onChange={e => setPin(e.target.value.toUpperCase())} className="admin-input font-mono tracking-widest" />
      </AdminField>
      <AdminField label="Color">
        <div className="flex gap-2 flex-wrap">
          {COMMUNITY_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-9 h-9 rounded-full border-2 transition-transform"
              style={{ background: c, borderColor: color === c ? 'white' : 'transparent', transform: color === c ? 'scale(1.15)' : 'scale(1)' }}
            />
          ))}
        </div>
      </AdminField>
      <AdminField label="ID interno">
        <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{community.id}</p>
      </AdminField>
      <button
        onClick={save}
        disabled={saving}
        className="w-full h-12 rounded-m font-bold text-sm uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        style={{ background: 'var(--gold)', color: '#1a1205' }}
      >
        {saving ? 'Guardando…' : '💾 Guardar cambios'}
      </button>
      <AdminStyles />
    </div>
  )
}

// ══════════════════════════════════════════════
//  PLAYERS EDITOR
// ══════════════════════════════════════════════
function PlayersEditor({
  cid, community, players, onChanged,
}: {
  cid: string
  community: Community
  players: Player[]
  onChanged: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [newOpen, setNewOpen] = useState(false)

  const filtered = useMemo(
    () => query.trim()
      ? players.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.code.toLowerCase().includes(query.toLowerCase()))
      : players,
    [players, query],
  )

  const adminIds = community.admin_ids ?? []

  async function togglePlayerAdmin(p: Player) {
    const supabase = createClient()
    const isAdmin = adminIds.includes(p.id)
    const newAdminIds = isAdmin ? adminIds.filter(id => id !== p.id) : [...adminIds, p.id]
    const { error } = await supabase.from('communities').update({ admin_ids: newAdminIds }).eq('id', cid)
    if (error) { showToast('Error: ' + error.message); return }
    showToast(isAdmin ? '🔽 Admin removido' : '👑 Ahora es admin')
    onChanged()
  }

  async function deletePlayer(p: Player) {
    if (!confirm(`¿Eliminar a "${p.name}"? Se borrarán sus stats y votos.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('players').delete().eq('id', p.id)
    if (error) { showToast('Error: ' + error.message); return }
    showToast('🗑️ Jugador eliminado')
    onChanged()
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar jugador…"
          className="flex-1 px-3 py-2.5 rounded-m text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <button
          onClick={() => setNewOpen(true)}
          className="px-3 py-2 rounded-m text-xs font-bold uppercase tracking-wider"
          style={{ background: 'var(--gold)', color: '#1a1205' }}
        >
          + Añadir
        </button>
      </div>

      {newOpen && (
        <NewPlayerInline cid={cid} onDone={() => { setNewOpen(false); onChanged() }} onCancel={() => setNewOpen(false)} />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>Sin jugadores.</p>
      ) : (
        filtered.map(p => {
          const isAdmin = adminIds.includes(p.id)
          const isCreator = community.comm_admin_id === p.id
          return (
            <div key={p.id} className="rounded-m p-3 space-y-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate flex items-center gap-1.5">
                    {p.name}
                    {isAdmin && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded" style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold)' }}>Admin</span>
                    )}
                    {isCreator && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded" style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold)' }}>Creador</span>
                    )}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    PIN <span className="font-mono">{p.code}</span> · {p.position ?? '—'} · {p.xp} XP
                  </p>
                </div>
                <button
                  onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                  className="px-2 py-1.5 rounded-m text-xs font-bold"
                  style={{ background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  {editingId === p.id ? 'Cerrar' : 'Editar'}
                </button>
              </div>

              {editingId === p.id && (
                <PlayerEditInline
                  player={p}
                  onSaved={() => { setEditingId(null); onChanged() }}
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => togglePlayerAdmin(p)}
                  disabled={isCreator}
                  className="flex-1 py-1.5 rounded-m text-xs font-bold"
                  style={{
                    background: isAdmin ? 'rgba(255,215,0,0.12)' : 'var(--card2)',
                    color: isAdmin ? 'var(--gold)' : 'var(--muted)',
                    border: '1px solid var(--border)',
                    opacity: isCreator ? 0.4 : 1,
                  }}
                  title={isCreator ? 'No puedes quitar admin al creador' : undefined}
                >
                  {isAdmin ? '🔽 Quitar admin' : '👑 Hacer admin'}
                </button>
                <button
                  onClick={() => deletePlayer(p)}
                  disabled={isCreator}
                  className="px-3 py-1.5 rounded-m text-xs font-bold"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.3)',
                    opacity: isCreator ? 0.4 : 1,
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          )
        })
      )}
      <AdminStyles />
    </div>
  )
}

function PlayerEditInline({ player, onSaved }: { player: Player; onSaved: () => void }) {
  const [name, setName] = useState(player.name)
  const [code, setCode] = useState(player.code)
  const [position, setPosition] = useState<string>(player.position ?? '')
  const [xp, setXp] = useState(player.xp)
  const [partidos, setPartidos] = useState(player.partidos)
  const [goles, setGoles] = useState(player.goles)
  const [asistencias, setAsistencias] = useState(player.asistencias)
  const [mvps, setMvps] = useState(player.mvps)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim() || !/^.{3,6}$/.test(code)) { showToast('Nombre y código (3-6 chars) requeridos'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').update({
      name: name.trim(),
      code: code.toUpperCase(),
      position: position || null,
      xp: Number(xp) || 0,
      partidos: Number(partidos) || 0,
      goles: Number(goles) || 0,
      asistencias: Number(asistencias) || 0,
      mvps: Number(mvps) || 0,
    }).eq('id', player.id)
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast('✅ Guardado')
    onSaved()
  }

  return (
    <div className="space-y-2 pt-2 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-2 gap-2">
        <InlineField label="Nombre">
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="admin-input-sm" />
        </InlineField>
        <InlineField label="PIN">
          <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} className="admin-input-sm font-mono tracking-widest" />
        </InlineField>
      </div>
      <InlineField label="Posición">
        <select value={position} onChange={e => setPosition(e.target.value)} className="admin-input-sm">
          <option value="">—</option>
          <option value="portero">Portero</option>
          <option value="defensa">Defensa</option>
          <option value="centrocampista">Centrocampista</option>
          <option value="delantero">Delantero</option>
        </select>
      </InlineField>
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { label: 'XP',      val: xp,          set: setXp },
          { label: 'Partidos', val: partidos,   set: setPartidos },
          { label: 'Goles',   val: goles,       set: setGoles },
          { label: 'Asist.',  val: asistencias, set: setAsistencias },
          { label: 'MVPs',    val: mvps,        set: setMvps },
        ].map(f => (
          <InlineField key={f.label} label={f.label}>
            <input type="number" min={0} value={f.val} onChange={e => f.set(Number(e.target.value))} className="admin-input-sm tabular-nums" />
          </InlineField>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-2 rounded-m text-xs font-bold uppercase tracking-wider"
        style={{ background: 'var(--gold)', color: '#1a1205' }}
      >
        {saving ? 'Guardando…' : '💾 Guardar jugador'}
      </button>
    </div>
  )
}

function NewPlayerInline({ cid, onDone, onCancel }: { cid: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState(() => genPlayerCode())
  const [saving, setSaving] = useState(false)

  async function create() {
    if (!name.trim() || !/^.{3,6}$/.test(code)) { showToast('Nombre y código (3-6 chars) requeridos'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').insert({
      community_id: cid,
      name: name.trim(),
      code: code.toUpperCase(),
    })
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast('✅ Jugador creado')
    onDone()
  }

  return (
    <div className="rounded-m p-3 space-y-2" style={{ background: 'var(--card)', border: '1px dashed var(--gold)' }}>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>Nuevo jugador</p>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} className="admin-input-sm" />
        <input type="text" placeholder="PIN" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} className="admin-input-sm font-mono" />
      </div>
      <div className="flex gap-2">
        <button onClick={create} disabled={saving} className="flex-1 py-2 rounded-m text-xs font-bold" style={{ background: 'var(--gold)', color: '#1a1205' }}>
          {saving ? '…' : 'Crear'}
        </button>
        <button onClick={onCancel} className="px-3 py-2 rounded-m text-xs" style={{ background: 'var(--card2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
//  EVENTS EDITOR
// ══════════════════════════════════════════════
function EventsEditor({
  cid, events, players, pistas, onChanged,
}: {
  cid: string
  events: Event[]
  players: Player[]
  pistas: Pista[]
  onChanged: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => query.trim()
      ? events.filter(e => e.titulo.toLowerCase().includes(query.toLowerCase()))
      : events,
    [events, query],
  )

  async function deleteEvent(e: Event) {
    if (!confirm(`¿Eliminar evento "${e.titulo}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('events').delete().eq('id', e.id)
    if (error) { showToast('Error: ' + error.message); return }
    showToast('🗑️ Evento eliminado')
    onChanged()
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar evento…"
        className="w-full px-3 py-2.5 rounded-m text-sm outline-none"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>Sin eventos.</p>
      ) : (
        filtered.map(e => (
          <div key={e.id} className="rounded-m p-3 space-y-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate flex items-center gap-1.5">
                  {e.titulo}
                  {e.finalizado && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded" style={{ background: 'var(--border)', color: 'var(--muted)' }}>Final</span>
                  )}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {fmtDateTime(e.fecha, e.hora)} · {e.tipo}
                  {e.goles_a !== null && ` · ${e.goles_a}-${e.goles_b}`}
                </p>
              </div>
              <button
                onClick={() => setEditingId(editingId === e.id ? null : e.id)}
                className="px-2 py-1.5 rounded-m text-xs font-bold"
                style={{ background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                {editingId === e.id ? 'Cerrar' : 'Editar'}
              </button>
              <button
                onClick={() => deleteEvent(e)}
                className="px-2 py-1.5 rounded-m text-xs font-bold"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                🗑️
              </button>
            </div>
            {editingId === e.id && (
              <EventEditInline
                event={e}
                players={players}
                pistas={pistas}
                onSaved={() => { setEditingId(null); onChanged() }}
              />
            )}
          </div>
        ))
      )}
      <AdminStyles />
    </div>
  )
}

function EventEditInline({ event, players, pistas, onSaved }: { event: Event; players: Player[]; pistas: Pista[]; onSaved: () => void }) {
  const [titulo, setTitulo] = useState(event.titulo)
  const [fecha, setFecha] = useState(event.fecha ?? '')
  const [hora, setHora] = useState(event.hora ?? '')
  const [pistaId, setPistaId] = useState(event.pista_id ?? '')
  const [lugar, setLugar] = useState(event.lugar ?? '')
  const [max, setMax] = useState(event.max_jugadores)
  const [finalizado, setFinalizado] = useState(event.finalizado)
  const [golesA, setGolesA] = useState<string>(event.goles_a?.toString() ?? '')
  const [golesB, setGolesB] = useState<string>(event.goles_b?.toString() ?? '')
  const [mvpId, setMvpId] = useState(event.mvp_id ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('events').update({
      titulo: titulo.trim(),
      fecha: fecha || null,
      hora: hora || null,
      pista_id: pistaId || null,
      lugar: lugar.trim() || null,
      max_jugadores: Number(max) || 10,
      finalizado,
      goles_a: golesA === '' ? null : Number(golesA),
      goles_b: golesB === '' ? null : Number(golesB),
      mvp_id: mvpId || null,
    }).eq('id', event.id)
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast('✅ Evento actualizado')
    onSaved()
  }

  return (
    <div className="space-y-2 pt-2 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
      <InlineField label="Título">
        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="admin-input-sm" />
      </InlineField>
      <div className="grid grid-cols-2 gap-2">
        <InlineField label="Fecha">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="admin-input-sm" />
        </InlineField>
        <InlineField label="Hora">
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="admin-input-sm" />
        </InlineField>
      </div>
      <InlineField label="Pista">
        <select value={pistaId} onChange={e => setPistaId(e.target.value)} className="admin-input-sm">
          <option value="">— Sin pista —</option>
          {pistas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </InlineField>
      <InlineField label="Lugar (texto libre)">
        <input type="text" value={lugar} onChange={e => setLugar(e.target.value)} className="admin-input-sm" />
      </InlineField>
      <InlineField label="Max jugadores">
        <input type="number" min={2} value={max} onChange={e => setMax(Number(e.target.value))} className="admin-input-sm" />
      </InlineField>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={finalizado} onChange={e => setFinalizado(e.target.checked)} className="w-4 h-4 accent-[var(--gold)]" />
        <span style={{ color: 'var(--muted)' }}>Finalizado</span>
      </label>
      {finalizado && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <InlineField label="Goles A">
              <input type="number" min={0} value={golesA} onChange={e => setGolesA(e.target.value)} className="admin-input-sm" />
            </InlineField>
            <InlineField label="Goles B">
              <input type="number" min={0} value={golesB} onChange={e => setGolesB(e.target.value)} className="admin-input-sm" />
            </InlineField>
          </div>
          <InlineField label="MVP">
            <select value={mvpId} onChange={e => setMvpId(e.target.value)} className="admin-input-sm">
              <option value="">— Sin MVP —</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </InlineField>
        </>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-2 rounded-m text-xs font-bold uppercase tracking-wider"
        style={{ background: 'var(--gold)', color: '#1a1205' }}
      >
        {saving ? 'Guardando…' : '💾 Guardar evento'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════
//  PISTAS EDITOR
// ══════════════════════════════════════════════
function PistasEditor({ cid, pistas, onChanged }: { cid: string; pistas: Pista[]; onChanged: () => void }) {
  const [newOpen, setNewOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function deletePista(p: Pista) {
    if (!confirm(`¿Eliminar pista "${p.name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('pistas').delete().eq('id', p.id)
    if (error) { showToast('Error: ' + error.message); return }
    showToast('🗑️ Pista eliminada')
    onChanged()
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setNewOpen(v => !v)}
        className="w-full py-2 rounded-m text-xs font-bold uppercase tracking-wider"
        style={{ background: newOpen ? 'var(--card2)' : 'var(--gold)', color: newOpen ? 'var(--muted)' : '#1a1205' }}
      >
        {newOpen ? 'Cancelar' : '+ Nueva pista'}
      </button>

      {newOpen && (
        <PistaEditInline
          cid={cid}
          onSaved={() => { setNewOpen(false); onChanged() }}
        />
      )}

      {pistas.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>Sin pistas.</p>
      ) : (
        pistas.map(p => (
          <div key={p.id} className="rounded-m p-3 space-y-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{p.name}</p>
                {p.address && <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>📍 {p.address}</p>}
              </div>
              <button
                onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                className="px-2 py-1.5 rounded-m text-xs font-bold"
                style={{ background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                {editingId === p.id ? 'Cerrar' : 'Editar'}
              </button>
              <button
                onClick={() => deletePista(p)}
                className="px-2 py-1.5 rounded-m text-xs font-bold"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                🗑️
              </button>
            </div>
            {editingId === p.id && (
              <PistaEditInline
                cid={cid}
                pista={p}
                onSaved={() => { setEditingId(null); onChanged() }}
              />
            )}
          </div>
        ))
      )}
      <AdminStyles />
    </div>
  )
}

function PistaEditInline({ cid, pista, onSaved }: { cid: string; pista?: Pista; onSaved: () => void }) {
  const [name, setName] = useState(pista?.name ?? '')
  const [address, setAddress] = useState(pista?.address ?? '')
  const [lat, setLat] = useState<string>(pista?.lat?.toString() ?? '')
  const [lng, setLng] = useState<string>(pista?.lng?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) { showToast('Nombre requerido'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: name.trim(),
      address: address.trim() || null,
      lat: lat === '' ? null : Number(lat),
      lng: lng === '' ? null : Number(lng),
    }
    const { error } = pista
      ? await supabase.from('pistas').update(payload).eq('id', pista.id)
      : await supabase.from('pistas').insert({ ...payload, community_id: cid })
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast(pista ? '✅ Pista actualizada' : '✅ Pista creada')
    onSaved()
  }

  return (
    <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
      <InlineField label="Nombre">
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="admin-input-sm" />
      </InlineField>
      <InlineField label="Dirección">
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="admin-input-sm" />
      </InlineField>
      <div className="grid grid-cols-2 gap-2">
        <InlineField label="Lat">
          <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} className="admin-input-sm tabular-nums" />
        </InlineField>
        <InlineField label="Lng">
          <input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} className="admin-input-sm tabular-nums" />
        </InlineField>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-2 rounded-m text-xs font-bold uppercase tracking-wider"
        style={{ background: 'var(--gold)', color: '#1a1205' }}
      >
        {saving ? 'Guardando…' : pista ? '💾 Guardar' : '+ Crear pista'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider mb-0.5 block" style={{ color: 'var(--muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function AdminStyles() {
  return (
    <style jsx>{`
      :global(.admin-input) {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        background: var(--card);
        border: 1px solid var(--border);
        color: var(--text);
        font-size: 14px;
        outline: none;
      }
      :global(.admin-input:focus) {
        border-color: var(--gold);
      }
      :global(.admin-input-sm) {
        width: 100%;
        padding: 6px 8px;
        border-radius: 8px;
        background: var(--bg);
        border: 1px solid var(--border);
        color: var(--text);
        font-size: 12px;
        outline: none;
      }
      :global(.admin-input-sm:focus) {
        border-color: var(--gold);
      }
    `}</style>
  )
}
