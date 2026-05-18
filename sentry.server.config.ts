// Configuración Sentry en el servidor (Node runtime de Next, no edge).
// Se importa desde instrumentation.ts.

import * as Sentry from '@sentry/nextjs'

const DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: DSN,
  enabled: !!DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
  tracesSampleRate: 0.1,
})
