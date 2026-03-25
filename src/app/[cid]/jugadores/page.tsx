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

      {/* Add Player Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Anadir jugador">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre del jugador"
          />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Se generara un PIN numerico de 4 digitos para que el jugador pueda identificarse.
          </p>
          <Button onClick={addPlayer} disabled={adding || !newName.trim()} className="w-full">
            {adding ? 'Anadiendo...' : 'Anadir jugador'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
