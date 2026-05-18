/**
 * Abre el composer de WhatsApp con un texto prerrellenado.
 * En móvil abre la app, en desktop abre web.whatsapp.com.
 * No requiere número: el usuario elige el contacto al enviarlo.
 */
export function shareWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function buildCommunityInviteMessage(opts: {
  communityName: string
  pin: string
  origin: string
}): string {
  const joinUrl = `${opts.origin}/?join=${encodeURIComponent(opts.pin)}`
  return `🟢 Te invito a *${opts.communityName}* en Furbito.\n\nÚnete aquí: ${joinUrl}`
}

export function buildMatchInviteUrl(opts: {
  communityId: string
  eventId: string
  origin: string
}): string {
  return `${opts.origin}/${opts.communityId}/partidos/${opts.eventId}`
}
