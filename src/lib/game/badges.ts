import type { BadgeDef, Player, MatchPlayer } from '@/types'
import { getLevel } from './levels'

// ════════════════════════════════════════════════════
//  Definiciones de todos los badges
// ════════════════════════════════════════════════════
export const BADGE_DEFS: Record<string, BadgeDef> = {
  // Goles (partido)
  primer_gol:        { icon: '⚽', name: 'Primer Gol',       desc: 'Marca tu primer gol',                xp: 20  },
  primer_doblete:    { icon: '🎯', name: 'Doblete',          desc: 'Marca 2 goles en un partido',        xp: 30  },
  hat_trick:         { icon: '🎩', name: 'Hat Trick',        desc: '3 goles en un partido',              xp: 75  },
  poker:             { icon: '🃏', name: 'Póker',            desc: '4 goles en un partido',              xp: 100 },
  manita:            { icon: '✋', name: 'Manita',           desc: '5 goles en un partido',              xp: 150 },
  doble_digito:      { icon: '🔟', name: 'Doble Dígito',    desc: '10+ goles en un partido',            xp: 300 },
  // Goles (acumulados)
  goles_10:          { icon: '🏆', name: 'Goleador',        desc: '10 goles en total',                  xp: 50  },
  goles_25:          { icon: '🔥', name: 'En Llamas',       desc: '25 goles en total',                  xp: 100 },
  goles_50:          { icon: '💣', name: 'Bomba Goleadora', desc: '50 goles en total',                  xp: 200 },
  goles_100:         { icon: '💯', name: 'Centenario',      desc: '100 goles en total',                 xp: 400 },
  goles_200:         { icon: '🌊', name: 'Marea Goleadora', desc: '200 goles en total',                 xp: 600 },
  goles_300:         { icon: '🚀', name: 'Cohete',          desc: '300 goles en total',                 xp: 800 },
  goles_500:         { icon: '👽', name: 'Extraterrestre',  desc: '500 goles en total',                 xp: 1000 },
  // Goles (especiales)
  gol_debut:         { icon: '🌅', name: 'Gol de Debut',   desc: 'Gol en tu primer partido',           xp: 40  },
  gol_y_cero:        { icon: '🛡️', name: 'Gol y Candado', desc: 'Gol y portería a cero',              xp: 60  },
  gol_50_partidos:   { icon: '⚡', name: 'Eficiencia',     desc: '50 goles en menos de 50 partidos',   xp: 150 },
  media_gol:         { icon: '📈', name: 'Media de Crack',  desc: '1+ gol por partido (mín 10)',        xp: 200 },
  // Asistencias (partido)
  primera_asistencia: { icon: '🎁', name: 'Primera Asistencia', desc: 'Tu primera asistencia',         xp: 20  },
  doble_asist:       { icon: '✌️', name: 'Doble Pase',    desc: '2 asistencias en un partido',        xp: 30  },
  triple_asist:      { icon: '🎪', name: 'Triple Pase',   desc: '3 asistencias en un partido',        xp: 60  },
  // Asistencias (acumuladas)
  asistencias_10:    { icon: '🤝', name: 'Asistidor',     desc: '10 asistencias en total',            xp: 50  },
  asistencias_25:    { icon: '🎭', name: 'Creador',       desc: '25 asistencias en total',            xp: 100 },
  asistencias_50:    { icon: '🧩', name: 'Maestro del Pase', desc: '50 asistencias en total',         xp: 200 },
  asistencias_100:   { icon: '🎼', name: 'Director',      desc: '100 asistencias en total',           xp: 400 },
  asistencias_200:   { icon: '🧠', name: 'Cerebro',       desc: '200 asistencias en total',           xp: 600 },
  // Asistencias (especiales)
  gol_y_asist:       { icon: '⭐', name: 'Gol y Pase',   desc: 'Gol y asistencia en el mismo partido', xp: 50 },
  asist_y_asist:     { icon: '🎯', name: 'Doble Doble',  desc: '2 goles y 2 asistencias',            xp: 80  },
  asist_sin_gol:     { icon: '🤫', name: 'Invisible',    desc: '3+ asistencias sin marcar',           xp: 60  },
  asist_debut:       { icon: '🤜', name: 'Asistencia de Debut', desc: 'Asistencia en tu primer partido', xp: 30 },
  asist_y_cero:      { icon: '🏰', name: 'Fortaleza',    desc: 'Asistencia y portería a cero',        xp: 50  },
  media_asist:       { icon: '📊', name: 'Asistidor Pro', desc: '0.5+ asistencias por partido (mín 10)', xp: 150 },
  gol_asist_iguales: { icon: '⚖️', name: 'Equilibrio',  desc: '10+ goles y mismos goles que asistencias', xp: 100 },
  // Hazañas
  chilena:           { icon: '🦅', name: 'Chilena',      desc: 'Marca de chilena',                   xp: 50  },
  olimpico:          { icon: '🌊', name: 'Olímpico',     desc: 'Marca directo de córner',             xp: 75  },
  tacon:             { icon: '👠', name: 'Taconazo',     desc: 'Marca de tacón',                      xp: 50  },
  porteria_cero_1:   { icon: '🧤', name: 'Muro',         desc: 'Primera portería a cero',             xp: 30  },
  parada_penalti:    { icon: '🦸', name: 'Héroe',        desc: 'Para un penalti',                     xp: 75  },
  muro_5:            { icon: '🛡️', name: 'El Muro',     desc: '5 porterías a cero',                  xp: 100 },
  muro_10:           { icon: '🏯', name: 'Fortaleza',    desc: '10 porterías a cero',                 xp: 200 },
  muro_25:           { icon: '⛩️', name: 'Leyenda bajo palos', desc: '25 porterías a cero',           xp: 400 },
  doble_hazana:      { icon: '💥', name: 'Doble Hazaña', desc: '2 hazañas en un partido',             xp: 60  },
  triple_hazana:     { icon: '🌟', name: 'Triple Hazaña', desc: '3 hazañas en un partido',            xp: 100 },
  todo_cero:         { icon: '🔐', name: 'Candado Total', desc: 'Portería a cero y parada de penalti', xp: 80  },
  portero_goleador:  { icon: '🤺', name: 'Portero Goleador', desc: 'Gol y portería a cero',          xp: 100 },
  parada_y_asist:    { icon: '🦸‍♂️', name: 'Superportero', desc: 'Para penalti y da asistencia',    xp: 75  },
  gol_asist_hazana:  { icon: '🎆', name: 'Triple Amenaza', desc: 'Gol, asistencia y hazaña',         xp: 100 },
  // Partidos
  primer_partido:    { icon: '🎮', name: 'Debut',        desc: 'Juega tu primer partido',             xp: 10  },
  partidos_5:        { icon: '5️⃣', name: 'En Racha',   desc: '5 partidos jugados',                  xp: 25  },
  partidos_10:       { icon: '🔟', name: 'Veterano',    desc: '10 partidos jugados',                 xp: 50  },
  partidos_25:       { icon: '🥈', name: 'Habitual',    desc: '25 partidos jugados',                 xp: 100 },
  partidos_50:       { icon: '🥇', name: 'Fijo',        desc: '50 partidos jugados',                 xp: 200 },
  partidos_75:       { icon: '💪', name: 'Pilar',       desc: '75 partidos jugados',                 xp: 300 },
  partidos_100:      { icon: '💯', name: 'Centenario',  desc: '100 partidos jugados',                xp: 500 },
  partidos_200:      { icon: '🌟', name: 'Leyenda',     desc: '200 partidos jugados',                xp: 800 },
  partidos_500:      { icon: '👑', name: 'Rey',         desc: '500 partidos jugados',                xp: 1500 },
  partidos_1000:     { icon: '🏛️', name: 'Inmortal',   desc: '1000 partidos jugados',               xp: 3000 },
  // MVP
  primer_mvp:        { icon: '🏅', name: 'Primer MVP',  desc: 'Tu primer MVP',                       xp: 30  },
  mvp_3:             { icon: '🎖️', name: 'MVP x3',    desc: '3 MVPs',                              xp: 60  },
  mvp_5:             { icon: '⭐', name: 'MVP x5',     desc: '5 MVPs',                              xp: 100 },
  mvp_10:            { icon: '🌟', name: 'MVP x10',    desc: '10 MVPs',                             xp: 200 },
  mvp_20:            { icon: '💫', name: 'MVP x20',    desc: '20 MVPs',                             xp: 400 },
  mvp_50:            { icon: '👑', name: 'Rey del MVP', desc: '50 MVPs',                            xp: 800 },
  mvp_100:           { icon: '🏆', name: 'Dios del MVP', desc: '100 MVPs',                          xp: 1500 },
  gol_asist_mvp:     { icon: '🎯', name: 'MVP Completo', desc: 'MVP con gol y asistencia',          xp: 75  },
  hat_trick_mvp_combo: { icon: '👑', name: 'Hat MVP',  desc: 'Hat trick siendo MVP',                xp: 150 },
  mvp_sin_gol:       { icon: '🧠', name: 'MVP Cerebral', desc: 'MVP sin marcar gol',               xp: 60  },
  mvp_debut:         { icon: '💥', name: 'MVP de Debut', desc: 'MVP en tu primer partido',          xp: 50  },
  mvp_y_porteria:    { icon: '🦁', name: 'Rey León',   desc: 'MVP y portería a cero',               xp: 100 },
  mvp_goles_asist:   { icon: '🎪', name: 'Show',       desc: 'MVP con gol y asistencia',            xp: 75  },
  mvp_25_pct:        { icon: '📈', name: 'MVP Consistente', desc: 'MVP en 25%+ de partidos (mín 10)', xp: 200 },
  mvp_50_pct:        { icon: '👑', name: 'El Mejor',   desc: 'MVP en 50%+ de partidos (mín 10)',   xp: 400 },
  // XP y Nivel
  xp_100:            { icon: '✨', name: 'Primeros XP',  desc: '100 XP acumulados',               xp: 0   },
  xp_500:            { icon: '⚡', name: 'Energizado',   desc: '500 XP acumulados',               xp: 0   },
  xp_1000:           { icon: '🔥', name: 'En Llamas',   desc: '1000 XP acumulados',              xp: 0   },
  xp_2500:           { icon: '💥', name: 'Explosivo',   desc: '2500 XP acumulados',              xp: 0   },
  xp_5000:           { icon: '🌟', name: 'Estrella',    desc: '5000 XP acumulados',              xp: 0   },
  xp_10000:          { icon: '💫', name: 'Supernova',   desc: '10000 XP acumulados',             xp: 0   },
  nivel_2:           { icon: '2️⃣', name: 'Nivel 2',   desc: 'Alcanza el nivel Aficionado',      xp: 0   },
  nivel_3:           { icon: '3️⃣', name: 'Nivel 3',   desc: 'Alcanza el nivel Amateur',         xp: 0   },
  nivel_4:           { icon: '4️⃣', name: 'Nivel 4',   desc: 'Alcanza el nivel Semi-Pro',        xp: 0   },
  nivel_5:           { icon: '5️⃣', name: 'Nivel 5',   desc: 'Alcanza el nivel Profesional',     xp: 0   },
  nivel_6:           { icon: '6️⃣', name: 'Nivel 6',   desc: 'Alcanza el nivel Crack',           xp: 0   },
  nivel_7:           { icon: '7️⃣', name: 'Nivel 7',   desc: 'Alcanza el nivel Estrella',        xp: 0   },
  nivel_8:           { icon: '👑', name: 'Nivel 8',    desc: 'Alcanza el nivel Leyenda',         xp: 0   },
  // Combos
  gol_50_mvp_10:     { icon: '💎', name: 'Diamante',   desc: '50 goles y 10 MVPs',               xp: 300 },
  partidos_100_goles_100: { icon: '🏆', name: 'Perfecto', desc: '100 partidos y 100 goles',      xp: 500 },
  partido_perfecto:  { icon: '🌈', name: 'Partido Perfecto', desc: 'MVP, 2+ goles, asistencia y portería a cero', xp: 200 },
  doble_doble:       { icon: '✌️', name: 'Doble Doble', desc: '10+ goles y 10+ asistencias',     xp: 150 },
  triple_doble:      { icon: '🎯', name: 'Triple Doble', desc: '10 goles, 10 asistencias y 5 MVPs', xp: 300 },
  zero_to_hero:      { icon: '📈', name: 'Zero to Hero', desc: 'Alcanza 10 goles',               xp: 50  },
  vitrina_llena:     { icon: '🖼️', name: 'Coleccionista', desc: 'Llena tu vitrina con 3 badges',  xp: 30  },
  // Meta badges
  leyenda_total:     { icon: '🏅', name: 'Colector',   desc: 'Consigue 50 badges',               xp: 500 },
  leyenda_100:       { icon: '🥇', name: 'Gran Colector', desc: 'Consigue 100 badges',           xp: 1000 },
  leyenda_150:       { icon: '💎', name: 'Maestro',    desc: 'Consigue 150 badges',              xp: 2000 },
  // Pistas
  pistas_5:          { icon: '🗺️', name: 'Cartógrafo', desc: 'Añade 5 pistas al mapa',          xp: 100 },
  pistas_10:         { icon: '🧭', name: 'Navegante',  desc: '10 pistas registradas',            xp: 200 },
  jugar_3_pistas:    { icon: '🏃', name: 'Nómada',     desc: 'Juega en 3 pistas distintas',      xp: 100 },
  jugar_5_pistas:    { icon: '🌍', name: 'Trotamundos', desc: 'Juega en 5 pistas diferentes',   xp: 250 },
}

