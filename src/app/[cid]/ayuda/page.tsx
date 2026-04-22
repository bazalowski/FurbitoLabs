'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/stores/session'
import { usePlayer } from '@/hooks/usePlayers'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { showToast } from '@/components/ui/Toast'
import { BADGE_DEFS } from '@/lib/game/badges'
import { notifyBadgeEarned } from '@/lib/notifications/notification-service'

interface AyudaPageProps {
  params: { cid: string }
}

interface Section {
  id: string
  num: string
  icon: string
  title: string
}

const SECTIONS: Section[] = [
  { id: 'bienvenida',   num: '01', icon: '\u{1F44B}', title: 'Qué es Furbito' },
  { id: 'acceso',       num: '02', icon: '\u{1F511}', title: 'Entrar con tu PIN' },
  { id: 'inicio',       num: '03', icon: '\u{1F3E0}', title: 'La pantalla de Inicio' },
  { id: 'confirmar',    num: '04', icon: '✅',     title: 'Confirmar al próximo partido' },
  { id: 'valorar',      num: '05', icon: '⭐',     title: 'Valorar compañeros' },
  { id: 'partido',      num: '06', icon: '⚽',     title: 'Dentro de un partido' },
  { id: 'puntos',       num: '07', icon: '\u{1F396}',  title: 'Puntos Furbito' },
  { id: 'niveles',      num: '08', icon: '\u{1F3C5}',  title: 'Niveles e insignias' },
  { id: 'ranking',      num: '09', icon: '\u{1F3C6}',  title: 'Ranking' },
  { id: 'perfil',       num: '10', icon: '\u{1F464}',  title: 'Tu perfil' },
  { id: 'ajustes',      num: '11', icon: '⚙',     title: 'Ajustes y notificaciones' },
]

