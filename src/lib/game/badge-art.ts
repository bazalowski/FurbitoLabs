import { BADGE_DEFS } from './badges'

/**
 * Badge art system — retro arcade PES 2000s.
 * Each badge maps to:
 *   · tier   — frame color ring (bronze → legendary) derived from XP/category
 *   · glyph  — one of ~18 categorical SVG symbols drawn inside the frame
 *   · accent — optional extra tint (keeps orange rachas vs. blue portero, etc.)
 *
 * Falls back to the original emoji from BADGE_DEFS when a key is unknown.
 */

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary'

export type BadgeGlyph =
  | 'ball'        // goles
  | 'double'      // doble / triple gol
  | 'target'      // hat trick / precision
  | 'boot'        // hazaña — chilena, tacón
  | 'swallow'     // olímpico, chilena especial
  | 'pass'        // asistencia
  | 'brain'       // cerebro / visión
  | 'baton'       // director de pases
  | 'star'        // mvp / estrella
  | 'crown'       // rey / dinastía
  | 'trophy'      // victorias, ganador
  | 'glove'       // portero
  | 'shield'      // muro / defensa
  | 'lock'        // invicto
  | 'flame'       // racha / en llamas
  | 'bolt'        // eficiencia / rayo
  | 'sparkle'     // xp / primeros xp
  | 'diamond'     // combo premium
  | 'level'       // nivel
  | 'compass'     // pista / explorador
  | 'home'        // pista favorita
  | 'calendar'    // tiempo / fecha
  | 'sunrise'     // madrugador / debut
  | 'moon'        // nocturno
  | 'medal'       // meta coleccion / first
  | 'frame'       // vitrina / colector
  | 'controller'  // debut / primer partido

export interface BadgeArt {
  tier: BadgeTier
  glyph: BadgeGlyph
  accent?: 'gold' | 'neon' | 'magenta' | 'cyan' | 'red' | 'cream'
  label: string
  desc: string
  xp: number
  /** Fallback emoji if we ever want to display the legacy glyph. */
  emoji: string
}

/**
 * Keyword-based category detection. Priority matters: first match wins, so
 * combo/meta badges should be caught before the more generic per-stat buckets.
 */
function resolveGlyph(key: string): BadgeGlyph {
  // Combos / meta first
  if (key === 'vitrina_llena') return 'frame'
  if (key.startsWith('leyenda_')) return 'medal'
  if (key === 'all_categories') return 'trophy'
  if (key === 'partido_perfecto' || key === 'mvp_hat_trick_clean') return 'diamond'
  if (key === 'triple_doble' || key === 'doble_doble' || key.startsWith('goles_asist') || key.startsWith('gol_100_asist')) return 'diamond'
  if (key === 'gol_50_mvp_10' || key === 'partidos_50_mvp_25' || key === 'partidos_100_goles_100') return 'diamond'

  // Partidos
  if (key === 'primer_partido') return 'controller'
  if (key.startsWith('partidos_')) return 'trophy'

  // Victorias / rachas
  if (key.startsWith('racha_') || key === 'sin_perder_5' || key === 'sin_perder_10') return 'flame'
  if (key.startsWith('victorias_') || key === 'primera_victoria') return 'crown'
  if (key === 'derrota_digna') return 'medal'

  // Hat / double / triple
  if (key === 'hat_trick' || key === 'hat_trick_asist' || key === 'hat_trick_mvp_combo' || key === 'gol_hat_asist_hat' || key === 'gol_todos_partidos_5' || key === 'gol_todos_partidos_10') return 'target'
  if (key === 'primer_doblete' || key === 'doble_asist' || key === 'triple_asist' || key === 'asist_y_asist') return 'double'
  if (key === 'poker' || key === 'manita' || key === 'doble_digito') return 'target'

  // Goles milestones
  if (key === 'primer_gol' || key === 'gol_debut' || key === 'gol_1000') return 'ball'
  if (key.startsWith('goles_') || key === 'gol_50_partidos' || key === 'media_gol') return 'ball'

  // Hazañas
  if (key === 'chilena') return 'swallow'
  if (key === 'olimpico') return 'swallow'
  if (key === 'tacon') return 'boot'
  if (key === 'doble_hazana' || key === 'triple_hazana' || key === 'gol_asist_hazana') return 'boot'

  // Portero
  if (key === 'porteria_cero_1' || key === 'portero_3' || key === 'muro_5' || key === 'portero_15' || key === 'portero_20') return 'glove'
  if (key === 'muro_10' || key === 'muro_25') return 'shield'
  if (key === 'parada_penalti' || key === 'parada_doble' || key === 'parada_5' || key === 'parada_10') return 'glove'
  if (key === 'todo_cero' || key === 'portero_invicto_3') return 'lock'
  if (key === 'portero_goleador' || key === 'parada_y_asist') return 'glove'

  // Asistencias
  if (key === 'primera_asistencia' || key.startsWith('asistencias_') || key === 'asist_debut' || key === 'asist_y_cero' || key === 'asist_partido_4' || key === 'asist_partido_5' || key === 'asist_racha_3') return 'pass'
  if (key === 'gol_y_asist') return 'pass'
  if (key === 'asist_sin_gol' || key === 'mvp_sin_gol') return 'brain'
  if (key === 'media_asist' || key === 'gol_asist_iguales') return 'baton'

  // MVP
  if (key === 'primer_mvp' || key.startsWith('mvp_') || key === 'gol_asist_mvp' || key === 'mvp_y_porteria' || key === 'mvp_debut' || key === 'mvp_goleada' || key === 'mvp_remontada') return 'star'

  // XP / nivel
  if (key.startsWith('xp_')) return 'sparkle'
  if (key.startsWith('nivel_')) return 'level'

  // Pistas
  if (key === 'pista_nueva' || key === 'pistas_5' || key === 'pistas_10' || key.startsWith('jugar_') || key.startsWith('pista_1') || key.startsWith('pista_2')) return 'compass'
  if (key === 'pista_favorita_10' || key === 'pista_favorita_25' || key === 'pista_favorita_50') return 'home'

  // Tiempo
  if (key === 'madrugador' || key === 'mediodia') return 'sunrise'
  if (key === 'nocturno') return 'moon'
  if (key === 'navidad' || key === 'nochevieja' || key === 'ano_nuevo' || key === 'lunes_guerrero' || key === 'fin_de_semana' || key === 'finde_10' || key === 'entre_semana_20') return 'calendar'

  // Score-related
  if (key === 'goleada_5' || key === 'goleada_7' || key === 'goleada_10') return 'bolt'
  if (key === 'remontada') return 'bolt'
  if (key === 'empate_0' || key === 'empate_alto' || key === 'muchos_goles' || key === 'partido_epico' || key === 'victoria_ajustada' || key === 'partido_100_goles_0') return 'ball'

  // Social
  if (key === 'primer_voto' || key === 'votos_dados_10' || key === 'votos_dados_50' || key === 'votos_dados_100') return 'medal'
  if (key === 'votado_10' || key === 'votado_25' || key === 'votado_50' || key === 'rating_5' || key === 'rating_4_5') return 'star'

  return 'medal'
}

