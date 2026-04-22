'use client'

import { createClient } from '@/lib/supabase/client'
import {
  detectBadges, BADGE_DEFS,
  type DetectBadgeContext, type HistoryMatch,
} from './badges'
import { notifyMvpSelected, notifyBadgeEarned } from '@/lib/notifications/notification-service'
import type { MatchPlayer, Player } from '@/types'

// El admin ya no elige MVP a mano: se decide por voto popular.
// Esta función se llama cuando la votación se cierra (manualmente por admin,
// o automáticamente al haber pasado el plazo) y se encarga de:
//   1. Leer los votos, elegir el más votado (desempate: primer voto registrado).
//   2. Escribir events.mvp_id.
//   3. Incrementar players.mvps y el XP de MVP (+10) al ganador.
//   4. Re-detectar insignias que dependen de ser MVP (primer_mvp, mvp_3…,
//      mvp_goleada, partido_perfecto, etc.) y añadir su XP.
//
// Idempotente: si el evento ya tiene mvp_id, no hace nada y devuelve null.

export interface MvpFinalizeResult {
  winnerId: string
  winnerName: string
  voteCount: number
  newBadges: string[]
}

export async function finalizeMvpByVotes(eventId: string): Promise<MvpFinalizeResult | null> {
  const supabase = createClient()

  const { data: eventRow } = await supabase
    .from('events')
    .select('id, titulo, community_id, goles_a, goles_b, equipo_a, equipo_b, fecha, hora, pista_id, mvp_id')
    .eq('id', eventId)
    .single()
  if (!eventRow) return null
  if (eventRow.mvp_id) return null // ya finalizado

  const { data: votes } = await supabase
    .from('mvp_votes')
    .select('voted_id, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  if (!votes || votes.length === 0) return null

  // Tally con desempate por primer voto registrado
  const counts = new Map<string, number>()
  const firstSeen = new Map<string, string>()
  for (const v of votes as Array<{ voted_id: string; created_at: string }>) {
    counts.set(v.voted_id, (counts.get(v.voted_id) ?? 0) + 1)
    if (!firstSeen.has(v.voted_id)) firstSeen.set(v.voted_id, v.created_at)
  }
  let winnerId = ''
  let winnerCount = -1
  counts.forEach((c, pid) => {
    if (c > winnerCount) {
      winnerId = pid; winnerCount = c
    } else if (c === winnerCount) {
      const prev = firstSeen.get(winnerId) ?? ''
      const cur  = firstSeen.get(pid) ?? ''
      if (cur < prev) winnerId = pid
    }
  })
  if (!winnerId) return null

  const { data: winner } = await supabase
    .from('players').select('*').eq('id', winnerId).single() as { data: Player | null }
  if (!winner) return null

  const { data: mp } = await supabase
    .from('match_players').select('*').eq('event_id', eventId).eq('player_id', winnerId).single() as { data: MatchPlayer | null }
  if (!mp) return null

  // Historia del jugador (mismo formato que resultado/page.tsx) para detectar
  // combos que dependen de rachas (mvp_goleada se recalcula con score actual,
  // otros como racha_* no cambian aquí — ya estaban en detectBadges previo).
  const { data: pastEventsData } = await supabase
    .from('events')
    .select('id, fecha, hora, pista_id, goles_a, goles_b, equipo_a, equipo_b, mvp_id, finalizado, match_players(*)')
    .eq('community_id', winner.community_id)
    .eq('finalizado', true)
    .neq('id', eventId)

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
  const history: HistoryMatch[] = []
  for (const ev of (pastEventsData ?? []) as PastEventRow[]) {
    for (const pmp of ev.match_players ?? []) {
      if (pmp.player_id !== winnerId) continue
      const team = ev.equipo_a?.includes(pmp.player_id) ? 'A'
                 : ev.equipo_b?.includes(pmp.player_id) ? 'B'
                 : null
      history.push({
        fecha: ev.fecha, hora: ev.hora, pistaId: ev.pista_id,
        playerTeam: team, golesA: ev.goles_a, golesB: ev.goles_b,
        goles: pmp.goles, asistencias: pmp.asistencias,
        isMVP: ev.mvp_id === pmp.player_id,
        porteria_cero: (pmp.porteria_cero ?? 0) > 0,
        parada_penalti: pmp.parada_penalti,
      })
    }
  }
  history.sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))

  const team: 'A' | 'B' | null =
    (eventRow.equipo_a as string[] | null)?.includes(winnerId) ? 'A'
    : (eventRow.equipo_b as string[] | null)?.includes(winnerId) ? 'B'
    : null

  // +10 XP al ganador por ser MVP (mismo bonus que antes aplicaba calcXP)
  const updatedPlayer: Player = {
    ...winner,
    mvps: winner.mvps + 1,
    xp: winner.xp + 10,
  }

  const ctx: DetectBadgeContext = {
    matchScore: {
      golesA: eventRow.goles_a ?? 0,
      golesB: eventRow.goles_b ?? 0,
      playerTeam: team,
    },
    matchMeta: {
      fecha: eventRow.fecha, hora: eventRow.hora, pistaId: eventRow.pista_id,
    },
    history,
  }
  const newBadges = detectBadges(updatedPlayer, mp, true, ctx)
  const allBadges = [...winner.badges, ...newBadges]
  const badgeXP = newBadges.reduce((sum, k) => sum + (BADGE_DEFS[k]?.xp ?? 0), 0)

  await supabase.from('events')
    .update({ mvp_id: winnerId, mvp_voting_closes_at: new Date().toISOString() })
    .eq('id', eventId)

  await supabase.from('players').update({
    mvps: updatedPlayer.mvps,
    xp: updatedPlayer.xp + badgeXP,
    badges: allBadges,
  }).eq('id', winnerId)

  const eventUrl = `/${winner.community_id}/partidos/${eventId}`
  notifyMvpSelected(winnerId, eventRow.titulo, eventUrl)
  newBadges.forEach(key => {
    const def = BADGE_DEFS[key]
    if (def) notifyBadgeEarned(winnerId, def.name, def.icon, eventUrl)
  })

  return {
    winnerId,
    winnerName: winner.name,
    voteCount: winnerCount,
    newBadges,
  }
}
