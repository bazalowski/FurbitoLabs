'use client'

import { createClient } from './client'

export interface LookupResult {
  id: string
  color: string
}

export type LookupError =
  | 'not_found'
  | 'rate_limited'
  | 'invalid_pin'
  | 'network_error'

/**
 * Busca una comunidad por PIN vía Edge Function con rate-limit.
 * Sustituye al SELECT directo que permitía bruteforce.
 */
export async function lookupCommunityByPin(
  pin: string,
): Promise<{ ok: true; data: LookupResult } | { ok: false; error: LookupError }> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('community-lookup', {
    body: { op: 'lookup', pin },
  })

  if (error) {
    // @supabase/functions-js mete el body del error http en error.context
    const ctx = (error as { context?: Response }).context
    if (ctx?.status === 404) return { ok: false, error: 'not_found' }
    if (ctx?.status === 429) return { ok: false, error: 'rate_limited' }
    if (ctx?.status === 400) return { ok: false, error: 'invalid_pin' }
    return { ok: false, error: 'network_error' }
  }

  if (data && typeof data.id === 'string' && typeof data.color === 'string') {
    return { ok: true, data: { id: data.id, color: data.color } }
  }

  return { ok: false, error: 'network_error' }
}

/**
 * Verifica si un PIN está disponible (no usado) vía Edge Function.
 */
export async function checkPinAvailable(
  pin: string,
): Promise<{ ok: true; available: boolean } | { ok: false; error: LookupError }> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('community-lookup', {
    body: { op: 'check_pin', pin },
  })

  if (error) {
    const ctx = (error as { context?: Response }).context
    if (ctx?.status === 429) return { ok: false, error: 'rate_limited' }
    if (ctx?.status === 400) return { ok: false, error: 'invalid_pin' }
    return { ok: false, error: 'network_error' }
  }

  if (data && typeof data.available === 'boolean') {
    return { ok: true, available: data.available }
  }

  return { ok: false, error: 'network_error' }
}
