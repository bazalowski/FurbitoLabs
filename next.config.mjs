import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  // Leaflet requires transpiling on SSR
  transpilePackages: ['leaflet'],
  // Performance: compress responses
  compress: true,
}

// Opciones del wrapper Sentry. Mínimas: sin auth token aún (no subiremos
// sourcemaps al servidor hasta que el usuario configure SENTRY_AUTH_TOKEN).
// El wrapper sigue funcionando sin él — solo perdemos stack traces minified.
const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Sin auth token, desactivamos upload de sourcemaps para no romper el build.
  disableLogger: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
  // Skip telemetría del propio plugin a Sentry.
  telemetry: false,
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
