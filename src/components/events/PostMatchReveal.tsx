'use client'

import { useMemo } from 'react'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { calcMatchPoints, getPointsTier, MATCH_POINTS } from '@/lib/game/scoring'
import { calcXP } from '@/lib/game/badges'
import { useReveal } from '@/hooks/useReveal'
import { fmtDate } from '@/lib/utils'
import type { Event, Player, MatchPlayer } from '@/types'

interface PostMatchRevealProps {
  event: Event
  matchPlayers: MatchPlayer[]
  players: Player[]
  communityColor: string
  currentPlayerId?: string | null
}

/**
 * Rediseño post-match como narrativa de 7 beats (arena):
 *   1. Score slab — marcador protagonista
 *   2. MVP reveal — card aparte con avatar grande (o votación en curso)
 *   3. Tu partido — card personalizada del jugador actual
 *   4. Podio del partido — top 3 por puntos de ESTE partido
 *   5. Tablas por equipo — referencia detallada
 *   6. Hazañas — chips de achievements (chilenas, olímpicos, paradas)
 *   7. Resumen — scorers / assisters / top XP
 *
 * Este componente encapsula todo el núcleo gamificado del partido finalizado.
 * Cada beat usa `useReveal` para que la animación se dispare una vez al entrar
 * en viewport (nunca idle permanente).
 */
