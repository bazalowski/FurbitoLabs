'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PlayerAvatar } from './PlayerCard'
import { generateTeamsByMode } from '@/lib/game/teams'
import type { Player, Vote, TeamGeneratorResult, TeamMode } from '@/types'

interface TeamGeneratorProps {
  players: Player[]
  votes: Vote[]
  communityColor?: string
  onTeamsGenerated?: (result: TeamGeneratorResult | null) => void
}

export function TeamGenerator({ players, votes, communityColor = '#a8ff3e', onTeamsGenerated }: TeamGeneratorProps) {
  const [mode, setMode] = useState<TeamMode>('balanced')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(players.map(p => p.id)))
  const [result, setResult] = useState<TeamGeneratorResult | null>(null)

  const togglePlayer = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setResult(null)
  }

  const generate = () => {
    const selected = players.filter(p => selectedIds.has(p.id))
    if (selected.length < 2) return
    const res = generateTeamsByMode(mode, selected, votes)
    setResult(res)
    onTeamsGenerated?.(res)
  }

  const goBack = () => {
    setResult(null)
    onTeamsGenerated?.(null)
  }

  const modes: { value: TeamMode; icon: string; label: string }[] = [
    { value: 'balanced', icon: '⚖️', label: 'Equilibrado' },
    { value: 'random',   icon: '🎲', label: 'Aleatorio' },
  ]

  /* ── Step 2: Result view ─────────────────────────────── */
  if (result) {
    return (
      <div className="space-y-3">
        {/* Back button */}
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-xs font-bold"
          style={{ color: communityColor }}
        >
          ← Volver a selección
        </button>

        {/* Balance indicator — compact */}
        <div
          className="px-3 py-2 rounded-m text-center"
          style={{ background: result.bal.color + '22', border: `1px solid ${result.bal.color}44` }}
        >
          <p className="font-bold text-xs" style={{ color: result.bal.color }}>
            {result.bal.label} — {result.bal.msg}
          </p>
        </div>

        {/* Teams side by side */}
        <div className="grid grid-cols-2 gap-2">
          {(['teamA', 'teamB'] as const).map((team, i) => (
            <div
              key={team}
              className="rounded-m p-2 space-y-1.5"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bebas text-lg tracking-wider">Equipo {i === 0 ? 'A' : 'B'}</span>
                <span className="text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
                  {i === 0 ? result.sumA : result.sumB} pts
                </span>
              </div>
              {result[team].map(p => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <PlayerAvatar player={p} size={24} communityColor={communityColor} />
                  <span className="text-[11px] font-semibold truncate flex-1">{p.name}</span>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--muted)' }}>{p._score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <Button onClick={generate} variant="ghost" className="w-full text-sm">
          🔄 Regenerar
        </Button>
      </div>
    )
  }

  /* ── Step 1: Mode + Selection + Generate ─────────────── */
  return (
    <div className="space-y-3">
      {/* Mode selector — horizontal scrollable pills */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>Modo</p>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {modes.map(m => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setResult(null) }}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap"
              style={{
                background: mode === m.value ? communityColor + '22' : 'var(--card)',
                border: `1.5px solid ${mode === m.value ? communityColor : 'var(--border)'}`,
                color: mode === m.value ? communityColor : 'var(--foreground)',
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player selection — compact 3-col chip grid */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Jugadores ({selectedIds.size}/{players.length})
          </p>
          <button
            onClick={() => {
              if (selectedIds.size === players.length) setSelectedIds(new Set())
              else setSelectedIds(new Set(players.map(p => p.id)))
              setResult(null)
            }}
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: communityColor, background: communityColor + '15' }}
          >
            {selectedIds.size === players.length ? 'Ninguno' : 'Todos'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {players.map(p => {
            const selected = selectedIds.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-m text-left transition-all"
                style={{
                  background: selected ? communityColor + '22' : 'var(--card)',
                  border: `1.5px solid ${selected ? communityColor + '88' : 'var(--border)'}`,
                }}
              >
                <PlayerAvatar player={p} size={24} communityColor={communityColor} />
                <span className="text-[11px] font-bold truncate">{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={generate}
        disabled={selectedIds.size < 2}
        className="w-full"
        style={{ background: communityColor, color: '#050d05' }}
      >
        🎯 Generar equipos ({selectedIds.size})
      </Button>
    </div>
  )
}
