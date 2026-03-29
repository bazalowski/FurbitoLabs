import { createClient } from './client'
import type { Role } from '@/types'

/**
 * Sign in anonymously — crea un usuario Supabase Auth sin email/password.
 * Mantiene la UX actual de PINs pero con auth real por detrás.
 */
export async function signInAnonymously() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('[FURBITO Auth] Error signing in anonymously:', error.message)
    return null
  }
  return data.user
}

/**
 * Crea o actualiza el registro en public.users vinculado al auth user.
 */
export async function upsertUserRecord(
  communityId: string,
  playerId: string | null,
  role: Role
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        community_id: communityId,
        player_id: playerId,
        role,
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) {
    console.error('[FURBITO Auth] Error upserting user record:', error.message)
    return null
  }

  return data
}

/**
 * Obtiene el usuario autenticado actual.
 */
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Obtiene el registro public.users del usuario autenticado.
 */
export async function getUserRecord() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return data
}

/**
 * Cierra sesión de Supabase Auth.
 */
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

/**
 * Escucha cambios en la sesión de auth (login/logout/token refresh).
 */
export function onAuthStateChange(
  callback: (event: string, userId: string | null) => void
) {
  const supabase = createClient()
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user?.id ?? null)
  })
  return subscription
}
