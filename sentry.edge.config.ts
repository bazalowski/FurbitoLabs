// Configuración Sentry en runtime Edge de Next (middleware, edge functions).
// FURBITO no usa middleware activo pero esto deja la base si se añade.

import * as Sentry from '@sentry/nextjs'

const DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: DSN,
  enabled: !!DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
  tracesSampleRate: 0.1,
})
