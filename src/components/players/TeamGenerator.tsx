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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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

  const modes: { value: TeamMode; label: string; desc: string }[] = [
    { value: 'balanced', label: '⚖️ Equilibrado', desc: 'Maximiza el equilibrio por nivel' },
    { value: 'random',   label: '🎲 Aleatorio',   desc: 'Sorteo completamente aleatorio' },
    { value: 'snake',    label: '🐍 Snake draft', desc: 'Serpenteo por nivel 1-2-2-1...' },
  ]

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Modo de generación</p>
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => { setMode(m.value); setResult(null) }}
            className="w-full text-left px-3 py-2.5 rounded-m transition-all"
            style={{
              background: mode === m.value ? communityColor + '22' : 'var(--card)',
              border: `1px solid ${mode === m.value ? communityColor + '55' : 'var(--border)'}`,
            }}
          >
            <div className="font-bold text-sm">{m.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Player selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Selecciona jugadores ({selectedIds.size}/{players.length})
          </p>
          <button
            onClick={() => {
              if (selectedIds.size === players.length) setSelectedIds(new Set())
              else setSelectedIds(new Set(players.map(p => p.id)))
              setResult(null)
            }}
            className="text-xs font-bold"
            style={{ color: communityColor }}
          >
            {selectedIds.size === players.length ? 'Quitar todos' : 'Todos'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {players.map(p => {
            const selected = selectedIds.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-m text-left transition-all"
                style={{
                  background: selected ? communityColor + '22' : 'var(--card)',
                  border: `1px solid ${selected ? communityColor + '66' : 'var(--border)'}`,
                }}
              >
                <PlayerAvatar player={p} size={32} communityColor={communityColor} />
                <span className="text-xs font-bold truncate">{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Button
        onClick={generate}
        disabled={selectedIds.size < 2}
        className="w-full"
        style={{ background: communityColor, color: '#050d05' }}
      >
        🎯 Generar equipos ({selectedIds.size} jugadores)
      </Button>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Balance indicator */}
          <div
            className="px-4 py-3 rounded-m text-center"
            style={{ background: result.bal.color + '22', border: `1px solid ${result.bal.color}55` }}
          >
            <p className="font-bold text-sm" style={{ color: result.bal.color }}>{result.bal.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{result.bal.msg}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['teamA', 'teamB'] as const).map((team, i) => (
              <div
                key={team}
                className="rounded-m p-3 space-y-2"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bebas text-xl tracking-wider">Equipo {i === 0 ? 'A' : 'B'}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
                    {i === 0 ? result.sumA : result.sumB} pts
                  </span>
                </div>
                {result[team].map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <PlayerAvatar player={p} size={28} communityColor={communityColor} />
                    <span className="text-xs font-semibold truncate">{p.name}</span>
                    <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>{p._score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <Button onClick={generate} variant="ghost" className="w-full text-sm">
            🔄 Regenerar
          </Button>
        </div>
      )}
    </div>
  )
}
