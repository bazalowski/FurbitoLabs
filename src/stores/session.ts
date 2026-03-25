'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types'

interface SessionState {
  communityId: string | null
  communityColor: string
  playerId: string | null
  role: Role
  // Actions
  login: (communityId: string, color: string, role: Role, playerId?: string) => void
  logout: () => void
  setRole: (role: Role) => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      communityId: null,
      communityColor: '#a8ff3e',
      playerId: null,
      role: 'guest',

      login: (communityId, color, role, playerId) =>
        set({ communityId, communityColor: color, role, playerId: playerId ?? null }),

      logout: () =>
        set({ communityId: null, communityColor: '#a8ff3e', playerId: null, role: 'guest' }),

      setRole: (role) => set({ role }),
    }),
    {
      name: 'furbito-session',
    }
  )
)

// ── Helpers ───────────────────────────────────────────
export const isAdmin   = (state: SessionState) => state.role === 'admin'
export const isPlayer  = (state: SessionState) => state.role === 'player' || state.role === 'admin'
export const isGuest   = (state: SessionState) => state.role === 'guest'

/** Check if a player is an admin for a community (checks admin_ids array + legacy comm_admin_id) */
export function isPlayerAdmin(
  playerId: string | null,
  community: { comm_admin_id?: string | null; admin_ids?: string[] } | null
): boolean {
  if (!playerId || !community) return false
  if (community.admin_ids && community.admin_ids.includes(playerId)) return true
  if (community.comm_admin_id === playerId) return true
  return false
}
