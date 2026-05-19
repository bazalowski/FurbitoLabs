'use client'

import { useState } from 'react'
import { useSession } from '@/stores/session'
import { usePlayers } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { useVotes } from '@/hooks/useVotes'
import { RankingTable } from '@/components/ranking/RankingTable'
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
  const [adding, setAdding] = useState(false)

  const isAdmin = session.role === 'admin'
  const adminIds = community?.admin_ids ?? []
  const communityColor = session.communityColor || '#a8ff3e'

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
      position: null,
    })
    if (error) {
      showToast('Error al añadir jugador')
    } else {
      showToast(`${newName} añadido — PIN: ${code}`)
      setNewName('')
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
            {players.length >= 2 && (
              <Button size="sm" variant="ghost" onClick={() => setTeamGenOpen(true)} aria-label="Generar equipos">
                ⚡
              </Button>
            )}
            {isAdmin && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                + Añadir
              </Button>
            )}
          </div>
        }
      />

      <div className="px-4 pt-2 pb-28" style={{ ['--comm-color' as string]: communityColor }}>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : players.length === 0 ? (
          <div className="surface-calm text-center py-12">
            <p className="text-3xl mb-3" aria-hidden="true">👥</p>
            <p className="font-barlow text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
              Sin jugadores
            </p>
            {isAdmin && (
              <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                Añade el primer jugador para arrancar la comunidad.
              </p>
            )}
          </div>
        ) : (
          <RankingTable
            players={players}
            votes={votes}
            communityId={cid}
            communityColor={communityColor}
            adminIds={adminIds}
            currentPlayerId={session.playerId}
          />
        )}
      </div>

      {/* Team Generator Modal */}
      <Modal open={teamGenOpen} onClose={() => setTeamGenOpen(false)} title="⚡ Generador de equipos">
        <TeamGenerator players={players} votes={votes} communityColor={communityColor} />
      </Modal>

      {/* Add Player Modal — ventana interior a pantalla completa */}
      <Modal
        open={addOpen}
        onClose={() => { if (!adding) { setAddOpen(false); setNewName('') } }}
        title="Añadir jugador"
        variant="window"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); addPlayer() }}
          className="h-full flex flex-col justify-center gap-6 max-w-sm mx-auto w-full"
        >
          <Input
            label="Nombre"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre del jugador"
            autoFocus
          />

          <div className="surface-calm p-3 font-mono text-[11px] flex items-start gap-2" style={{ color: 'var(--muted)' }}>
            <span aria-hidden="true">🔑</span>
            <span>
              Se generará un PIN numérico de 4 dígitos para que el jugador pueda identificarse al entrar a la comunidad.
            </span>
          </div>

          <Button type="submit" disabled={adding || !newName.trim()} className="w-full">
            {adding ? 'Añadiendo...' : 'Añadir jugador'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
