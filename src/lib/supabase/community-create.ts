'use client'

import { createClient } from './client'

export interface CreateCommunityInput {
  name: string
  pin: string
  color: string
  adminName: string
}

export interface CreateCommunityResult {
  communityId: string
  playerId: string
  playerCode: string
  color: string
}

export type CreateError =
  | 'rate_limited'
  | 'pin_in_use'
  | 'invalid_name'
  | 'invalid_admin_name'
  | 'invalid_pin'
  | 'invalid_color'
  | 'invalid_body'
  | 'server_error'
  | 'network_error'

/**
 * Crea una comunidad vía Edge Function (service_role) tras la mig 014
 * que cerró el INSERT directo desde anon en `communities`.
 */
export async function createCommunity(
  input: CreateCommunityInput,
): Promise<{ ok: true; data: CreateCommunityResult } | { ok: false; error: CreateError }> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('community-create', {
    body: input,
  })

  if (error) {
    const ctx = (error as { context?: Response }).context
    if (ctx?.status === 429) return { ok: false, error: 'rate_limited' }
    if (ctx?.status === 409) return { ok: false, error: 'pin_in_use' }
    if (ctx?.status === 400) {
      // El body del 400 trae `{ error: 'invalid_pin' | ... }`. Intentamos leerlo.
      try {
        const body = await ctx?.clone().json()
        const code = body?.error
        if (
          code === 'invalid_pin' ||
          code === 'invalid_name' ||
          code === 'invalid_admin_name' ||
          code === 'invalid_color' ||
          code === 'invalid_body'
        ) {
          return { ok: false, error: code }
        }
      } catch {
        // fallthrough
      }
      return { ok: false, error: 'invalid_body' }
    }
    if (ctx && ctx.status >= 500) return { ok: false, error: 'server_error' }
    return { ok: false, error: 'network_error' }
  }

  if (
    data &&
    typeof data.communityId === 'string' &&
    typeof data.playerId === 'string' &&
    typeof data.playerCode === 'string' &&
    typeof data.color === 'string'
  ) {
    return { ok: true, data }
  }

  return { ok: false, error: 'network_error' }
}
