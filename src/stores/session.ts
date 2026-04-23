'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentUser, upsertUserRecord, signOut } from '@/lib/supabase/auth'
import type { Role } from '@/types'

interface SessionState {
  communityId: string | null
  communityColor: string
  playerId: string | null
  role: Role
  authUserId: string | null
  // Actions
  login: (communityId: string, color: string, role: Role, playerId?: string) => Promise<void>
  logout: () => void
  setRole: (role: Role) => Promise<void>
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      communityId: null,
      communityColor: '#a8ff3e',
      playerId: null,
      role: 'guest',
      authUserId: null,

      login: async (communityId, color, role, playerId) => {
        // AuthBootstrap garantiza que existe sesión anónima antes de montar la app.
        const user = await getCurrentUser()
        const authUserId = user?.id ?? null

        set({
          communityId,
          communityColor: color,
          role,
          playerId: playerId ?? null,
          authUserId,
        })

        if (authUserId) {
          await upsertUserRecord(communityId, playerId ?? null, role)
        }
      },

      logout: () => {
        signOut().catch(() => {})
        set({ communityId: null, communityColor: '#a8ff3e', playerId: null, role: 'guest', authUserId: null })
      },

      setRole: async (role) => {
        set({ role })
        const state = get()
        if (state.authUserId && state.communityId) {
          await upsertUserRecord(state.communityId, state.playerId, role)
        }
      },
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
