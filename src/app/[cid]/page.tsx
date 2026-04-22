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

      <div className="px-4 space-y-4 pt-2 pb-28">

        {/* Player Profile Summary Card */}
        {isLoggedIn && me && level && (
          <Link href={`/${cid}/jugadores/${session.playerId}`} className="block select-none">
            <div
              className="card hairline-top card-glow p-3 flex items-center gap-3 active:scale-[0.97] transition-transform relative overflow-hidden"
              style={{ borderColor: communityColor + '2a' }}
            >
              <span
                aria-hidden="true"
                className="absolute pointer-events-none"
                style={{
                  top: -40,
                  right: -40,
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at center, ${communityColor}22 0%, transparent 60%)`,
                  filter: 'blur(4px)',
                }}
              />
              <div className="relative">
                <PlayerAvatar player={me} size={48} communityColor={communityColor} />
              </div>
              <div className="flex-1 min-w-0 relative">
                <p className="font-bold text-sm truncate">{me.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {level.icon} Nv. {level.level} - {level.name}
                </p>
                <div
                  className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden"
                  style={{ background: communityColor + '22', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${communityColor}cc 0%, ${communityColor} 100%)`,
                      boxShadow: `0 0 10px ${communityColor}66`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                  <span>{me.goles} goles</span>
                  <span>{me.asistencias} asist.</span>
                  <span>{me.partidos} partidos</span>
                  {rating && (
                    <span style={{ color: communityColor, fontWeight: 600 }}>
                      ★ {rating.avg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Community stats — justo bajo el perfil */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Jugadores', value: players.length, icon: '👥', href: `/${cid}/jugadores` },
            { label: 'Próximos', value: upcoming.length, icon: '📅', href: `/${cid}/partidos?tab=proximos` },
            { label: 'Jugados', value: past.length, icon: '🏆', href: `/${cid}/partidos?tab=historial` },
          ].map(stat => (
            <Link
              key={stat.label}
              href={stat.href}
              className="card hairline-top card-glow stat-tile p-3 text-center block select-none active:scale-[0.97] transition-transform"
            >
              <p className="text-xl relative">{stat.icon}</p>
              <p
                className="font-bebas text-2xl tracking-wider relative tabular-nums"
                style={{
                  color: 'var(--comm-color, var(--accent))',
                  textShadow: '0 0 14px color-mix(in srgb, var(--comm-color, var(--accent)) 35%, transparent)',
                }}
              >
                {stat.value}
              </p>
              <p className="text-xs relative" style={{ color: 'var(--muted)' }}>{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* MVP reminder — solo si hay partidos con voto pendiente */}
        {isLoggedIn && mvpPending > 0 && (
          <Link
            href={`/${cid}/partidos?tab=historial`}
            className="card hairline-top card-glow block select-none p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
            style={{
              borderColor: `${communityColor}66`,
              boxShadow: `0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px ${communityColor}22 inset, 0 8px 22px ${communityColor}22`,
            }}
          >
            <span className="text-2xl" style={{ filter: `drop-shadow(0 2px 6px ${communityColor}66)` }}>🏆</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Vota al MVP de tus últimos partidos</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {mvpPending === 1
                  ? 'Tienes 1 partido con votación abierta.'
                  : `Tienes ${mvpPending} partidos con votación abierta.`}
              </p>
            </div>
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-lg font-bold"
              style={{
                color: communityColor,
                background: `${communityColor}1a`,
                border: `1px solid ${communityColor}44`,
              }}
            >
              {'›'}
            </span>
          </Link>
        )}

        {/* Quick actions — acceso rápido a valoraciones */}
        {isLoggedIn && (
          <Link
            href={`/${cid}/valorar`}
            className="card hairline-top card-glow block select-none p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <span className="text-2xl">⭐</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Valorar compañeros</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Puntúa habilidades para equilibrar equipos.
              </p>
            </div>
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-lg"
              style={{ color: 'var(--muted)', background: 'var(--card2)', border: '1px solid var(--border)' }}
            >
              {'›'}
            </span>
          </Link>
        )}

        {/* Tutorial onboarding — solo si el jugador aún no tiene la insignia */}
        {isLoggedIn && me && !me.badges.includes('tutorial') && (
          <Link
            href={`/${cid}/ayuda`}
            className="card hairline-top card-glow block select-none p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
            style={{
              borderColor: `${communityColor}55`,
              boxShadow: `0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px ${communityColor}22 inset, 0 8px 22px ${communityColor}1a`,
            }}
          >
            <span className="text-2xl" style={{ filter: `drop-shadow(0 2px 6px ${communityColor}55)` }}>🎓</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Cómo usar Furbito</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Tutorial de bienvenida · gana la insignia Manual del Jugador.
              </p>
            </div>
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-lg font-bold"
              style={{
                color: communityColor,
                background: `${communityColor}1a`,
                border: `1px solid ${communityColor}44`,
              }}
            >
              {'›'}
            </span>
          </Link>
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

        {/* Shortcut: Generador de equipos (solo cuando no hay partido próximo,
            para evitar duplicar el trigger del hero) */}
        {isLoggedIn && players.length >= 2 && !nextEvent && (
          <button
            type="button"
            onClick={() => setShowTeams(prev => !prev)}
            aria-expanded={showTeams}
            className="card hairline-top card-glow no-lift w-full text-left select-none p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
            style={{
              borderColor: showTeams ? communityColor + '88' : undefined,
              boxShadow: showTeams
                ? `0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px ${communityColor}22 inset, 0 10px 26px ${communityColor}22`
                : undefined,
            }}
          >
            <span className="text-2xl">⚖️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Generar equipos</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Prueba combinaciones rápidas sin abrir un partido.
              </p>
            </div>
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-lg transition-transform"
              style={{
                color: showTeams ? communityColor : 'var(--muted)',
                background: showTeams ? `${communityColor}1a` : 'var(--card2)',
                border: `1px solid ${showTeams ? communityColor + '44' : 'var(--border)'}`,
                transform: showTeams ? 'rotate(90deg)' : 'none',
              }}
            >
              {'›'}
            </span>
          </button>
        )}

        {/* Team Generator — aparece SIEMPRE justo debajo de su trigger */}
        {showTeams && (
          <div
            className="rounded-m p-4 relative animate-slide-up"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setShowTeams(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold select-none active:scale-[0.95] transition-transform"
              style={{ background: 'var(--border)', color: 'var(--muted)' }}
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
