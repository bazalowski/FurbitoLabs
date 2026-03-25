// ════════════════════════════════════════════════════
//  FURBITO Service Worker (PWA)
//  Cache-first for static assets
//  Network-first for API/data requests
//  Offline fallback page
// ════════════════════════════════════════════════════

const CACHE_NAME = 'furbito-v3'
const OFFLINE_URL = '/offline.html'

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  OFFLINE_URL,
]

// ── Install ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate — clean old caches ─────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Helpers ─────────────────────────────────────────
function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|avif|ico)(\?.*)?$/i.test(url.pathname)
}

function isApiRequest(url) {
  return url.hostname.includes('supabase.co') ||
         url.pathname.startsWith('/api/') ||
         url.pathname.startsWith('/_next/data/')
}

function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

// ── Fetch ───────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip cross-origin API calls (Supabase, etc.)
  if (isApiRequest(url)) {
    // Network-first for API/data requests
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Cache-first for static assets (.js, .css, images, fonts)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Network-first for navigation requests, with offline fallback
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(event.request).then(cached => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
