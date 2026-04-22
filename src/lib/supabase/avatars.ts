'use client'

import { createClient } from './client'

const BUCKET = 'avatars'
const MAX_SIDE = 512
const QUALITY = 0.85

export interface UploadAvatarResult {
  url: string
  path: string
}

/**
 * Redimensiona el archivo a MAX_SIDE manteniendo aspect ratio y recorta
 * central a cuadrado. Devuelve un Blob JPEG/WebP listo para subir.
 */
async function resizeAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const minSide = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - minSide) / 2
  const sy = (bitmap.height - minSide) / 2

  const target = Math.min(MAX_SIDE, minSide)
  const canvas = document.createElement('canvas')
  canvas.width = target
  canvas.height = target

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, target, target)
  bitmap.close?.()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo codificar la imagen'))),
      'image/jpeg',
      QUALITY,
    )
  })
}

export async function uploadPlayerAvatar(
  communityId: string,
  playerId: string,
  file: File,
): Promise<UploadAvatarResult> {
  const blob = await resizeAvatar(file)
  const supabase = createClient()
  const path = `${communityId}/${playerId}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  // Cache-bust para que el navegador recargue la imagen tras sobreescritura
  const url = `${data.publicUrl}?v=${Date.now()}`

  const { error: updErr } = await supabase.from('players').update({ avatar: url }).eq('id', playerId)
  if (updErr) throw updErr

  return { url, path }
}

export async function deletePlayerAvatar(communityId: string, playerId: string): Promise<void> {
  const supabase = createClient()
  const path = `${communityId}/${playerId}.jpg`
  await supabase.storage.from(BUCKET).remove([path])
  const { error } = await supabase.from('players').update({ avatar: null }).eq('id', playerId)
  if (error) throw error
}
