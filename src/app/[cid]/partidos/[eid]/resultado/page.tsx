'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useEvent } from '@/hooks/useEvents'
import { usePlayers } from '@/hooks/usePlayers'
import { useVotes } from '@/hooks/useVotes'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { TeamGenerator } from '@/components/players/TeamGenerator'
import { Modal } from '@/components/ui/Modal'
import { calcXP, detectBadges, BADGE_DEFS } from '@/lib/game/badges'
import { uid } from '@/lib/utils'
import type { MatchPlayerStats, Player } from '@/types'

interface ResultadoPageProps {
  params: { cid: string; eid: string }
}

export default function ResultadoPage({ params }: ResultadoPageProps) {
  const { cid, eid } = params
  const router = useRouter()
  const session = useSession()
  const { event } = useEvent(eid)
  const { players, reload: reloadPlayers } = usePlayers(cid)
  const { votes } = useVotes(cid)

  const [golesA, setGolesA] = useState(0)
  const [golesB, setGolesB] = useState(0)
  const [equipoA, setEquipoA] = useState<string[]>([])
  const [equipoB, setEquipoB] = useState<string[]>([])
  const [mvpId, setMvpId] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, MatchPlayerStats>>({})
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'equipos' | 'resultado' | 'stats'>('equipos')
  const [genOpen, setGenOpen] = useState(false)

  // Jugadores confirmados (solo 'si')
  const confirmados = useMemo(() => {
    if (!event?.confirmations) return []
    return event.confirmations
      .filter(c => c.status === 'si')
      .map(c => players.find(p => p.id === c.player_id))
      .filter(Boolean) as Player[]
  }, [event, players])

  const allPlayers = [...equipoA, ...equipoB]

  function initStats(pid: string): MatchPlayerStats {
    return stats[pid] ?? {
      goles: 0, asistencias: 0, porteria_cero: false,
      parada_penalti: false, chilena: false, olimpico: false, tacon: false,
    }
  }

  function updateStat(pid: string, key: keyof MatchPlayerStats, value: number | boolean) {
    setStats(prev => ({
      ...prev,
      [pid]: { ...initStats(pid), [key]: value },
    }))
  }

  function handleTeamsSet(a: string[], b: string[]) {
    setEquipoA(a)
    setEquipoB(b)
    // Init stats for all players
    const init: Record<string, MatchPlayerStats> = {}
    ;[...a, ...b].forEach(pid => { init[pid] = initStats(pid) })
    setStats(init)
    setStep('resultado')
  }

  async function saveResultado() {
    if (!event) return
    setSaving(true)
    const supabase = createClient()

    // 1. Update event with result
    await supabase.from('events').update({
      finalizado: true,
      goles_a: golesA,
      goles_b: golesB,
      equipo_a: equipoA,
      equipo_b: equipoB,
      mvp_id: mvpId,
    }).eq('id', eid)

    // 2. Insert match_players + update player stats + detect badges
    for (const pid of allPlayers) {
      const ps = initStats(pid)
      const equipo = equipoA.includes(pid) ? 'A' : 'B'
      const isMVP = mvpId === pid
      const player = players.find(p => p.id === pid)
      if (!player) continue

      const mpData = {
        id: uid(),
        event_id: eid,
        player_id: pid,
        goles: ps.goles,
        asistencias: ps.asistencias,
        porteria_cero: ps.porteria_cero,
        parada_penalti: ps.parada_penalti,
        chilena: ps.chilena,
        olimpico: ps.olimpico,
        tacon: ps.tacon,
        equipo,
        xp_ganado: 0,
      }

      // Calc XP
      const xpGanado = calcXP(mpData as any, isMVP)
      mpData.xp_ganado = xpGanado

      await supabase.from('match_players').upsert(mpData)

      // Update player stats
      const updatedPlayer = {
        ...player,
        partidos: player.partidos + 1,
        goles: player.goles + ps.goles,
        asistencias: player.asistencias + ps.asistencias,
        mvps: player.mvps + (isMVP ? 1 : 0),
        partidos_cero: player.partidos_cero + (ps.porteria_cero ? 1 : 0),
        xp: player.xp + xpGanado,
      }

      // Detect new badges
      const newBadges = detectBadges(updatedPlayer, mpData as any, isMVP)
      const allBadges = [...player.badges, ...newBadges]

      // Sum badge XP
      const badgeXP = newBadges.reduce((sum, key) => {
        return sum + (BADGE_DEFS[key]?.xp ?? 0)
      }, 0)

      await supabase.from('players').update({
        partidos: updatedPlayer.partidos,
        goles: updatedPlayer.goles,
        asistencias: updatedPlayer.asistencias,
        mvps: updatedPlayer.mvps,
        partidos_cero: updatedPlayer.partidos_cero,
        xp: updatedPlayer.xp + badgeXP,
        badges: allBadges,
      }).eq('id', pid)
    }

    showToast('🏁 Resultado guardado')
    reloadPlayers()
    router.push(`/${cid}/partidos/${eid}`)
    setSaving(false)
  }

  if (session.role !== 'admin') {
    return <div className="p-4" style={{ color: 'var(--muted)' }}>Solo admin puede registrar resultados</div>
  }

  return (
    <div className="view-enter">
      <Header
        title="Registrar resultado"
        left={
          <button onClick={() => router.back()} style={{ color: 'var(--muted)' }}>←</button>
        }
      />

      <div className="px-4 space-y-4 pt-2">
        {/* Step 1: Teams */}
        {step === 'equipos' && (
          <div className="space-y-4">
            <Card>
              <p className="font-bold text-sm mb-2">Selecciona los equipos</p>
              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                Puedes usar el generador automatico o arrastrar manualmente
              </p>
              <Button className="w-full" onClick={() => setGenOpen(true)}>
                ⚡ Generar equipos
              </Button>
            </Card>

            {/* Manual selection */}
            <div className="grid grid-cols-2 gap-3">
              {['A', 'B'].map(team => {
                const teamPlayers = team === 'A' ? equipoA : equipoB
                return (
                  <Card key={team}>
                    <p className="font-bebas text-xl text-center tracking-wider mb-2" style={{ color: session.communityColor }}>
                      Equipo {team}
                    </p>
                    {teamPlayers.map(pid => {
                      const p = players.find(pl => pl.id === pid)
                      if (!p) return null
                      return (
                        <div key={pid} className="flex items-center gap-2 py-1">
                          <PlayerAvatar player={p} size={24} communityColor={session.communityColor} />
                          <span className="text-xs font-semibold truncate">{p.name}</span>
                        </div>
                      )
                    })}
                    {teamPlayers.length === 0 && (
                      <p className="text-xs text-center py-3" style={{ color: 'var(--muted)' }}>Sin jugadores</p>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* Add players manually */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                Jugadores disponibles
              </p>
              <div className="space-y-1">
                {confirmados.filter(p => !allPlayers.includes(p.id)).map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <PlayerAvatar player={p} size={28} communityColor={session.communityColor} />
                    <span className="text-xs font-semibold flex-1">{p.name}</span>
                    <button
                      onClick={() => setEquipoA(prev => [...prev, p.id])}
                      className="text-xs px-2 py-1 rounded font-bold"
                      style={{ background: 'var(--card)', color: session.communityColor }}
                    >
                      → A
                    </button>
                    <button
                      onClick={() => setEquipoB(prev => [...prev, p.id])}
                      className="text-xs px-2 py-1 rounded font-bold"
                      style={{ background: 'var(--card)', color: session.communityColor }}
                    >
                      → B
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {allPlayers.length >= 2 && (
              <Button className="w-full" onClick={() => setStep('resultado')}>
                Siguiente →
              </Button>
            )}
          </div>
        )}

        {/* Step 2: Score */}
        {step === 'resultado' && (
          <div className="space-y-4">
            <Card highlighted>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                  Marcador final
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="font-bebas text-sm tracking-wider" style={{ color: session.communityColor }}>
                      Equipo A
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setGolesA(Math.max(0, golesA - 1))}
                        className="w-9 h-9 rounded-full text-lg font-bold"
                        style={{ background: 'var(--card)', color: 'var(--text)' }}
                      >
                        −
                      </button>
                      <span className="font-bebas text-5xl w-12 text-center">{golesA}</span>
                      <button
                        onClick={() => setGolesA(golesA + 1)}
                        className="w-9 h-9 rounded-full text-lg font-bold"
                        style={{ background: session.communityColor, color: '#050d05' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="font-bebas text-3xl" style={{ color: 'var(--muted)' }}>—</span>
                  <div className="text-center">
                    <p className="font-bebas text-sm tracking-wider" style={{ color: session.communityColor }}>
                      Equipo B
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setGolesB(Math.max(0, golesB - 1))}
                        className="w-9 h-9 rounded-full text-lg font-bold"
                        style={{ background: 'var(--card)', color: 'var(--text)' }}
                      >
                        −
                      </button>
                      <span className="font-bebas text-5xl w-12 text-center">{golesB}</span>
                      <button
                        onClick={() => setGolesB(golesB + 1)}
                        className="w-9 h-9 rounded-full text-lg font-bold"
                        style={{ background: session.communityColor, color: '#050d05' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* MVP selection */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                👑 MVP del partido
              </p>
              <div className="flex flex-wrap gap-2">
                {allPlayers.map(pid => {
                  const p = players.find(pl => pl.id === pid)
                  if (!p) return null
                  const isSelected = mvpId === pid
                  return (
                    <button
                      key={pid}
                      onClick={() => setMvpId(isSelected ? null : pid)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-m text-xs font-bold transition-all"
                      style={{
                        background: isSelected ? session.communityColor : 'var(--card)',
                        color: isSelected ? '#050d05' : 'var(--muted)',
                        border: `1px solid ${isSelected ? 'transparent' : 'var(--border)'}`,
                      }}
                    >
                      <PlayerAvatar player={p} size={20} communityColor={session.communityColor} />
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep('equipos')}>
                ← Equipos
              </Button>
              <Button className="flex-1" onClick={() => setStep('stats')}>
                Stats →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Individual stats */}
        {step === 'stats' && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Estadisticas individuales
            </p>

            {allPlayers.map(pid => {
              const p = players.find(pl => pl.id === pid)
              if (!p) return null
              const ps = initStats(pid)
              const team = equipoA.includes(pid) ? 'A' : 'B'

              return (
                <Card key={pid}>
                  <div className="flex items-center gap-2 mb-3">
                    <PlayerAvatar player={p} size={32} communityColor={session.communityColor} />
                    <span className="font-bold text-sm flex-1">{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{ background: 'var(--card)', color: session.communityColor }}>
                      Eq. {team}
                    </span>
                    {mvpId === pid && <span className="text-sm">👑</span>}
                  </div>

                  {/* Goles + Asistencias counters */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { label: '⚽ Goles', key: 'goles' as const, val: ps.goles },
                      { label: '🎯 Asistencias', key: 'asistencias' as const, val: ps.asistencias },
                    ].map(stat => (
                      <div key={stat.key}>
                        <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{stat.label}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStat(pid, stat.key, Math.max(0, stat.val - 1))}
                            className="w-7 h-7 rounded text-sm font-bold"
                            style={{ background: 'var(--card)', color: 'var(--text)' }}
                          >
                            −
                          </button>
                          <span className="font-bebas text-xl w-6 text-center" style={{ color: session.communityColor }}>
                            {stat.val}
                          </span>
                          <button
                            onClick={() => updateStat(pid, stat.key, stat.val + 1)}
                            className="w-7 h-7 rounded text-sm font-bold"
                            style={{ background: session.communityColor, color: '#050d05' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'porteria_cero' as const, label: '🧤 P. cero', val: ps.porteria_cero },
                      { key: 'parada_penalti' as const, label: '🦸 Penalti', val: ps.parada_penalti },
                      { key: 'chilena' as const, label: '🦅 Chilena', val: ps.chilena },
                      { key: 'olimpico' as const, label: '🌊 Olímpico', val: ps.olimpico },
                      { key: 'tacon' as const, label: '👠 Tacón', val: ps.tacon },
                    ].map(toggle => (
                      <button
                        key={toggle.key}
                        onClick={() => updateStat(pid, toggle.key, !toggle.val)}
                        className="px-2 py-1 rounded text-xs font-bold transition-all"
                        style={{
                          background: toggle.val ? session.communityColor : 'var(--card)',
                          color: toggle.val ? '#050d05' : 'var(--muted)',
                          border: `1px solid ${toggle.val ? 'transparent' : 'var(--border)'}`,
                        }}
                      >
                        {toggle.label}
                      </button>
                    ))}
                  </div>
                </Card>
              )
            })}

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep('resultado')}>
                ← Marcador
              </Button>
              <Button className="flex-1" onClick={saveResultado} disabled={saving}>
                {saving ? 'Guardando...' : '🏁 Guardar resultado'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Team generator modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="⚡ Generar equipos">
        <TeamGenerator
          players={confirmados}
          votes={votes}
          communityColor={session.communityColor}
          onTeamsGenerated={(result) => {
            if (result) {
              handleTeamsSet(
                result.teamA.map(p => p.id),
                result.teamB.map(p => p.id)
              )
              setGenOpen(false)
            }
          }}
        />
      </Modal>
    </div>
  )
}
