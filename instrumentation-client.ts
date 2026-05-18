// Configuración Sentry en el browser. Se carga en cada page-load del cliente.
// Solo activa si `NEXT_PUBLIC_SENTRY_DSN` está presente — en dev local sin DSN
// queda en no-op silencioso.

import * as Sentry from '@sentry/nextjs'

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: DSN,
  enabled: !!DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? undefined,

  // Performance — 10% de transacciones para no quemar la cuota del free tier.
  tracesSampleRate: 0.1,

  // Replays: sólo cuando hay error (privacidad + coste). Sin session replays
  // pasivos, sólo los últimos 30s previos al error.
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,

  // No queremos integraciones por defecto que añadan peso de bundle a usuarios
  // sin DSN — la `enabled: false` ya las desactiva, pero por seguridad evitamos
  // pedirles instrumentación específica de browser.
})
