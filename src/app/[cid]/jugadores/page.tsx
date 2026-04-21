'use client'

import { useState } from 'react'
import { useSession } from '@/stores/session'
import { usePlayers } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { useVotes } from '@/hooks/useVotes'
import { PlayerCard } from '@/components/players/PlayerCard'
import { TeamGenerator } from '@/components/players/TeamGenerator'
import { Header } from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { uid, genPlayerCode } from '@/lib/utils'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface JugadoresPageProps {
  params: { cid: string }
}

export default function JugadoresPage({ params }: JugadoresPageProps) {
  const { cid } = params
  const session = useSession()
  const { players, loading, reload } = usePlayers(cid)
  const { community } = useCommunity(cid)
  const { votes } = useVotes(cid)

  const [teamGenOpen, setTeamGenOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPosition, setNewPosition] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const isAdmin = session.role === 'admin'
  const adminIds = community?.admin_ids ?? []

  async function addPlayer() {
    if (!newName.trim()) return
    setAdding(true)
    const supabase = createClient()
    const code = genPlayerCode()
    const { error } = await supabase.from('players').insert({
      id: uid(),
      community_id: cid,
      name: newName.trim(),
      code,
      position: newPosition || null,
    })
    if (error) {
      showToast('Error al anadir jugador')
    } else {
      showToast(`${newName} anadido - PIN: ${code}`)
      setNewName('')
      setNewPosition(null)
      setAddOpen(false)
      reload()
    }
    setAdding(false)
  }

  async function deletePlayer(playerId: string, playerName: string) {
    if (!confirm(`Eliminar a ${playerName}? Esta accion no se puede deshacer.`)) return
    // Prevent deleting yourself
    if (playerId === session.playerId) {
      showToast('No puedes eliminarte a ti mismo')
      return
    }
    // Prevent deleting other admins (only the primary admin can manage admins in settings)
    if (adminIds.includes(playerId)) {
      showToast('No puedes eliminar a un admin desde aqui. Usa Ajustes.')
      return
    }
    setDeleting(playerId)
    const supabase = createClient()
    const { error } = await supabase.from('players').delete().eq('id', playerId)
    if (error) {
      showToast('Error al eliminar jugador')
    } else {
      showToast(`${playerName} eliminado`)
      reload()
    }
    setDeleting(null)
  }

  return (
    <div className="view-enter">
      <Header
        title={`Jugadores (${players.length})`}
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setTeamGenOpen(true)}>
              {'\uD83C\uDFAF'}
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                + Anadir
              </Button>
            )}
          </div>
        }
      />

      <div className="px-4 space-y-2 pt-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : players.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
            <p className="text-3xl mb-3">{'\uD83D\uDC65'}</p>
            <p className="font-bold">Sin jugadores todavia</p>
            {isAdmin && <p className="text-sm mt-1">Anade el primer jugador</p>}
          </div>
        ) : (
          players.map((p, i) => (
            <div key={p.id} className="relative group">
              <PlayerCard
                player={p}
                communityId={cid}
                rank={i + 1}
                communityColor={session.communityColor}
                adminIds={adminIds}
                votes={votes}
              />
              {/* Delete button for admins (shown on the right side) */}
              {isAdmin && p.id !== session.playerId && !adminIds.includes(p.id) && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); deletePlayer(p.id, p.name) }}
                  disabled={deleting === p.id}
                  className="absolute top-1/2 -translate-y-1/2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    opacity: deleting === p.id ? 0.5 : undefined,
                  }}
                  title={`Eliminar a ${p.name}`}
                >
                  {'\u2715'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Team Generator Modal */}
      <Modal open={teamGenOpen} onClose={() => setTeamGenOpen(false)} title={'\u26A1 Generador de equipos'}>
        <TeamGenerator players={players} votes={votes} communityColor={session.communityColor} />
      </Modal>

      {/* Add Player Modal — ventana interior a pantalla completa */}
      <Modal
        open={addOpen}
        onClose={() => { if (!adding) { setAddOpen(false); setNewPosition(null); setNewName('') } }}
        title="Añadir jugador"
        variant="window"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); addPlayer() }}
          className="space-y-5 h-full flex flex-col"
        >
          <Input
            label="Nombre"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre del jugador"
            autoFocus
          />

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Posición (opcional)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {([
                { value: 'POR', label: 'POR', icon: '🧤' },
                { value: 'DEF', label: 'DEF', icon: '🛡️' },
                { value: 'MED', label: 'MED', icon: '🎯' },
                { value: 'DEL', label: 'DEL', icon: '⚽' },
              ] as const).map(pos => {
                const active = newPosition === pos.value
                return (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => setNewPosition(active ? null : pos.value)}
                    className="rounded-m py-3 text-xs font-bold flex flex-col items-center gap-1 active:scale-95 transition-all"
                    style={{
                      background: active ? 'var(--comm-color, var(--accent))' : 'var(--card)',
                      border: `1px solid ${active ? 'var(--comm-color, var(--accent))' : 'var(--border)'}`,
                      color: active ? '#050d05' : 'var(--text)',
                    }}
                  >
                    <span className="text-lg">{pos.icon}</span>
                    <span className="tracking-wider">{pos.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="rounded-m p-3 text-xs flex items-start gap-2"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            <span>🔑</span>
            <span>
              Se generará un PIN numérico de 4 dígitos para que el jugador pueda identificarse al entrar a la comunidad.
            </span>
          </div>

          <div className="flex-1" />

          <Button type="submit" disabled={adding || !newName.trim()} className="w-full">
            {adding ? 'Añadiendo...' : 'Añadir jugador'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