export default function AyudaPage({ params }: AyudaPageProps) {
  const { cid } = params
  const router = useRouter()
  const session = useSession()
  const communityColor = session.communityColor || '#a8ff3e'

  const isLoggedIn = (session.role === 'player' || session.role === 'admin') && !!session.playerId
  const { player: me, reload: reloadMe } = usePlayer(isLoggedIn ? session.playerId : null)

  // Award "tutorial" badge on first visit
  const awardedRef = useRef(false)
  useEffect(() => {
    if (!me || !session.playerId || awardedRef.current) return
    if (me.badges.includes('tutorial')) return

    awardedRef.current = true
    const def = BADGE_DEFS['tutorial']
    if (!def) return

    const newBadges = [...me.badges, 'tutorial']
    const newXp = me.xp + def.xp

    const supabase = createClient()
    supabase
      .from('players')
      .update({ badges: newBadges, xp: newXp })
      .eq('id', session.playerId)
      .then(({ error }) => {
        if (error) {
          awardedRef.current = false
          return
        }
        showToast(`${def.icon} Insignia desbloqueada: ${def.name} (+${def.xp} XP)`)
        notifyBadgeEarned(session.playerId!, def.name, def.icon, `/${cid}`)
        reloadMe()
      })
  }, [me, session.playerId, cid, reloadMe])

  // FAB "volver al índice" — visible cuando se scrollea hacia abajo
  const [showTocFab, setShowTocFab] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowTocFab(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(`/${cid}`)
    }
  }

  return (
    <div className="view-enter">
      <Header
        title="Ayuda"
        left={
          <button
            onClick={goBack}
            aria-label="Volver"
            className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-lg active:scale-90 transition-transform"
            style={{ color: 'var(--fg)' }}
          >
            {'←'}
          </button>
        }
      />

      <div id="ayuda-top" className="px-4 pt-2 pb-28 space-y-4">
        {/* Intro */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Guía rápida
          </p>
          <h2 className="font-bebas text-3xl tracking-wider leading-none mt-1">
            Primeros pasos en <span style={{ color: communityColor }}>Furbito</span>
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Todo lo que necesitas saber para organizar tus partidos, confirmar asistencia, seguir las estadísticas y pelear por el ranking.
          </p>
        </Card>

        {/* TOC */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Índice
          </p>
          <div className="space-y-1">
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-3 py-2 px-2 rounded-m active:scale-[0.98] transition-transform select-none"
              >
                <span
                  className="font-bebas text-base tracking-wider w-8"
                  style={{ color: communityColor }}
                >
                  {s.num}
                </span>
                <span className="text-lg" aria-hidden="true">{s.icon}</span>
                <span className="text-sm font-bold flex-1 truncate">{s.title}</span>
                <span className="text-lg" style={{ color: 'var(--muted)' }}>{'›'}</span>
              </a>
            ))}
          </div>
        </Card>

        {/* 01 — Qué es Furbito */}
        <Section id="bienvenida" num="01" icon="👋" title="Qué es Furbito" color={communityColor}>
          <p>
            Furbito es la app de tu comunidad de fútbol. Aquí organizáis quién juega, creáis los equipos, apuntáis el resultado y llevamos la cuenta de goles, asistencias, porterías a cero, puntos, niveles e insignias de cada jugador.
          </p>
          <p className="mt-2">
            Todo lo importante ocurre dentro de una <b>comunidad</b>: un grupo cerrado con su propio color, su lista de jugadores y su historial. Tú eres un jugador dentro de esa comunidad.
          </p>
        </Section>

        {/* 02 — Entrar con tu PIN */}
        <Section id="acceso" num="02" icon="🔑" title="Entrar con tu PIN" color={communityColor}>
          <p>
            Cada jugador tiene un <b>PIN personal de 4 dígitos</b>. Es tu identidad dentro de la comunidad: lo pide el admin cuando te da de alta y te sirve para loguearte desde cualquier dispositivo.
          </p>
          <Steps
            items={[
              'Abre la app y elige tu comunidad.',
              'Pulsa "Acceder" en la barra inferior (icono 🔑).',
              'Introduce tus 4 dígitos y pulsa Entrar.',
            ]}
            color={communityColor}
          />
          <Tip color={communityColor}>
            Si ya estabas dentro y quieres <b>cambiar de jugador</b>, pulsa el icono 🔑 arriba a la derecha. El 🚪 de al lado te saca de la comunidad.
          </Tip>
        </Section>

        {/* 03 — Inicio */}
        <Section id="inicio" num="03" icon="🏠" title="La pantalla de Inicio" color={communityColor}>
          <p>De arriba a abajo, esto es lo que verás:</p>
          <Bullets
            color={communityColor}
            items={[
              { k: 'Tu tarjeta', v: 'Tu avatar, nivel actual, barra de XP y un resumen rápido (goles, asistencias, partidos, valoración ⭐). Toca para ir a tu perfil.' },
              { k: 'Stats de la comunidad', v: 'Tres tarjetas con total de jugadores, próximos partidos y partidos jugados.' },
              { k: 'Recordatorio MVP', v: 'Si tienes votaciones abiertas de MVP, aparecerá aquí.' },
              { k: 'Valorar compañeros', v: 'Acceso directo a puntuar habilidades de tus compañeros.' },
              { k: 'Próximo partido', v: 'Hero con fecha, lugar y tus botones Sí/No para confirmar. Pulsa la tarjeta para expandirla.' },
              { k: 'Generar equipos', v: 'Atajo para probar combinaciones rápidas (solo visible si no hay partido próximo).' },
              { k: 'Actividad reciente', v: 'Las últimas 5 cosas que han pasado en la comunidad.' },
            ]}
          />
        </Section>

        {/* 04 — Confirmar al próximo partido */}
        <Section id="confirmar" num="04" icon="✅" title="Confirmar al próximo partido" color={communityColor}>
          <p>
            En el hero del próximo partido tienes dos botones: <b style={{ color: '#22c55e' }}>Sí</b> y <b style={{ color: '#ef4444' }}>No</b>. Pulsa el que corresponda y quedará guardado para el admin.
          </p>
          <p className="mt-2">
            Dentro del detalle del partido también puedes elegir <b style={{ color: '#eab308' }}>Quizá</b> si aún no lo tienes claro. Puedes cambiar tu respuesta todas las veces que quieras hasta que empiece el partido.
          </p>
          <Tip color={communityColor}>
            Si activas las notificaciones push (Ajustes → Notificaciones), recibirás un aviso al crearse un partido nuevo y un recordatorio 24h antes.
          </Tip>
        </Section>

        {/* 05 — Valorar compañeros */}
        <Section id="valorar" num="05" icon="⭐" title="Valorar compañeros" color={communityColor}>
          <p>
            Las valoraciones no son un ranking de popularidad: <b>sirven para equilibrar los equipos</b>. Cuanto más valora la gente a tus compañeros, mejor los repartirá el generador automático.
          </p>
          <Steps
            color={communityColor}
            items={[
              'Desde Inicio, pulsa "⭐ Valorar compañeros" (o ve al perfil de un jugador y pulsa "⭐ Valorar").',
              'Puntúa sus habilidades en el bottom-sheet que aparece.',
              'Guarda. Tu valoración se combina con las del resto para calcular el rating medio del jugador.',
            ]}
          />
        </Section>

        {/* 06 — Dentro de un partido */}
        <Section id="partido" num="06" icon="⚽" title="Dentro de un partido" color={communityColor}>
          <p>Cada partido tiene tres pestañas:</p>
          <Bullets
            color={communityColor}
            items={[
              { k: 'Convocados', v: 'Quién ha dicho Sí, Quizá o No. Aquí confirmas tú también.' },
              { k: 'Equipos', v: 'Cómo están repartidos Equipo A y Equipo B. Si eres admin, puedes generarlos o editarlos.' },
              { k: 'Resultado', v: 'Marcador final, estadísticas individuales y panel de Puntos Furbito cuando el partido se ha finalizado.' },
            ]}
          />
          <p className="mt-3">
            Al finalizar el partido, el admin introduce el resultado en un <b>stepper de 3 pasos</b>:
          </p>
          <Steps
            color={communityColor}
            items={[
              'Marcador final (goles de A y B).',
              'Stats por jugador: goles, asistencias y porterías a cero (🧤) como contador — el portero puede tener más de una si rotáis.',
              'Resumen con el panel de Puntos Furbito. Cada jugador ve su chip con color según su tier.',
            ]}
          />
        </Section>

        {/* 07 — Puntos Furbito */}
        <Section id="puntos" num="07" icon="🎖️" title="Puntos Furbito" color={communityColor}>
          <p>Cada partido te da puntos según lo que hagas en el campo:</p>
          <div className="mt-3 space-y-1 text-sm rounded-m p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <Row label="Jugar el partido"        value="+3 pt" />
            <Row label="Cada gol"                value="+2 pt" />
            <Row label="Cada asistencia"          value="+1 pt" />
            <Row label="Cada portería a cero 🧤" value="+2 pt" />
          </div>
          <p className="mt-3">El chip de puntos cambia de color según el total:</p>
          <Tiers />
          <Tip color={communityColor}>
            Los Puntos Furbito se acumulan en tu perfil y son los que se ven en el ranking por defecto.
          </Tip>
        </Section>

        {/* 08 — Niveles e insignias */}
        <Section id="niveles" num="08" icon="🏅" title="Niveles e insignias" color={communityColor}>
          <p>
            Además de los Puntos Furbito, ganas <b>XP</b> por usar la app y participar en partidos. La curva de XP tiene 25 niveles con crecimiento cuadrático: cada nivel cuesta más que el anterior.
          </p>
          <p className="mt-2">
            Las <b>insignias</b> se desbloquean al cumplir hitos (ej.: primer gol, hat-trick, portería a cero). Todas tus insignias están en tu perfil, y puedes elegir hasta <b>5 para exhibir</b> en tu <b>expositor</b> (tocarlo abre un editor donde reordenas).
          </p>
        </Section>

        {/* 09 — Ranking */}
        <Section id="ranking" num="09" icon="🏆" title="Ranking" color={communityColor}>
          <p>
            El ranking de la comunidad tiene <b>podio</b> para el top 3 y lista a partir del 4º. Arriba hay pestañas para ordenar por:
          </p>
          <Bullets
            color={communityColor}
            items={[
              { k: '🎖️ Puntos', v: 'Puntos Furbito acumulados. Es la pestaña por defecto.' },
              { k: '⚽ Goles',    v: 'Pichichi de la comunidad.' },
              { k: '🅰️ Asistencias', v: 'El Xavi/Özil de la peña.' },
              { k: '🧤 Porterías a cero', v: 'Para porteros y defensas.' },
              { k: '⭐ Rating',   v: 'Media de las valoraciones que te han dado tus compañeros.' },
            ]}
          />
        </Section>

        {/* 10 — Tu perfil */}
        <Section id="perfil" num="10" icon="👤" title="Tu perfil" color={communityColor}>
          <p>En tu perfil encuentras:</p>
          <Bullets
            color={communityColor}
            items={[
              { k: 'Resumen', v: 'Avatar, nombre, nivel y barra de XP.' },
              { k: 'Stats rápidas', v: 'Fila de 5 chips: goles, asistencias, partidos, porterías a cero, puntos.' },
              { k: 'Skills', v: 'Barras de habilidades basadas en las valoraciones que te han dado.' },
              { k: 'Expositor', v: '5 slots para las insignias que quieres mostrar. Reordenables.' },
              { k: 'Historial', v: 'Línea temporal de tus partidos con los Puntos Furbito ganados en cada uno.' },
              { k: 'Valorar a este jugador', v: 'Si entras al perfil de otro jugador, tendrás el botón ⭐ Valorar.' },
            ]}
          />
          <Tip color={communityColor}>
            Para ir rápido a tu perfil: pestaña inferior con tu nombre o toca tu tarjeta en la pantalla de Inicio.
          </Tip>
        </Section>

        {/* 11 — Ajustes */}
        <Section id="ajustes" num="11" icon="⚙" title="Ajustes y notificaciones" color={communityColor}>
          <p>En Ajustes puedes:</p>
          <Bullets
            color={communityColor}
            items={[
              { k: 'Tema', v: 'Claro u oscuro.' },
              { k: 'Notificaciones push', v: 'Actívalas para recibir avisos de partido creado, recordatorio 24h, resultado final e insignias desbloqueadas. Puedes activar/desactivar cada tipo por separado.' },
              { k: 'Salir de la comunidad', v: 'Vuelves a la pantalla inicial de selección de comunidad.' },
            ]}
          />
        </Section>

        {/* Cierre */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
            ¿Listo?
          </p>
          <p className="text-sm">
            Ya tienes lo básico. Dale caña: confirma tu asistencia, valora a los compañeros y a por el próximo partido.
          </p>
          <Link
            href={`/${cid}`}
            className="mt-4 block text-center py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-95 select-none"
            style={{ background: communityColor, color: '#000' }}
          >
            Ir a Inicio
          </Link>
        </Card>
      </div>

      {/* FAB: volver al índice */}
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById('ayuda-top')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          else window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        aria-label="Volver al índice"
        className="fixed z-40 rounded-full shadow-lg flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider select-none active:scale-95 transition-all"
        style={{
          right: 'max(16px, calc((100vw - 500px) / 2 + 16px))',
          bottom: 'calc(var(--nav-h, 64px) + var(--safe-bottom, 0px) + 16px)',
          background: communityColor,
          color: '#000',
          opacity: showTocFab ? 1 : 0,
          transform: showTocFab ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: showTocFab ? 'auto' : 'none',
        }}
      >
        <span aria-hidden="true">{'↑'}</span>
        <span>Índice</span>
      </button>
    </div>
  )
}

