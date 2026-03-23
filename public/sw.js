// ════════════════════════════════════════════════════
//  FURBITO Service Worker (PWA)
//  Estrategia: Network-first para la app,
//  Cache-first para assets estáticos
// ════════════════════════════════════════════════════

const CACHE_NAME = 'furbito-v2'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — Network first, fallback cache
self.addEventListener('fetch', event => {
  // No cachear llamadas a Supabase API
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar en cache si es exitoso
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
