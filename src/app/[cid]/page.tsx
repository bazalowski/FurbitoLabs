'use client'

import { useState } from 'react'
import { useSession } from '@/stores/session'
import { useEvents } from '@/hooks/useEvents'
import { usePlayers, usePlayer } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { useVotes } from '@/hooks/useVotes'
import { usePendingMvpVotes } from '@/hooks/usePendingMvpVotes'
import { NextMatchHero } from '@/components/events/NextMatchHero'
import { ActivityFeed } from '@/components/feed/ActivityFeed'
import { Header, Logo } from '@/components/layout/Header'
import { TeamGenerator } from '@/components/players/TeamGenerator'
import { PlayerAvatar } from '@/components/players/PlayerCard'
import { getLevel, xpPercent } from '@/lib/game/levels'
import { getPlayerRating } from '@/lib/game/scoring'
import Link from 'next/link'

interface HomePageProps {
  params: { cid: string }
}

export default function HomePage({ params }: HomePageProps) {
  const { cid } = params
  const session = useSession()
  const { community } = useCommunity(cid)
  const { events, upcoming, past, loading: eventsLoading } = useEvents(cid)
  const { players } = usePlayers(cid)
  const { votes } = useVotes(cid)
  const { player: me } = usePlayer(
    (session.role === 'player' || session.role === 'admin') ? session.playerId : null
  )
  const { pendingCount: mvpPending } = usePendingMvpVotes(
    cid,
    (session.role === 'player' || session.role === 'admin') ? session.playerId : null,
  )
  const [showTeams, setShowTeams] = useState(false)

  const nextEvent = upcoming[0]
  const communityColor = session.communityColor || '#a8ff3e'
  const isLoggedIn = (session.role === 'player' || session.role === 'admin') && !!session.playerId

  const level = me ? getLevel(me.xp) : null
  const pct = me ? xpPercent(me.xp) : 0
  const rating = me ? getPlayerRating(me.id, votes) : null

  return (
    <div className="view-enter">
      <Header
        title={
          <div className="flex items-center gap-3">
            <Logo />
            {community && (
              <span className="text-xs font-bold truncate max-w-[140px]" style={{ color: 'var(--muted)' }}>
                {community.name}
              </span>
            )}
          </div>
        }
      />

      <div className="px-4 space-y-4 pt-2 pb-28" style={{ ['--comm-color' as string]: communityColor }}>

        {/* Player Profile Summary — arena: portada del jugador (única por pantalla) */}
        {isLoggedIn && me && level && (
          <Link href={`/${cid}/jugadores/${session.playerId}`} className="block select-none">
            <div className="surface-arena p-3 flex items-center gap-3 active:scale-[0.97] transition-transform">
              <div className="relative flex-shrink-0">
                <PlayerAvatar player={me} size={52} communityColor={communityColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bebas text-2xl leading-none tracking-display truncate">{me.name}</p>
                <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                  <span aria-hidden="true">{level.icon}</span>{' '}
                  <span style={{ color: communityColor }}>Nv.{level.level}</span>
                  <span className="divider-dot" aria-hidden="true" />
                  <span>{level.name}</span>
                </p>
                <div className="xp-bar mt-2">
                  <div
                    className="xp-bar-fill transition-all"
                    style={{ width: `${pct}%`, background: communityColor }}
                  />
                </div>
                <p className="font-mono text-[10px] mt-1.5 tabular-nums" style={{ color: 'var(--muted)' }}>
                  <span>{me.goles} goles</span>
                  <span className="divider-dot" aria-hidden="true" />
                  <span>{me.asistencias} asist</span>
                  <span className="divider-dot" aria-hidden="true" />
                  <span>{me.partidos} PJ</span>
                  {rating && (
                    <>
                      <span className="divider-dot" aria-hidden="true" />
                      <span style={{ color: communityColor }}>★ {rating.avg.toFixed(1)}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Community stats — calm, metric-minor-like */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Jugadores', value: players.length, icon: '👥', href: `/${cid}/jugadores` },
            { label: 'Próximos',  value: upcoming.length, icon: '📅', href: `/${cid}/partidos?tab=proximos` },
            { label: 'Jugados',   value: past.length, icon: '🏆', href: `/${cid}/partidos?tab=historial` },
          ].map(stat => (
            <Link
              key={stat.label}
              href={stat.href}
              className="surface-calm p-3 text-center block select-none active:scale-[0.97] transition-transform"
            >
              <p className="text-xl leading-none mb-1" aria-hidden="true">{stat.icon}</p>
              <p
                className="font-bebas text-2xl leading-none tabular-nums tracking-display"
                style={{ color: communityColor }}
              >
                {stat.value}
              </p>
              <p className="font-barlow text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--muted)' }}>
                {stat.label}
              </p>
            </Link>
          ))}
        </div>

        {/* MVP reminder — solo si hay partidos con voto pendiente */}
        {isLoggedIn && mvpPending > 0 && (
          <ShortcutCard
            href={`/${cid}/partidos?tab=historial`}
            icon="🏆"
            title="Vota al MVP de tus últimos partidos"
            hint={mvpPending === 1
              ? 'Tienes 1 partido con votación abierta.'
              : `Tienes ${mvpPending} partidos con votación abierta.`}
            emphasis
            communityColor={communityColor}
          />
        )}

        {/* Quick action: Valorar compañeros */}
        {isLoggedIn && (
          <ShortcutCard
            href={`/${cid}/valorar`}
            icon="⭐"
            title="Valorar compañeros"
            hint="Puntúa habilidades para equilibrar equipos."
            communityColor={communityColor}
          />
        )}

        {/* Tutorial onboarding — solo si el jugador aún no tiene la insignia */}
        {isLoggedIn && me && !me.badges.includes('tutorial') && (
          <ShortcutCard
            href={`/${cid}/ayuda`}
            icon="🎓"
            title="Cómo usar Furbito"
            hint="Tutorial de bienvenida · gana la insignia Manual del Jugador."
            emphasis
            communityColor={communityColor}
          />
        )}

        {/* Hero: Próximo partido con CTAs inline */}
        {!eventsLoading && nextEvent && (
          <NextMatchHero
            event={nextEvent}
            communityId={cid}
            playerId={isLoggedIn ? session.playerId : null}
            communityColor={communityColor}
            onToggleTeams={() => setShowTeams(prev => !prev)}
            teamsOpen={showTeams}
          />
        )}

        {/* Shortcut: Generador de equipos (solo cuando no hay partido próximo) */}
        {isLoggedIn && players.length >= 2 && !nextEvent && (
          <button
            type="button"
            onClick={() => setShowTeams(prev => !prev)}
            aria-expanded={showTeams}
            className={`no-lift w-full text-left select-none p-3 flex items-center gap-3 rounded-m active:scale-[0.98] transition-transform ${showTeams ? 'hairline-top' : ''}`}
            style={{
              background: showTeams ? 'var(--card2)' : 'var(--card)',
              border: `1px solid ${showTeams ? communityColor + '88' : 'var(--border)'}`,
              boxShadow: showTeams ? 'var(--shadow-depth-2)' : 'var(--shadow-depth-1)',
            }}
          >
            <span className="text-2xl leading-none" aria-hidden="true">⚖️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Generar equipos</p>
              <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                Prueba combinaciones rápidas sin abrir un partido.
              </p>
            </div>
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-lg transition-transform font-bold"
              style={{
                color: showTeams ? communityColor : 'var(--muted)',
                background: showTeams ? `${communityColor}1a` : 'var(--card2)',
                border: `1px solid ${showTeams ? communityColor + '44' : 'var(--border)'}`,
                transform: showTeams ? 'rotate(90deg)' : 'none',
              }}
            >
              ›
            </span>
          </button>
        )}

        {/* Team Generator — aparece SIEMPRE justo debajo de su trigger */}
        {showTeams && (
          <div className="surface-calm p-4 relative animate-slide-up">
            <button
              onClick={() => setShowTeams(false)}
              aria-label="Cerrar generador"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold select-none active:scale-[0.95] transition-transform"
              style={{ background: 'var(--card2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              ✕
            </button>
            <TeamGenerator
              players={players}
              votes={votes}
              communityColor={communityColor}
            />
          </div>
        )}

        {/* Activity feed (últimas 5 líneas) */}
        <ActivityFeed events={events.slice(0, 10)} players={players} maxItems={5} />

      </div>
    </div>
  )
}

/**
 * Shortcut card unificado — calm consistente con surface-calm, con énfasis opcional
 * (borde community) para los ítems accionables (MVP pendiente, tutorial).
 */
function ShortcutCard({
  href,
  icon,
  title,
  hint,
  emphasis = false,
  communityColor,
}: {
  href: string
  icon: string
  title: string
  hint: string
  emphasis?: boolean
  communityColor: string
}) {
  return (
    <Link
      href={href}
      className="block select-none p-3 flex items-center gap-3 rounded-m active:scale-[0.98] transition-transform"
      style={{
        background: emphasis ? 'var(--card2)' : 'var(--card)',
        border: emphasis ? `1px solid ${communityColor}66` : '1px solid var(--border)',
        boxShadow: emphasis ? `0 0 0 1px ${communityColor}22, var(--shadow-depth-1)` : 'var(--shadow-depth-1)',
      }}
    >
      <span className="text-2xl leading-none" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
          {hint}
        </p>
      </div>
      <span
        className="flex items-center justify-center w-7 h-7 rounded-full text-lg font-bold"
        style={{
          color: emphasis ? communityColor : 'var(--muted)',
          background: emphasis ? `${communityColor}1a` : 'var(--card2)',
          border: `1px solid ${emphasis ? communityColor + '44' : 'var(--border)'}`,
        }}
      >
        ›
      </span>
    </Link>
  )
}