/* ---------- helpers ---------- */

function Section({
  id, num, icon, title, color, children,
}: {
  id: string
  num: string
  icon: string
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <section id={id} style={{ scrollMarginTop: 'var(--header-h, 56px)' }}>
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <span
            className="font-bebas text-2xl tracking-wider leading-none"
            style={{ color }}
          >
            {num}
          </span>
          <span className="text-2xl" aria-hidden="true">{icon}</span>
          <h3 className="font-bold text-base flex-1">{title}</h3>
        </div>
        <div className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>
          {children}
        </div>
      </Card>
    </section>
  )
}

function Steps({ items, color }: { items: string[]; color: string }) {
  return (
    <ol className="mt-3 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: color, color: '#000' }}
          >
            {i + 1}
          </span>
          <span className="flex-1">{it}</span>
        </li>
      ))}
    </ol>
  )
}

function Bullets({ items, color }: { items: { k: string; v: string }[]; color: string }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
          <span className="flex-1">
            <b>{it.k}.</b> <span style={{ color: 'var(--muted)' }}>{it.v}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function Tip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      className="mt-3 rounded-m p-3 text-sm flex gap-2"
      style={{
        background: `${color}11`,
        border: `1px solid ${color}44`,
      }}
    >
      <span aria-hidden="true">{'\u{1F4A1}'}</span>
      <span className="flex-1">{children}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="font-bold font-mono">{value}</span>
    </div>
  )
}

function Tiers() {
  const tiers: { range: string; label: string; cls?: string; bg?: string; fg?: string }[] = [
    { range: '<5',   label: 'Mal partido', bg: '#ef444422', fg: '#ef4444' },
    { range: '5–7',  label: 'Regular',     bg: '#f9731622', fg: '#f97316' },
    { range: '8–10', label: 'Bueno',       bg: '#22c55e22', fg: '#22c55e' },
    { range: '11–19', label: 'Excelente',  bg: '#06b6d422', fg: '#06b6d4' },
    { range: '20+',  label: 'Leyenda',     cls: 'legend-rainbow' },
  ]
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tiers.map(t => (
        <div
          key={t.range}
          className={`px-2.5 py-1.5 rounded-m text-xs font-bold flex items-center gap-2 ${t.cls ?? ''}`}
          style={
            t.cls
              ? { border: '1px solid var(--border)' }
              : { background: t.bg, color: t.fg, border: `1px solid ${t.fg}44` }
          }
        >
          <span className="font-mono">{t.range}</span>
          <span style={{ opacity: 0.85 }}>{t.label}</span>
        </div>
      ))}
    </div>
  )
}
