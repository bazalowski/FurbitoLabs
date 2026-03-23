'use client'

import { useState } from 'react'
import { useSession } from '@/stores/session'
import { usePlayers } from '@/hooks/usePlayers'
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
  const { votes } = useVotes(cid)

  const [teamGenOpen, setTeamGenOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPosition, setNewPosition] = useState('')
  const [adding, setAdding] = useState(false)

  const isAdmin = session.role === 'admin'

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
      showToast('❌ Error al añadir jugador')
    } else {
      showToast(`✅ ${newName} añadido — Código: ${code}`)
      setNewName('')
      setNewPosition('')
      setAddOpen(false)
      reload()
    }
    setAdding(false)
  }

  return (
    <div className="view-enter">
      <Header
        title={`Jugadores (${players.length})`}
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setTeamGenOpen(true)}>
              🎯
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                + Añadir
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
            <p className="text-3xl mb-3">👥</p>
            <p className="font-bold">Sin jugadores todavía</p>
            {isAdmin && <p className="text-sm mt-1">Añade el primer jugador</p>}
          </div>
        ) : (
          players.map((p, i) => (
            <PlayerCard
              key={p.id}
              player={p}
              communityId={cid}
              rank={i + 1}
              communityColor={session.communityColor}
            />
          ))
        )}
      </div>

      {/* Team Generator Modal */}
      <Modal open={teamGenOpen} onClose={() => setTeamGenOpen(false)} title="⚡ Generador de equipos">
        <TeamGenerator players={players} votes={votes} communityColor={session.communityColor} />
      </Modal>

      {/* Add Player Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Añadir jugador">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre del jugador"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Posición (opcional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['portero', 'defensa', 'centrocampista', 'delantero'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setNewPosition(newPosition === pos ? '' : pos)}
                  className="py-2 rounded-m text-xs font-bold capitalize transition-all"
                  style={{
                    background: newPosition === pos ? 'var(--accent)' : 'var(--card)',
                    color: newPosition === pos ? '#050d05' : 'var(--muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Se generará un código único para que el jugador pueda identificarse.
          </p>
          <Button onClick={addPlayer} disabled={adding || !newName.trim()} className="w-full">
            {adding ? 'Añadiendo...' : '✅ Añadir jugador'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
