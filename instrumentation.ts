// Hook de Next 14 para inicializar Sentry en el server según el runtime activo.
// Se ejecuta una vez por proceso (cold start del worker).

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Captura excepciones no manejadas que ocurran durante el render server-side
// y las envía a Sentry antes de devolver el error al cliente.
export async function onRequestError(...args: unknown[]) {
  const { captureRequestError } = await import('@sentry/nextjs')
  // @ts-expect-error — la firma de captureRequestError matchea pero TS no lo infiere por el dynamic import
  return captureRequestError(...args)
}
