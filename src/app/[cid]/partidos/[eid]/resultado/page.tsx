'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { useEvent } from '@/hooks/useEvents'
import { usePlayers } from '@/hooks/usePlayers'
import { useVotes } from '@/hooks/useVotes'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { TeamGenerator } from '@/components/players/TeamGenerator'
import { calcXP, detectBadges, BADGE_DEFS, type DetectBadgeContext, type HistoryMatch } from '@/lib/game/badges'
import { calcMatchPoints, getPointsTier, MATCH_POINTS } from '@/lib/game/scoring'
import { uid } from '@/lib/utils'
import { notifyMatchFinished, notifyBadgeEarned, notifyMvpSelected } from '@/lib/notifications/notification-service'
import type { MatchPlayerStats, Player } from '@/types'

type Step = 'marcador' | 'stats' | 'resumen'

const STEP_META: { key: Step; label: string }[] = [
  { key: 'marcador', label: 'Marcador' },
  { key: 'stats',    label: 'Stats' },
  { key: 'resumen',  label: 'Confirmar' },
]

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
  const [step, setStep] = useState<Step>('marcador')
  const [genOpen, setGenOpen] = useState(false)

  const communityColor = session.communityColor

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
      goles: 0, asistencias: 0, porteria_cero: 0,
      parada_penalti: false, chilena: false, olimpico: false, tacon: false,
    }
  }

  function updateStat(pid: string, key: keyof MatchPlayerStats, value: number | boolean) {
    setStats(prev => ({ ...prev, [pid]: { ...initStats(pid), [key]: value } }))
  }

  function togglePlayer(pid: string, team: 'A' | 'B') {
    const inA = equipoA.includes(pid)
    const inB = equipoB.includes(pid)
    if (team === 'A') {
      setEquipoA(prev => inA ? prev.filter(id => id !== pid) : [...prev, pid])
      if (inB) setEquipoB(prev => prev.filter(id => id !== pid))
    } else {
      setEquipoB(prev => inB ? prev.filter(id => id !== pid) : [...prev, pid])
      if (inA) setEquipoA(prev => prev.filter(id => id !== pid))
    }
  }

  function handleTeamsGenerated(a: string[], b: string[]) {
    setEquipoA(a); setEquipoB(b)
    const init: Record<string, MatchPlayerStats> = {}
    ;[...a, ...b].forEach(pid => { init[pid] = initStats(pid) })
    setStats(prev => ({ ...init, ...prev }))
    setGenOpen(false)
  }

  // ── Auto-validation ────────────────────────────────────────────
  const totalGolesA = equipoA.reduce((sum, pid) => sum + (stats[pid]?.goles ?? 0), 0)
  const totalGolesB = equipoB.reduce((sum, pid) => sum + (stats[pid]?.goles ?? 0), 0)
  const totalIndividual = totalGolesA + totalGolesB
  const totalMatch = golesA + golesB
  const goalsMatch = totalIndividual === totalMatch
  const hasStats = allPlayers.length > 0

  // ── Save ───────────────────────────────────────────────────────
  async function saveResultado() {
    if (!event) return
    setSaving(true)
    const supabase = createClient()

    // Pre-cargar historia de partidos finalizados (excluyendo el actual)
    // y conteo de pistas añadidas por cada jugador, para detectar badges
    // basados en rachas, pistas visitadas y horario acumulado.
    const [{ data: pastEventsData }, { data: pistasData }] = await Promise.all([
      supabase
        .from('events')
        .select(`id, fecha, hora, pista_id, goles_a, goles_b, equipo_a, equipo_b, mvp_id, finalizado, match_players(*)`)
        .eq('community_id', cid)
        .eq('finalizado', true)
        .neq('id', eid),
      supabase
        .from('pistas')
        .select('added_by')
        .eq('community_id', cid),
    ])

    type PastEventRow = {
      id: string; fecha: string | null; hora: string | null; pista_id: string | null
      goles_a: number | null; goles_b: number | null
      equipo_a: string[] | null; equipo_b: string[] | null
      mvp_id: string | null; finalizado: boolean
      match_players: Array<{
        player_id: string; goles: number; asistencias: number
        porteria_cero: number; parada_penalti: boolean
      }>
    }

    const historyByPlayer = new Map<string, HistoryMatch[]>()
    for (const ev of (pastEventsData ?? []) as PastEventRow[]) {
      for (const pmp of ev.match_players ?? []) {
        const team = ev.equipo_a?.includes(pmp.player_id) ? 'A'
                   : ev.equipo_b?.includes(pmp.player_id) ? 'B'
                   : null
        const hm: HistoryMatch = {
          fecha: ev.fecha, hora: ev.hora, pistaId: ev.pista_id,
          playerTeam: team, golesA: ev.goles_a, golesB: ev.goles_b,
          goles: pmp.goles, asistencias: pmp.asistencias,
          isMVP: ev.mvp_id === pmp.player_id,
          porteria_cero: (pmp.porteria_cero ?? 0) > 0,
          parada_penalti: pmp.parada_penalti,
        }
        const arr = historyByPlayer.get(pmp.player_id)
        if (arr) arr.push(hm); else historyByPlayer.set(pmp.player_id, [hm])
      }
    }
    // Ordenar cada historia por fecha desc (más reciente primero)
    Array.from(historyByPlayer.values()).forEach((arr: HistoryMatch[]) => {
      arr.sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
    })

    const pistasAddedByPlayer = new Map<string, number>()
    for (const row of (pistasData ?? []) as Array<{ added_by: string | null }>) {
      if (!row.added_by) continue
      pistasAddedByPlayer.set(row.added_by, (pistasAddedByPlayer.get(row.added_by) ?? 0) + 1)
    }

    // Cierre automático de votación MVP: 24h tras el guardado del resultado.
    const mvpVotingClosesAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('events').update({
      finalizado: true, goles_a: golesA, goles_b: golesB,
      equipo_a: equipoA, equipo_b: equipoB, mvp_id: mvpId,
      mvp_voting_closes_at: mvpVotingClosesAt,
    }).eq('id', eid)

    for (const pid of allPlayers) {
      const ps = initStats(pid)
      const equipo = equipoA.includes(pid) ? 'A' : 'B'
      const isMVP = mvpId === pid
      const player = players.find(p => p.id === pid)
      if (!player) continue

      const mpData = {
        id: uid(), event_id: eid, player_id: pid,
        goles: ps.goles, asistencias: ps.asistencias,
        porteria_cero: ps.porteria_cero, parada_penalti: ps.parada_penalti,
        chilena: ps.chilena, olimpico: ps.olimpico, tacon: ps.tacon,
        equipo, xp_ganado: 0,
      }
      const xpGanado = calcXP(mpData as any, isMVP)
      mpData.xp_ganado = xpGanado
      await supabase.from('match_players').upsert(mpData)

      const updatedPlayer = {
        ...player,
        partidos: player.partidos + 1, goles: player.goles + ps.goles,
        asistencias: player.asistencias + ps.asistencias,
        mvps: player.mvps + (isMVP ? 1 : 0),
        partidos_cero: player.partidos_cero + ps.porteria_cero,
        xp: player.xp + xpGanado,
      }

      const ctx: DetectBadgeContext = {
        matchScore: { golesA, golesB, playerTeam: equipo },
        matchMeta: { fecha: event.fecha, hora: event.hora, pistaId: event.pista_id },
        history: historyByPlayer.get(pid) ?? [],
        pistasStats: { addedByPlayer: pistasAddedByPlayer.get(pid) ?? 0 },
      }
      const newBadges = detectBadges(updatedPlayer, mpData as any, isMVP, ctx)
      const allBadges = [...player.badges, ...newBadges]

      if (newBadges.length > 0) {
        const badgeUrl = `/${cid}/partidos/${eid}`
        newBadges.forEach(key => {
          const def = BADGE_DEFS[key]
          if (def) notifyBadgeEarned(pid, def.name, def.icon, badgeUrl)
        })
      }
      const badgeXP = newBadges.reduce((sum, key) => sum + (BADGE_DEFS[key]?.xp ?? 0), 0)

      await supabase.from('players').update({
        partidos: updatedPlayer.partidos, goles: updatedPlayer.goles,
        asistencias: updatedPlayer.asistencias, mvps: updatedPlayer.mvps,
        partidos_cero: updatedPlayer.partidos_cero,
        xp: updatedPlayer.xp + badgeXP, badges: allBadges,
      }).eq('id', pid)
    }

    showToast('🏁 Resultado guardado')
    const eventUrl = `/${cid}/partidos/${eid}`
    notifyMatchFinished(cid, event.titulo, golesA, golesB, eventUrl)
    if (mvpId) notifyMvpSelected(mvpId, event.titulo, eventUrl)
    reloadPlayers()
    router.push(`/${cid}/partidos/${eid}`)
    setSaving(false)
  }

  if (session.role !== 'admin') {
    return <div className="p-4" style={{ color: 'var(--muted)' }}>Solo admin puede registrar resultados</div>
  }

  const stepIndex = STEP_META.findIndex(s => s.key === step)

  return (
    <div className="view-enter">
      <Header
        title="Resultado"
        left={<button onClick={() => router.back()} style={{ color: 'var(--muted)' }}>←</button>}
      />

      <div className="px-4 pt-3 pb-28 space-y-5">

        {/* ── Stepper ─────────────────────────────────────── */}
        <div className="flex items-center gap-0">
          {STEP_META.map((s, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: done ? communityColor : active ? communityColor : 'var(--card)',
                      color: done || active ? '#000' : 'var(--muted)',
                      border: done || active ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: active ? communityColor : 'var(--muted)' }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-1 mb-4 transition-all"
                    style={{ background: done ? communityColor : 'var(--border)' }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Step 1: Marcador ──────────────────────────── */}
        {step === 'marcador' && (
          <div className="space-y-4">
            {/* Score */}
            <div
              className="rounded-m p-5"
              style={{ background: 'var(--card)', border: `1px solid ${communityColor}33` }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-center mb-4" style={{ color: 'var(--muted)' }}>
                Marcador final
              </p>
              <div className="flex items-center justify-center gap-4">
                {([
                  { label: 'Equipo A', val: golesA, set: setGolesA },
                  { label: 'Equipo B', val: golesB, set: setGolesB },
                ] as const).map((team, i) => (
                  <div key={team.label} className="flex-1 text-center">
                    <p className="text-xs font-bold mb-3" style={{ color: communityColor }}>{team.label}</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => team.set(Math.max(0, team.val - 1))}
                        className="w-11 h-11 rounded-full text-lg font-bold active:scale-[0.95] select-none"
                        style={{ background: 'var(--card2)', color: 'var(--fg)' }}
                      >−</button>
                      <span className="font-bebas text-5xl w-10 text-center" style={{ color: communityColor }}>
                        {team.val}
                      </span>
                      <button
                        onClick={() => team.set(team.val + 1)}
                        className="w-11 h-11 rounded-full text-lg font-bold active:scale-[0.95] select-none"
                        style={{ background: communityColor, color: '#050d05' }}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teams */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Asignar jugadores
                </p>
                <button
                  onClick={() => setGenOpen(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-m active:scale-95"
                  style={{ background: communityColor + '22', color: communityColor }}
                >
                  ⚡ Auto-generar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Equipo A', ids: equipoA },
                  { label: 'Equipo B', ids: equipoB },
                ].map(({ label, ids }) => (
                  <div key={label} className="rounded-m p-3 min-h-[80px]"
                    style={{ background: 'var(--card)', border: `1px solid ${communityColor}22` }}>
                    <p className="text-xs font-bold mb-2 text-center" style={{ color: communityColor }}>{label}</p>
                    {ids.map(pid => {
                      const p = players.find(pl => pl.id === pid)
                      return p ? (
                        <div key={pid} className="flex items-center gap-1.5 mb-1">
                          <PlayerAvatar player={p} size={22} communityColor={communityColor} />
                          <span className="text-xs truncate">{p.name}</span>
                        </div>
                      ) : null
                    })}
                    {ids.length === 0 && (
                      <p className="text-[10px] text-center mt-2" style={{ color: 'var(--muted)' }}>Sin jugadores</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Player assignment list */}
              <div className="rounded-m overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                {confirmados.map((p, i) => {
                  const inA = equipoA.includes(p.id)
                  const inB = equipoB.includes(p.id)
                  return (
                    <div key={p.id}
                      className="flex items-center gap-2 px-3 py-2.5"
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                    >
                      <PlayerAvatar player={p} size={28} communityColor={communityColor} />
                      <span className="text-xs font-semibold flex-1 truncate">{p.name}</span>
                      <div className="flex gap-1">
                        {(['A', 'B'] as const).map(t => {
                          const active = t === 'A' ? inA : inB
                          return (
                            <button key={t}
                              onClick={() => togglePlayer(p.id, t)}
                              className="w-9 h-9 rounded-m text-xs font-bold transition-all active:scale-95"
                              style={{
                                background: active ? communityColor : 'var(--card2)',
                                color: active ? '#000' : 'var(--muted)',
                                border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                              }}
                            >
                              {t}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* MVP */}
            {allPlayers.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                  👑 MVP del partido
                </p>
                <div className="flex flex-wrap gap-2">
                  {allPlayers.map(pid => {
                    const p = players.find(pl => pl.id === pid)
                    if (!p) return null
                    const sel = mvpId === pid
                    return (
                      <button key={pid}
                        onClick={() => setMvpId(sel ? null : pid)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-m text-xs font-bold transition-all active:scale-95 min-h-[44px]"
                        style={{
                          background: sel ? communityColor : 'var(--card)',
                          color: sel ? '#050d05' : 'var(--muted)',
                          border: `1px solid ${sel ? 'transparent' : 'var(--border)'}`,
                        }}
                      >
                        <PlayerAvatar player={p} size={20} communityColor={communityColor} />
                        {p.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => { if (allPlayers.length >= 2) { const init: Record<string, MatchPlayerStats> = {}; allPlayers.forEach(pid => { init[pid] = initStats(pid) }); setStats(prev => ({ ...init, ...prev })); setStep('stats') } else showToast('Asigna al menos 2 jugadores') }}
              className="w-full h-12 rounded-m font-bold text-sm uppercase tracking-wide active:scale-[0.98] transition-transform"
              style={{ background: communityColor, color: '#000' }}
            >
              Stats individuales →
            </button>
          </div>
        )}

        {/* ── Step 2: Stats individuales ────────────────── */}
        {step === 'stats' && (
          <div className="space-y-3">
            {/* Auto-validation banner */}
            {hasStats && (
              <div
                className="flex items-center gap-3 rounded-m px-4 py-3"
                style={{
                  background: goalsMatch ? communityColor + '15' : '#ef444415',
                  border: `1px solid ${goalsMatch ? communityColor + '44' : '#ef444444'}`,
                }}
              >
                <span className="text-lg">{goalsMatch ? '✅' : '⚠️'}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: goalsMatch ? communityColor : '#ef4444' }}>
                    {goalsMatch ? 'Goles cuadran' : 'Goles no cuadran'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Individual: {totalGolesA}+{totalGolesB}={totalIndividual} · Marcador: {golesA}+{golesB}={totalMatch}
                  </p>
                </div>
              </div>
            )}

            {allPlayers.map(pid => {
              const p = players.find(pl => pl.id === pid)
              if (!p) return null
              const ps = initStats(pid)
              const team = equipoA.includes(pid) ? 'A' : 'B'

              return (
                <div key={pid} className="rounded-m p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <PlayerAvatar player={p} size={32} communityColor={communityColor} />
                    <span className="font-bold text-sm flex-1">{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{ background: communityColor + '22', color: communityColor }}>
                      Eq.{team}
                    </span>
                    {mvpId === pid && <span className="text-sm">👑</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { label: '⚽ Goles', key: 'goles' as const, val: ps.goles },
                      { label: '🎯 Asistencias', key: 'asistencias' as const, val: ps.asistencias },
                      { label: '🧤 P. a cero', key: 'porteria_cero' as const, val: ps.porteria_cero, hint: 'Los porteros rotan, pueden ser >1' },
                    ].map(stat => (
                      <div key={stat.key} className={stat.key === 'porteria_cero' ? 'col-span-2' : ''}>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</p>
                          {'hint' in stat && stat.hint && (
                            <p className="text-[10px]" style={{ color: 'var(--muted)', opacity: 0.7 }}>{stat.hint}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStat(pid, stat.key, Math.max(0, stat.val - 1))}
                            className="w-11 h-11 rounded text-sm font-bold active:scale-[0.95] select-none"
                            style={{ background: 'var(--card2)', color: 'var(--fg)' }}
                          >−</button>
                          <span className="font-bebas text-2xl w-6 text-center" style={{ color: communityColor }}>
                            {stat.val}
                          </span>
                          <button
                            onClick={() => updateStat(pid, stat.key, stat.val + 1)}
                            className="w-11 h-11 rounded text-sm font-bold active:scale-[0.95] select-none"
                            style={{ background: communityColor, color: '#050d05' }}
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'parada_penalti' as const, label: '🦸 Penalti' },
                      { key: 'chilena' as const, label: '🦅 Chilena' },
                      { key: 'olimpico' as const, label: '🌊 Olímpico' },
                      { key: 'tacon' as const, label: '👠 Tacón' },
                    ].map(t => {
                      const val = ps[t.key] as boolean
                      return (
                        <button key={t.key}
                          onClick={() => updateStat(pid, t.key, !val)}
                          className="px-2.5 py-2 rounded text-xs font-bold transition-all active:scale-[0.95] select-none"
                          style={{
                            minHeight: '40px',
                            background: val ? communityColor : 'var(--card2)',
                            color: val ? '#050d05' : 'var(--muted)',
                            border: `1px solid ${val ? 'transparent' : 'var(--border)'}`,
                          }}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Puntos Comunio en vivo */}
                  {(() => {
                    const bd = calcMatchPoints(ps)
                    const tier = getPointsTier(bd.total)
                    return (
                      <div className="mt-3 flex items-center justify-between rounded-m px-3 py-2"
                        style={{ background: 'var(--card2)', border: `1px solid ${tier.color}55` }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Puntos
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                            3 + {bd.goles} + {bd.asistencias} + {bd.porterias}
                          </p>
                          <span className="font-bebas text-xl leading-none px-2 py-0.5 rounded"
                            style={{ background: tier.gradient, color: tier.fg, letterSpacing: '-0.02em' }}>
                            {bd.total}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )
            })}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep('marcador')}
                className="flex-1 h-11 rounded-m font-bold text-sm active:scale-95"
                style={{ background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                ← Marcador
              </button>
              <button onClick={() => setStep('resumen')}
                className="flex-1 h-11 rounded-m font-bold text-sm active:scale-95"
                style={{ background: communityColor, color: '#000' }}>
                Resumen →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Resumen + confirmar ───────────────── */}
        {step === 'resumen' && (
          <div className="space-y-4">
            {/* Score summary */}
            <div className="rounded-m p-5 text-center"
              style={{ background: communityColor + '11', border: `1px solid ${communityColor}44` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Marcador</p>
              <p className="font-bebas text-6xl tracking-widest" style={{ color: communityColor }}>
                {golesA} — {golesB}
              </p>
              {mvpId && (() => {
                const mvp = players.find(p => p.id === mvpId)
                return mvp ? (
                  <p className="text-sm mt-2" style={{ color: 'var(--gold, #ffd700)' }}>👑 MVP: {mvp.name}</p>
                ) : null
              })()}
            </div>

            {/* Auto-validation warning (non-blocking) */}
            {!goalsMatch && (
              <div className="flex items-center gap-3 rounded-m px-4 py-3"
                style={{ background: '#ef444415', border: '1px solid #ef444444' }}>
                <span className="text-lg">⚠️</span>
                <p className="text-xs" style={{ color: '#ef4444' }}>
                  Goles individuales ({totalIndividual}) no coinciden con el marcador ({totalMatch}). Puedes guardar igualmente.
                </p>
              </div>
            )}

            {/* Teams + stats summary */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Equipo A', ids: equipoA },
                { label: 'Equipo B', ids: equipoB },
              ].map(({ label, ids }) => (
                <div key={label} className="rounded-m p-3"
                  style={{ background: 'var(--card)', border: `1px solid ${communityColor}22` }}>
                  <p className="text-xs font-bold text-center mb-2" style={{ color: communityColor }}>{label}</p>
                  {ids.map(pid => {
                    const p = players.find(pl => pl.id === pid)
                    if (!p) return null
                    const ps = initStats(pid)
                    return (
                      <div key={pid} className="flex items-center gap-1.5 mb-1.5">
                        <PlayerAvatar player={p} size={22} communityColor={communityColor} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{p.name}</p>
                          {(ps.goles > 0 || ps.asistencias > 0 || ps.porteria_cero > 0) && (
                            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                              {ps.goles > 0 && `⚽${ps.goles}`}
                              {ps.goles > 0 && ps.asistencias > 0 && ' '}
                              {ps.asistencias > 0 && `🎯${ps.asistencias}`}
                              {(ps.goles > 0 || ps.asistencias > 0) && ps.porteria_cero > 0 && ' '}
                              {ps.porteria_cero > 0 && `🧤${ps.porteria_cero > 1 ? `×${ps.porteria_cero}` : ''}`}
                            </p>
                          )}
                        </div>
                        {mvpId === pid && <span className="text-xs">👑</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* ── Puntos Comunio: repartir puntos al final del partido ── */}
            {allPlayers.length > 0 && (() => {
              const rows = allPlayers
                .map(pid => {
                  const p = players.find(pl => pl.id === pid)
                  if (!p) return null
                  const ps = initStats(pid)
                  const bd = calcMatchPoints(ps)
                  const tier = getPointsTier(bd.total)
                  return { pid, p, ps, bd, tier }
                })
                .filter(Boolean) as Array<{
                  pid: string; p: Player; ps: MatchPlayerStats
                  bd: ReturnType<typeof calcMatchPoints>
                  tier: ReturnType<typeof getPointsTier>
                }>
              const sorted = [...rows].sort((a, b) => b.bd.total - a.bd.total)

              return (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      🎖️ Puntos Comunio
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      Partido {MATCH_POINTS.partido}pt · Gol {MATCH_POINTS.gol}pt · Asist {MATCH_POINTS.asistencia}pt · P.cero {MATCH_POINTS.porteria_cero}pt
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {sorted.map(({ pid, p, ps, bd, tier }) => {
                      const isLegend = tier.key === 'leyenda'
                      return (
                        <div
                          key={pid}
                          className={`flex items-center gap-2.5 rounded-m px-3 py-2.5 ${isLegend ? 'legend-halo' : ''}`}
                          style={{
                            background: 'var(--card)',
                            borderLeft: `3px solid ${tier.color}`,
                            border: `1px solid ${tier.color}44`,
                            borderLeftWidth: 3,
                          }}
                        >
                          <PlayerAvatar player={p} size={28} communityColor={communityColor} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-bold truncate">{p.name}</p>
                              {mvpId === pid && <span className="text-xs" aria-hidden="true">👑</span>}
                            </div>
                            <p className="text-[10px] leading-tight" style={{ color: 'var(--muted)' }}>
                              <span style={{ color: tier.color, fontWeight: 700 }}>{tier.label}</span>
                              <span> · </span>
                              <span>
                                {MATCH_POINTS.partido}
                                {ps.goles > 0 && ` + ${bd.goles}⚽`}
                                {ps.asistencias > 0 && ` + ${bd.asistencias}🎯`}
                                {ps.porteria_cero > 0 && ` + ${bd.porterias}🧤`}
                              </span>
                            </p>
                          </div>
                          <span
                            className={`font-bebas text-2xl leading-none rounded-m px-3 py-1.5 ${isLegend ? 'legend-rainbow' : ''}`}
                            style={{
                              background: isLegend ? undefined : tier.gradient,
                              color: tier.fg,
                              letterSpacing: '-0.02em',
                              boxShadow: isLegend ? undefined : tier.glow,
                              minWidth: 54,
                              textAlign: 'center',
                            }}
                          >
                            {bd.total}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Leyenda compacta de tiers */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[
                      { color: '#ef4444', label: '<5 mal' },
                      { color: '#f97316', label: '5–7 regular' },
                      { color: '#22c55e', label: '8–10 bueno' },
                      { color: '#06b6d4', label: '11–19 excelente' },
                    ].map(t => (
                      <span key={t.label}
                        className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-1"
                        style={{ background: 'var(--card2)', color: t.color, border: `1px solid ${t.color}55` }}>
                        ● {t.label}
                      </span>
                    ))}
                    <span
                      className="legend-rainbow text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-1"
                      style={{ color: '#fff' }}>
                      ★ 20+ leyenda
                    </span>
                  </div>
                </div>
              )
            })()}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep('stats')}
                className="flex-1 h-11 rounded-m font-bold text-sm active:scale-95"
                style={{ background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                ← Stats
              </button>
              <button onClick={saveResultado} disabled={saving}
                className="flex-1 h-12 rounded-m font-bold text-sm uppercase tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50"
                style={{ background: communityColor, color: '#000' }}>
                {saving ? 'Guardando...' : '🏁 Confirmar resultado'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team generator modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="⚡ Generar equipos">
        <TeamGenerator
          players={confirmados}
          votes={votes}
          communityColor={communityColor}
          onTeamsGenerated={(result) => {
            if (result) {
              handleTeamsGenerated(result.teamA.map(p => p.id), result.teamB.map(p => p.id))
            }
          }}
        />
      </Modal>
    </div>
  )
}