function resolveTier(xp: number, key: string): BadgeTier {
  // Some meta/boss keys skip straight to legendary regardless of XP stored
  if (/^(partidos_500|partidos_1000|partidos_750|gol_1000|mvp_100|mvp_75|asistencias_500|leyenda_(150|175|200))$/.test(key)) {
    return 'legendary'
  }
  if (xp >= 600) return 'legendary'
  if (xp >= 250) return 'platinum'
  if (xp >= 100) return 'gold'
  if (xp >= 40)  return 'silver'
  return 'bronze'
}

function resolveAccent(glyph: BadgeGlyph, key: string): BadgeArt['accent'] {
  if (glyph === 'flame') return 'red'
  if (glyph === 'bolt') return 'neon'
  if (glyph === 'star' || glyph === 'crown' || glyph === 'trophy') return 'gold'
  if (glyph === 'diamond' || glyph === 'sparkle') return 'cyan'
  if (glyph === 'glove' || glyph === 'shield' || glyph === 'lock') return 'cyan'
  if (glyph === 'pass' || glyph === 'baton' || glyph === 'brain') return 'magenta'
  if (glyph === 'compass' || glyph === 'home') return 'neon'
  if (glyph === 'sunrise' || glyph === 'moon' || glyph === 'calendar') return 'cream'
  if (glyph === 'ball' || glyph === 'double' || glyph === 'target') return 'neon'
  if (glyph === 'boot' || glyph === 'swallow') return 'magenta'
  if (glyph === 'frame' || glyph === 'medal' || glyph === 'controller') return 'gold'
  if (glyph === 'level') return 'gold'
  if (key.startsWith('nivel_')) return 'gold'
  return 'neon'
}

const CACHE = new Map<string, BadgeArt>()

export function getBadgeArt(key: string): BadgeArt | null {
  const def = BADGE_DEFS[key]
  if (!def) return null
  const cached = CACHE.get(key)
  if (cached) return cached

  const glyph = resolveGlyph(key)
  const tier = resolveTier(def.xp, key)
  const accent = resolveAccent(glyph, key)

  const art: BadgeArt = {
    tier,
    glyph,
    accent,
    label: def.name,
    desc: def.desc,
    xp: def.xp,
    emoji: def.icon,
  }
  CACHE.set(key, art)
  return art
}

export const TIER_PALETTE: Record<BadgeTier, { outer: string; inner: string; ring: string; highlight: string; label: string }> = {
  bronze:    { outer: '#5a2f12', inner: '#ae6532', ring: '#e6a25c', highlight: '#ffd9a5', label: 'Bronce' },
  silver:    { outer: '#3d4750', inner: '#8a97a3', ring: '#cdd9e3', highlight: '#ffffff', label: 'Plata' },
  gold:      { outer: '#6a4803', inner: '#d49b0e', ring: '#ffd43e', highlight: '#fff2a8', label: 'Oro' },
  platinum:  { outer: '#1f4042', inner: '#3fb6bf', ring: '#8ef0f6', highlight: '#e3fbff', label: 'Platino' },
  legendary: { outer: '#3b0b3a', inner: '#a3279a', ring: '#ff3ec8', highlight: '#ffd3f5', label: 'Leyenda' },
}

export const ACCENT_PALETTE: Record<NonNullable<BadgeArt['accent']>, string> = {
  gold: '#ffd43e',
  neon: '#a8ff3e',
  magenta: '#ff3e88',
  cyan: '#3ee8ff',
  red: '#ff4d3e',
  cream: '#fff7dc',
}
