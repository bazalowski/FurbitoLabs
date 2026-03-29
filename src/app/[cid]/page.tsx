'use client'

import { useState } from 'react'
import { useSession } from '@/stores/session'
import { useEvents } from '@/hooks/useEvents'
import { usePlayers, usePlayer } from '@/hooks/usePlayers'
import { useCommunity } from '@/hooks/useCommunity'
import { useVotes } from '@/hooks/useVotes'
import { EventCard } from '@/components/events/EventCard'
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
  const { upcoming, past, loading: eventsLoading } = useEvents(cid)
  const { players } = usePlayers(cid)
  const { votes } = useVotes(cid)
  const { player: me } = usePlayer(
    (session.role === 'player' || session.role === 'admin') ? session.playerId : null
  )
  const [showTeams, setShowTeams] = useState(false)

  const nextEvent = upcoming[0]
  const recentPast = past.slice(0, 2)
  const communityColor = session.communityColor || '#a8ff3e'
  const isLoggedIn = (session.role === 'player' || session.role === 'admin') && !!session.playerId

  const level = me ? getLevel(me.xp) : null
  const pct = me ? xpPercent(me.xp) : 0
  const rating = me ? getPlayerRating(me.id, votes) : null

  return (
    <div className="view-enter">
      <Header
        title={<Logo />}
        right={
          community && (
            <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>
              {community.name}
            </span>
          )
        }
      />

      <div className="px-4 space-y-4 pt-2 pb-28">

        {/* Player Profile Summary Card */}
        {isLoggedIn && me && level && (
          <Link href={`/${cid}/jugadores/${session.playerId}`} className="block select-none">
            <div
              className="rounded-m p-3 flex items-center gap-3 active:scale-[0.97] transition-transform"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <PlayerAvatar player={me} size={48} communityColor={communityColor} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{me.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {level.icon} Nv. {level.level} - {level.name}
                </p>
                <div
                  className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden"
                  style={{ background: communityColor + '22' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: communityColor }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                  <span>{me.goles} goles</span>
                  <span>{me.asistencias} asist.</span>
                  <span>{me.partidos} partidos</span>
                  {rating && (
                    <span style={{ color: communityColor }}>
                      {'\u2605'} {rating.avg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* 4 Main Action Cards (2x2 grid) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Jugadores */}
          <Link href={`/${cid}/jugadores`} className="select-none cursor-pointer">
            <div
              className="rounded-m p-4 text-center active:scale-[0.97] transition-transform min-h-[120px] flex flex-col items-center justify-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <span className="text-3xl">{'\uD83D\uDC65'}</span>
              <p className="font-bebas text-lg tracking-wider mt-2">Jugadores</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Plantilla completa</p>
            </div>
          </Link>

          {/* Valorar */}
          {isLoggedIn ? (
            <Link href={`/${cid}/valorar`} className="select-none cursor-pointer">
              <div
                className="rounded-m p-4 text-center active:scale-[0.97] transition-transform min-h-[120px] flex flex-col items-center justify-center"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <span className="text-3xl">{'\u2B50'}</span>
                <p className="font-bebas text-lg tracking-wider mt-2">Valorar</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{'Valora a tus compa\u00F1eros'}</p>
              </div>
            </Link>
          ) : (
            <div
              className="rounded-m p-4 text-center min-h-[120px] flex flex-col items-center justify-center opacity-50 select-none"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <span className="text-3xl">{'\uD83D\uDD12'}</span>
              <p className="font-bebas text-lg tracking-wider mt-2">Valorar</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{'Inicia sesi\u00F3n para valorar'}</p>
            </div>
          )}

          {/* Equipos */}
          <button
            onClick={() => setShowTeams(prev => !prev)}
            className="select-none text-left w-full cursor-pointer"
          >
            <div
              className="rounded-m p-4 text-center active:scale-[0.97] transition-transform min-h-[120px] flex flex-col items-center justify-center"
              style={{
                background: showTeams ? communityColor + '11' : 'var(--card)',
                border: `1px solid ${showTeams ? communityColor + '44' : 'var(--border)'}`,
              }}
            >
              <span className="text-3xl">{'\u2696\uFE0F'}</span>
              <p className="font-bebas text-lg tracking-wider mt-2">Equipos</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Genera equipos equilibrados</p>
            </div>
          </button>

          {/* Mapa */}
          <Link href={`/${cid}/pistas`} className="select-none cursor-pointer">
            <div
              className="rounded-m p-4 text-center active:scale-[0.97] transition-transform min-h-[120px] flex flex-col items-center justify-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <span className="text-3xl">{'\uD83D\uDDFA\uFE0F'}</span>
              <p className="font-bebas text-lg tracking-wider mt-2">Mapa</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Encuentra tu pista</p>
            </div>
          </Link>
        </div>

        {/* Team Generator (inline, conditionally shown) */}
        {showTeams && (
          <div
            className="rounded-m p-4 relative"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setShowTeams(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold select-none active:scale-[0.95] transition-transform"
              style={{ background: 'var(--border)', color: 'var(--muted)' }}
            >
              {'\u2715'}
            </button>
            <TeamGenerator
              players={players}
              votes={votes}
              communityColor={communityColor}
            />
          </div>
        )}

        {/* Next Event Banner */}
        {!eventsLoading && nextEvent && (
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--muted)' }}
            >
              {'Pr\u00F3ximo partido'}
            </p>
            <EventCard event={nextEvent} communityId={cid} players={players} />
          </div>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Jugadores', value: players.length, icon: '\uD83D\uDC65' },
            { label: 'Pr\u00F3ximos', value: upcoming.length, icon: '\uD83D\uDCC5' },
            { label: 'Jugados', value: past.length, icon: '\uD83C\uDFC6' },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-m p-3 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xl">{stat.icon}</p>
              <p
                className="font-bebas text-2xl tracking-wider"
                style={{ color: 'var(--comm-color, var(--accent))' }}
              >
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Results */}
        {recentPast.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--muted)' }}
              >
                {'\u00DAltimos resultados'}
              </p>
              <Link
                href={`/${cid}/partidos`}
                className="text-xs font-bold"
                style={{ color: 'var(--comm-color, var(--accent))' }}
              >
                Historial
              </Link>
            </div>
            <div className="space-y-2">
              {recentPast.map(ev => (
                <EventCard key={ev.id} event={ev} communityId={cid} players={players} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