export function PostMatchReveal({
  event,
  matchPlayers,
  players,
  communityColor,
  currentPlayerId = null,
}: PostMatchRevealProps) {
  const scoreRef = useReveal<HTMLDivElement>({ threshold: 0.3 })
  const mvpRef = useReveal<HTMLDivElement>({ threshold: 0.3, delay: 180 })
  const youRef = useReveal<HTMLDivElement>({ threshold: 0.3, delay: 300 })
  const podiumRef = useReveal<HTMLDivElement>({ threshold: 0.25, delay: 420 })

  const getPlayer = (pid: string) => players.find(p => p.id === pid)
  const getName = (pid: string) => getPlayer(pid)?.name ?? '???'
  const mpByPid = useMemo(() => new Map(matchPlayers.map(mp => [mp.player_id, mp])), [matchPlayers])

  const a = event.goles_a
  const b = event.goles_b
  const hasScore = a != null && b != null
  const winnerSide: 'A' | 'B' | 'draw' | null = hasScore
    ? a > b ? 'A' : b > a ? 'B' : 'draw'
    : null

  // Rows: todos los jugadores del partido con sus puntos calculados
  const rows = useMemo(() => {
    return matchPlayers
      .map(mp => {
        const p = getPlayer(mp.player_id)
        if (!p) return null
        const bd = calcMatchPoints({
          goles: mp.goles,
          asistencias: mp.asistencias,
          porteria_cero: mp.porteria_cero,
        })
        const tier = getPointsTier(bd.total)
        return { player: p, mp, bd, tier, isMVP: event.mvp_id === p.id }
      })
      .filter(Boolean) as Array<{
        player: Player
        mp: MatchPlayer
        bd: ReturnType<typeof calcMatchPoints>
        tier: ReturnType<typeof getPointsTier>
        isMVP: boolean
      }>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPlayers, players, event.mvp_id])

  const topThree = useMemo(
    () => [...rows].sort((x, y) => y.bd.total - x.bd.total).slice(0, 3),
    [rows],
  )

  const you = currentPlayerId ? rows.find(r => r.player.id === currentPlayerId) : null

  // Hazañas del partido
  const hazanaRows = useMemo(() => {
    const all: { name: string; feats: string[] }[] = []
    const labels: Record<string, string> = {
      chilena: 'Chilena', olimpico: 'Olímpico', tacon: 'Tacón',
      porteria_cero: 'P. a cero', parada_penalti: 'Paró penal',
    }
    for (const mp of matchPlayers) {
      const feats: string[] = []
      if (mp.chilena) feats.push(labels.chilena)
      if (mp.olimpico) feats.push(labels.olimpico)
      if (mp.tacon) feats.push(labels.tacon)
      if (mp.porteria_cero > 0) {
        feats.push(mp.porteria_cero > 1 ? `${labels.porteria_cero} ×${mp.porteria_cero}` : labels.porteria_cero)
      }
      if (mp.parada_penalti) feats.push(labels.parada_penalti)
      if (feats.length) all.push({ name: getName(mp.player_id), feats })
    }
    return all
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPlayers])

  const scorers   = matchPlayers.filter(mp => mp.goles > 0).sort((x, y) => y.goles - x.goles)
  const assisters = matchPlayers.filter(mp => mp.asistencias > 0).sort((x, y) => y.asistencias - x.asistencias)
  const topXP = rows
    .map(r => ({ pid: r.player.id, xp: calcXP(r.mp as never, r.isMVP) }))
    .sort((x, y) => y.xp - x.xp)[0]

  // ── Beat 1: Score slab ────────────────────────────────────────
  const renderScoreSlab = () => {
    if (!hasScore) {
      return (
        <div className="surface-calm text-center py-10">
          <p className="text-3xl mb-2" aria-hidden="true">🏁</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Partido no finalizado</p>
        </div>
      )
    }
    return (
      <div ref={scoreRef} className="score-slab is-reveal" style={{ ['--comm-color' as string]: communityColor }}>
        <div className="score-slab__score">
          <span className={winnerSide === 'A' ? 'win' : winnerSide === 'draw' ? '' : 'lose'}>{a}</span>
          <span className="sep">—</span>
          <span className={winnerSide === 'B' ? 'win' : winnerSide === 'draw' ? '' : 'lose'}>{b}</span>
        </div>
        <div className="score-slab__meta font-mono">
          <span>{fmtDate(event.fecha)}</span>
          {event.pista?.name && (
            <>
              <span className="divider-dot" aria-hidden="true" />
              <span className="truncate" style={{ maxWidth: 140 }}>{event.pista.name}</span>
            </>
          )}
          {winnerSide === 'draw' && (
            <>
              <span className="divider-dot" aria-hidden="true" />
              <span>Empate</span>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Beat 2: MVP reveal ────────────────────────────────────────
  const renderMvpReveal = () => {
    if (!event.mvp) return null
    const mvpPlayer = getPlayer(event.mvp.id) ?? event.mvp
    const mvpRow = rows.find(r => r.player.id === event.mvp?.id)
    return (
      <div
        ref={mvpRef}
        className="surface-arena is-reveal-pop p-4 flex items-center gap-4"
        style={{ ['--comm-color' as string]: communityColor, borderColor: '#ffd70066' }}
      >
        <div className="relative shrink-0" style={{ ['--aura-color' as string]: '#ffd700' }}>
          <span aria-hidden="true" className="aura-halo" style={{ inset: '-18%' }} />
          <PlayerAvatar player={mvpPlayer as Player} size={64} communityColor={communityColor} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-barlow text-[10px] font-bold uppercase tracking-widest" style={{ color: '#ffd700' }}>
            MVP del partido
          </p>
          <p className="font-bebas text-3xl leading-none tracking-display mt-0.5 truncate">
            {mvpPlayer.name}
          </p>
          {mvpRow && (
            <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
              <span>+10 XP</span>
              <span className="divider-dot" aria-hidden="true" />
              <span>{mvpRow.bd.total} pts Furbito</span>
            </p>
          )}
        </div>
        <span className="text-4xl shrink-0 micro-float" aria-hidden="true">👑</span>
      </div>
    )
  }

  // ── Beat 3: Tu partido ────────────────────────────────────────
  const renderYou = () => {
    if (!you) return null
    const isLegend = you.tier.key === 'leyenda'
    return (
      <div
        ref={youRef}
        className="surface-arena is-reveal p-4"
        style={{ ['--comm-color' as string]: communityColor }}
      >
        <p className="font-barlow text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: communityColor }}>
          Tu partido
        </p>
        <div className="flex items-center gap-4">
          <PlayerAvatar player={you.player} size={52} communityColor={communityColor} />
          <div className="flex-1 min-w-0">
            <p className="font-bebas text-xl leading-none tracking-display truncate">{you.player.name}</p>
            <p className="font-mono text-[11px] mt-1.5" style={{ color: 'var(--muted)' }}>
              <span>{MATCH_POINTS.partido} base</span>
              {you.mp.goles > 0 && (
                <>
                  <span className="divider-dot" aria-hidden="true" />
                  <span>+{you.bd.goles} goles</span>
                </>
              )}
              {you.mp.asistencias > 0 && (
                <>
                  <span className="divider-dot" aria-hidden="true" />
                  <span>+{you.bd.asistencias} asist</span>
                </>
              )}
              {you.mp.porteria_cero > 0 && (
                <>
                  <span className="divider-dot" aria-hidden="true" />
                  <span>+{you.bd.porterias} p.cero</span>
                </>
              )}
            </p>
          </div>
          <span
            className={isLegend ? 'chip-tier' : 'chip-tier'}
            data-tier={you.tier.key}
            style={{ fontSize: 28, minWidth: 64, minHeight: 44, padding: '6px 14px' }}
          >
            {you.bd.total}
          </span>
        </div>
        <p className="text-[11px] mt-2.5 font-bold" style={{ color: you.tier.color }}>
          {you.tier.label}
        </p>
      </div>
    )
  }

  // ── Beat 4: Podio del partido ─────────────────────────────────
  const renderPodium = () => {
    if (topThree.length === 0) return null
    const podiumOrder = topThree.length >= 3
      ? [topThree[1], topThree[0], topThree[2]]
      : topThree.length === 2
      ? [topThree[1], topThree[0]]
      : topThree

    const medalFor = (pos: number) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'
    const heightFor = (pos: number) => pos === 1 ? 96 : pos === 2 ? 72 : 58

    return (
      <div ref={podiumRef} className="is-reveal">
        <p className="font-barlow text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--muted)' }}>
          Podio del partido
        </p>
        <div className="flex items-end justify-center gap-2">
          {podiumOrder.map(row => {
            if (!row) return null
            const pos = topThree.indexOf(row) + 1
            const isFirst = pos === 1
            return (
              <div key={row.player.id} className="flex-1 max-w-[110px] flex flex-col items-center gap-1.5">
                <span className="text-2xl leading-none" aria-hidden="true">{medalFor(pos)}</span>
                <PlayerAvatar
                  player={row.player}
                  size={isFirst ? 52 : 40}
                  communityColor={communityColor}
                />
                <p
                  className="text-center truncate w-full px-1 font-semibold leading-tight"
                  style={{ fontSize: isFirst ? 12 : 11 }}
                >
                  {row.player.name.split(' ')[0]}
                </p>
                <span className="chip-tier" data-tier={row.tier.key} style={{ fontSize: isFirst ? 20 : 16 }}>
                  {row.bd.total}
                </span>
                <div
                  className="w-full rounded-t-m plinth-reflect relative overflow-hidden"
                  style={{
                    height: heightFor(pos),
                    background: isFirst
                      ? `linear-gradient(180deg, ${communityColor}33 0%, ${communityColor}12 55%, ${communityColor}05 100%)`
                      : 'var(--card)',
                    border: `1px solid ${isFirst ? communityColor + '66' : 'var(--border)'}`,
                    borderBottom: 'none',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Beat 5: Tablas por equipo ─────────────────────────────────
  const renderTeams = () => {
    const renderTeamCard = (label: string, ids: string[], isWinner: boolean) => {
      const teamRows = ids.map(pid => rows.find(r => r.player.id === pid)).filter(Boolean) as typeof rows
      return (
        <div
          className={isWinner ? 'surface-arena p-3' : 'surface-calm p-3'}
          style={isWinner ? { ['--comm-color' as string]: communityColor } : undefined}
        >
          <div className="flex items-baseline justify-between mb-2 pb-2" style={{ borderBottom: `1px solid ${isWinner ? communityColor + '33' : 'var(--border)'}` }}>
            <p className="font-bebas text-base tracking-wider" style={{ color: isWinner ? communityColor : 'var(--text)' }}>
              {label}
            </p>
            {isWinner && <span className="text-base" aria-hidden="true">🏆</span>}
          </div>
          <div className="space-y-1.5">
            {teamRows.length === 0 && (
              <p className="text-[11px] text-center py-2" style={{ color: 'var(--muted)' }}>—</p>
            )}
            {teamRows.map(r => (
              <div
                key={r.player.id}
                className="inkbar flex items-center gap-2 rounded-m pl-3 pr-2 py-2"
                data-tone={`tier-${r.tier.key}`}
                style={{ background: 'var(--card2)' }}
              >
                <PlayerAvatar player={r.player} size={22} communityColor={communityColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-[12px] font-bold truncate">{r.player.name}</p>
                    {r.isMVP && <span className="text-[11px]" aria-hidden="true">👑</span>}
                  </div>
                  {(r.mp.goles > 0 || r.mp.asistencias > 0 || r.mp.porteria_cero > 0) && (
                    <p className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                      {r.mp.goles > 0 && `⚽${r.mp.goles}`}
                      {r.mp.goles > 0 && r.mp.asistencias > 0 && ' '}
                      {r.mp.asistencias > 0 && `🎯${r.mp.asistencias}`}
                      {(r.mp.goles > 0 || r.mp.asistencias > 0) && r.mp.porteria_cero > 0 && ' '}
                      {r.mp.porteria_cero > 0 && `🧤${r.mp.porteria_cero > 1 ? `×${r.mp.porteria_cero}` : ''}`}
                    </p>
                  )}
                </div>
                <span
                  className="chip-tier"
                  data-tier={r.tier.key}
                  style={{ minWidth: 42, fontSize: 16, minHeight: 30 }}
                >
                  {r.bd.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (matchPlayers.length === 0) return null

    return (
      <div>
        <p className="font-barlow text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--muted)' }}>
          Puntos por equipo
          <span className="divider-dot" aria-hidden="true" />
          <span className="font-mono" style={{ textTransform: 'none', letterSpacing: '-0.02em' }}>
            P{MATCH_POINTS.partido} · G{MATCH_POINTS.gol} · A{MATCH_POINTS.asistencia} · 🧤{MATCH_POINTS.porteria_cero}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {renderTeamCard('Equipo A', event.equipo_a ?? [], winnerSide === 'A')}
          {renderTeamCard('Equipo B', event.equipo_b ?? [], winnerSide === 'B')}
        </div>
      </div>
    )
  }

  // ── Beat 6: Hazañas ───────────────────────────────────────────
  const renderHazanas = () => {
    if (hazanaRows.length === 0) return null
    return (
      <div>
        <p className="font-barlow text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--muted)' }}>
          🔥 Hazañas
        </p>
        <div className="flex flex-wrap gap-2">
          {hazanaRows.flatMap(h =>
            h.feats.map((feat, i) => (
              <span
                key={`${h.name}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                style={{
                  background: 'var(--card2)',
                  border: `1px solid ${communityColor}33`,
                  color: 'var(--text)',
                }}
              >
                <span style={{ color: communityColor }}>{feat}</span>
                <span style={{ color: 'var(--muted)' }}>·</span>
                <span>{h.name.split(' ')[0]}</span>
              </span>
            )),
          )}
        </div>
      </div>
    )
  }

  // ── Beat 7: Resumen ──────────────────────────────────────────
  const renderResumen = () => {
    if (scorers.length === 0 && assisters.length === 0 && !topXP) return null
    return (
      <div className="surface-calm overflow-hidden">
        <p
          className="text-[10px] font-bold uppercase tracking-widest px-4 py-2.5"
          style={{ color: communityColor, borderBottom: '1px solid var(--border)' }}
        >
          Resumen
        </p>
        <div className="px-4 py-3 space-y-2 text-sm">
          {scorers.length > 0 && (
            <p>
              <span aria-hidden="true">⚽ </span>
              {scorers.map((mp, i) => (
                <span key={mp.player_id}>
                  {i > 0 && <span className="divider-dot" aria-hidden="true" />}
                  {getName(mp.player_id)}
                  {mp.goles > 1 && (
                    <span className="font-mono" style={{ color: 'var(--muted)' }}> ×{mp.goles}</span>
                  )}
                </span>
              ))}
            </p>
          )}
          {assisters.length > 0 && (
            <p>
              <span aria-hidden="true">🎯 </span>
              {assisters.map((mp, i) => (
                <span key={mp.player_id}>
                  {i > 0 && <span className="divider-dot" aria-hidden="true" />}
                  {getName(mp.player_id)}
                  {mp.asistencias > 1 && (
                    <span className="font-mono" style={{ color: 'var(--muted)' }}> ×{mp.asistencias}</span>
                  )}
                </span>
              ))}
            </p>
          )}
          {topXP && topXP.xp > 0 && (
            <p style={{ color: communityColor }}>
              <span aria-hidden="true">⭐ </span>
              Top XP: {getName(topXP.pid)} <span className="font-mono">+{topXP.xp} XP</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ ['--comm-color' as string]: communityColor }}>
      {renderScoreSlab()}
      {renderMvpReveal()}
      {renderYou()}
      {renderPodium()}
      {renderTeams()}
      {renderHazanas()}
      {renderResumen()}
    </div>
  )
}
