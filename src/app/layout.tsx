import type { Metadata, Viewport } from 'next'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { AuthBootstrap } from '@/components/AuthBootstrap'
import './globals.css'

export const metadata: Metadata = {
  title: 'FURBITO ⚽',
  description: 'Gestiona partidos, equipos, estadísticas y rankings de tu comunidad de fútbol',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FURBITO',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a1408',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <ServiceWorkerRegister />
        <div id="root" style={{ position: 'relative', zIndex: 1 }}>
          <AuthBootstrap>{children}</AuthBootstrap>
        </div>
      </body>
    </html>
  )
}