// ════════════════════════════════════════════════════
//  Calcular XP de un partido
// ════════════════════════════════════════════════════
export function calcXP(mp: MatchPlayer, isMVP: boolean): number {
  let xp = 10 // por participar
  xp += mp.goles * 15
  if (mp.goles >= 3) xp += 20 // hat trick bonus
  xp += mp.asistencias * 10
  if (isMVP) xp += 20
  xp += 5 // por completar el partido
  if (mp.porteria_cero) xp += 15
  if (mp.parada_penalti) xp += 25
  return Math.max(0, xp)
}

// ════════════════════════════════════════════════════
//  Detectar badges nuevos para un jugador
// ════════════════════════════════════════════════════
export function detectBadges(player: Player, mp: MatchPlayer, isMVP: boolean): string[] {
  const existing = new Set(player.badges)
  const newBadges: string[] = []

  const chk = (key: string, condition: boolean) => {
    if (!existing.has(key) && condition && BADGE_DEFS[key]) {
      newBadges.push(key)
    }
  }

  const g = mp.goles
  const a = mp.asistencias
  const hazanas = [
    mp.porteria_cero && 'porteria_cero',
    mp.parada_penalti && 'parada_penalti',
    mp.chilena && 'chilena',
    mp.olimpico && 'olimpico',
    mp.tacon && 'tacon',
  ].filter(Boolean) as string[]
  const hzC = hazanas.length

  // Goles del partido
  chk('primer_gol', player.goles >= 1)
  chk('primer_doblete', g >= 2)
  chk('hat_trick', g >= 3)
  chk('poker', g >= 4)
  chk('manita', g >= 5)
  chk('doble_digito', g >= 10)

  // Goles acumulados
  chk('goles_10', player.goles >= 10)
  chk('goles_25', player.goles >= 25)
  chk('goles_50', player.goles >= 50)
  chk('goles_100', player.goles >= 100)
  chk('goles_200', player.goles >= 200)
  chk('goles_300', player.goles >= 300)
  chk('goles_500', player.goles >= 500)
  chk('gol_debut', player.partidos === 1 && g >= 1)
  chk('gol_y_cero', g >= 1 && mp.porteria_cero)
  chk('media_gol', player.partidos >= 10 && player.goles / player.partidos >= 1)

  // Asistencias del partido
  chk('primera_asistencia', player.asistencias >= 1)
  chk('doble_asist', a >= 2)
  chk('triple_asist', a >= 3)

  // Asistencias acumuladas
  chk('asistencias_10', player.asistencias >= 10)
  chk('asistencias_25', player.asistencias >= 25)
  chk('asistencias_50', player.asistencias >= 50)
  chk('asistencias_100', player.asistencias >= 100)
  chk('asistencias_200', player.asistencias >= 200)
  chk('gol_y_asist', g >= 1 && a >= 1)
  chk('asist_y_asist', g >= 2 && a >= 2)
  chk('asist_sin_gol', a >= 3 && g === 0)
  chk('asist_debut', player.partidos === 1 && a >= 1)
  chk('asist_y_cero', a >= 1 && mp.porteria_cero)
  chk('media_asist', player.partidos >= 10 && player.asistencias / player.partidos >= 0.5)
  chk('gol_asist_iguales', player.goles >= 10 && player.goles === player.asistencias)

  // Hazañas del partido
  chk('chilena', mp.chilena)
  chk('olimpico', mp.olimpico)
  chk('tacon', mp.tacon)
  chk('porteria_cero_1', mp.porteria_cero)
  chk('parada_penalti', mp.parada_penalti)
  chk('muro_5', player.partidos_cero >= 5)
  chk('muro_10', player.partidos_cero >= 10)
  chk('muro_25', player.partidos_cero >= 25)
  chk('doble_hazana', hzC >= 2)
  chk('triple_hazana', hzC >= 3)
  chk('todo_cero', mp.porteria_cero && mp.parada_penalti)
  chk('portero_goleador', g >= 1 && mp.porteria_cero)
  chk('parada_y_asist', mp.parada_penalti && a >= 1)
  chk('gol_asist_hazana', g >= 1 && a >= 1 && hzC >= 1)

  // Partidos
  chk('primer_partido', player.partidos >= 1)
  chk('partidos_5', player.partidos >= 5)
  chk('partidos_10', player.partidos >= 10)
  chk('partidos_25', player.partidos >= 25)
  chk('partidos_50', player.partidos >= 50)
  chk('partidos_75', player.partidos >= 75)
  chk('partidos_100', player.partidos >= 100)
  chk('partidos_200', player.partidos >= 200)
  chk('partidos_500', player.partidos >= 500)
  chk('partidos_1000', player.partidos >= 1000)

  // MVP
  chk('primer_mvp', player.mvps >= 1)
  chk('mvp_3', player.mvps >= 3)
  chk('mvp_5', player.mvps >= 5)
  chk('mvp_10', player.mvps >= 10)
  chk('mvp_20', player.mvps >= 20)
  chk('mvp_50', player.mvps >= 50)
  chk('mvp_100', player.mvps >= 100)
  chk('gol_asist_mvp', isMVP && g >= 1 && a >= 1)
  chk('hat_trick_mvp_combo', isMVP && g >= 3)
  chk('mvp_sin_gol', isMVP && g === 0)
  chk('mvp_debut', isMVP && player.partidos === 1)
  chk('mvp_y_porteria', isMVP && mp.porteria_cero)
  chk('mvp_25_pct', player.partidos >= 10 && player.mvps / player.partidos > 0.25)
  chk('mvp_50_pct', player.partidos >= 10 && player.mvps / player.partidos > 0.5)

  // XP y nivel
  const xp = player.xp
  chk('xp_100', xp >= 100)
  chk('xp_500', xp >= 500)
  chk('xp_1000', xp >= 1000)
  chk('xp_2500', xp >= 2500)
  chk('xp_5000', xp >= 5000)
  chk('xp_10000', xp >= 10000)
  const lvl = getLevel(xp)
  chk('nivel_2', lvl.level >= 2)
  chk('nivel_3', lvl.level >= 3)
  chk('nivel_4', lvl.level >= 4)
  chk('nivel_5', lvl.level >= 5)
  chk('nivel_6', lvl.level >= 6)
  chk('nivel_7', lvl.level >= 7)
  chk('nivel_8', lvl.level >= 8)

  // Combos
  chk('gol_50_mvp_10', player.goles >= 50 && player.mvps >= 10)
  chk('partidos_100_goles_100', player.partidos >= 100 && player.goles >= 100)
  chk('partido_perfecto', isMVP && g >= 2 && a >= 1 && mp.porteria_cero)
  chk('doble_doble', player.goles >= 10 && player.asistencias >= 10)
  chk('triple_doble', player.goles >= 10 && player.asistencias >= 10 && player.mvps >= 5)
  chk('zero_to_hero', player.goles >= 10)

  // Meta
  const total = player.badges.length + newBadges.length
  chk('leyenda_total', total >= 50)
  chk('leyenda_100', total >= 100)
  chk('leyenda_150', total >= 150)

  return newBadges
}
