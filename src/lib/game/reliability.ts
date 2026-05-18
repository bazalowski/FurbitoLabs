// ════════════════════════════════════════════════════
//  Reliability score — métrica social anti-fantasma
//
//  Mide cuántas veces un jugador que dijo "sí voy" realmente apareció.
//  Calculado sobre los últimos N (default 20) partidos finalizados de
//  la comunidad. Para cada uno comprobamos:
//
//    · ¿El jugador tenía una confirmación 'si' para ese evento?
//    · Si sí: ¿figura en `match_players` (= realmente jugó)?
//
//  pct = matched / si_count.
//
//  Etiquetas:
//    · Sin datos: si_count < MIN_SAMPLE — no suficiente para juzgar.
//    · Fiable:    pct >= 0.70.
//    · Variable:  pct <  0.70. (Evitamos "Irregular" — copy menos hostil.)
// ════════════════════════════════════════════════════

import type { Confirmation, Event, MatchPlayer } from '@/types'

export type ReliabilityLabel = 'Sin datos' | 'Fiable' | 'Variable'

export interface Reliability {
  pct: number              // 0..1, sólo válido si sampleSize >= MIN_SAMPLE
  label: ReliabilityLabel
  sampleSize: number       // nº de eventos donde dijo 'si'
  matched: number          // nº de esos en los que apareció
}

export const MIN_SAMPLE = 5
export const FIABLE_THRESHOLD = 0.7

export function calcReliability(
  playerId: string,
  events: Array<Pick<Event, 'id' | 'finalizado' | 'confirmations' | 'match_players'>>,
): Reliability {
  let sampleSize = 0
  let matched = 0

  for (const ev of events) {
    if (!ev.finalizado) continue
    const confirmed = (ev.confirmations ?? []).some(
      (c: Confirmation) => c.player_id === playerId && c.status === 'si',
    )
    if (!confirmed) continue
    sampleSize += 1
    const appeared = (ev.match_players ?? []).some(
      (mp: MatchPlayer) => mp.player_id === playerId,
    )
    if (appeared) matched += 1
  }

  if (sampleSize < MIN_SAMPLE) {
    return { pct: 0, label: 'Sin datos', sampleSize, matched }
  }

  const pct = matched / sampleSize
  return {
    pct,
    label: pct >= FIABLE_THRESHOLD ? 'Fiable' : 'Variable',
    sampleSize,
    matched,
  }
}
