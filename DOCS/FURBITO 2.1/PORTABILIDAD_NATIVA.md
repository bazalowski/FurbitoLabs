# FURBITO — Portabilidad a app nativa + estrategia de dos vertientes

> **Qué responde este doc**:
> 1. ¿Qué parte del trabajo actual es portable a una app nativa (React Native/Expo) y cuál no?
> 2. ¿Qué hay que tocar hoy en la web para que la portabilidad sea real y barata?
> 3. ¿Cómo se articulan las dos vertientes que planteas (marca FURBITO + app nativa / mejoras a lo existente) y bajo qué regla se decide qué mover?
>
> Usa datos reales del repo — no promesas — y remata con un **plan de shared-core** accionable.
>
> Complementa a [FEATURE_AUDIT.md](FEATURE_AUDIT.md), [BACKEND_AUDIT.md](BACKEND_AUDIT.md), [UI_AUDIT_PANTALLAS.md](UI_AUDIT_PANTALLAS.md#16-pre-nativa-decisiones-que-ahorran-trabajo-luego) (§16) y [FURBITO_DESIGN_SYSTEM.md](FURBITO_DESIGN_SYSTEM.md). Sustituye y extiende el enfoque de [GUIA_MIGRACION_APP_NATIVA.md](../GUIA_MIGRACION_APP_NATIVA.md) (que se enfoca en el cómo técnico — aquí va el **qué** y el **porqué**).

---

## Índice

1. [TL;DR](#1-tldr)
2. [Inventario del repo: qué existe hoy](#2-inventario-del-repo-qué-existe-hoy)
3. [Tabla completa de portabilidad por módulo](#3-tabla-completa-de-portabilidad-por-módulo)
4. [Lo que se reusa tal cual (🟢 copy-paste)](#4-lo-que-se-reusa-tal-cual--copy-paste)
5. [Lo que se adapta con ajustes pequeños (🟡 adapter layer)](#5-lo-que-se-adapta-con-ajustes-pequeños--adapter-layer)
6. [Lo que se reescribe (🔴 no portable)](#6-lo-que-se-reescribe--no-portable)
7. [Preguntas de fondo antes de decidir](#7-preguntas-de-fondo-antes-de-decidir)
8. [Las dos vertientes: cuándo tiene sentido cada una](#8-las-dos-vertientes-cuándo-tiene-sentido-cada-una)
9. [Recomendación de ruta](#9-recomendación-de-ruta)
10. [Plan de "shared-core" accionable](#10-plan-de-shared-core-accionable)
11. [Riesgos y trampas comunes](#11-riesgos-y-trampas-comunes)

---

## 1. TL;DR

- **~35% del código actual es portable literalmente** a la app nativa: toda la lógica de dominio (`src/lib/game/`), los tipos (`src/types/`), utilidades puras y la lógica de los hooks (no su UI).
- **~25% es adaptable** con un `adapter` (Supabase client, session store, avatars, notificaciones): misma lógica, distinto storage/API.
- **~40% se reescribe**: todos los componentes UI, Tailwind, Next.js app-router, Service Worker, Web Push con VAPID, rutas server.
- El backend Supabase es **100% reutilizable** — la app nativa se conecta al **mismo proyecto**.
- **La portabilidad NO es binaria**. Es una función de las decisiones que tomes hoy en la web:
  - Si mueves dominio a Edge Functions (ver [BACKEND_AUDIT §5 P0](BACKEND_AUDIT.md#5-edge-functions)), la nativa hereda esa lógica gratis.
  - Si fijas tokens CSS a variables (ver [DESIGN_SYSTEM](FURBITO_DESIGN_SYSTEM.md)), la nativa tiene un `StyleSheet` casi trivial.
  - Si NO haces nada, cada feature nueva en web cuesta el doble porque hay que reimplementarla.

**Decisión estratégica**: las dos vertientes (1) construir la nativa y (2) seguir mejorando la web **no son independientes**. Tienen que ejecutarse sobre un **shared-core** común. Sin shared-core las dos vertientes se devoran mutuamente (todo lo que mejoras en la web se pierde en la nativa y viceversa). Con shared-core, el 70% del esfuerzo aprovecha a ambas plataformas.

---

## 2. Inventario del repo: qué existe hoy

Conteo real (LoC) del proyecto:

| Zona | Archivos | LoC | Portable? |
|------|----------|-----|-----------|
| `src/types/index.ts` | 1 | 201 | 🟢 100% |
| `src/lib/game/*` (badges, scoring, teams, levels, mvp-finalize, badge-art) | 6 | 1298 | 🟢 ~95% |
| `src/lib/utils.ts` | 1 | pequeño | 🟢 100% |
| `src/lib/supabase/{client,server,auth,avatars}.ts` | 4 | 209 | 🟡 adapter |
| `src/lib/notifications/*` | 2 | 322 | 🔴 reescribir |
| `src/hooks/*` | 10 | 573 | 🟡 lógica sí / API Supabase sí / tipos sí — realtime ok |
| `src/stores/session.ts` | 1 | 77 | 🟡 cambia `localStorage` → AsyncStorage |
| `src/app/**` (Next.js routes) | ~15 pages | mucho | 🔴 reescribir en expo-router |
| `src/components/**` | ~30 | mucho | 🔴 reescribir (Tailwind/div → RN) |
| `public/sw.js` + PWA manifest | 2 | — | 🔴 no aplica en nativa |
| `supabase/*` (schema, migrations, functions) | 10+ | — | 🟢 100% — es el mismo backend |

> Nota: "~35% portable" es una estimación por **LoC de lógica crítica**. En **pantallas** que el usuario ve, lo portable es cercano a 0% (toda UI se reescribe). El valor del 35% está en que es la lógica de más difícil reconstrucción — el dominio del producto.

**Balance**: la lógica de juego está extraordinariamente bien aislada del DOM. Es el activo más portable del proyecto. Lo que cuesta reescribir es todo lo visual — pero eso es inherente a cambiar de web a nativa, no es deuda.

---

## 3. Tabla completa de portabilidad por módulo

| Módulo | Archivo(s) | Estado portabilidad | Cambios necesarios |
|--------|-----------|---------------------|-------------------|
| Tipos dominio | `src/types/index.ts` | 🟢 copy-paste | Ninguno |
| Badges (definiciones + detect) | `src/lib/game/badges.ts` | 🟢 copy-paste | Ninguno |
| Scoring (puntos Comunio, tiers, rating) | `src/lib/game/scoring.ts` | 🟢 copy-paste | Ninguno |
| Equipos (balanced/random) | `src/lib/game/teams.ts` | 🟢 copy-paste | Ninguno |
| Niveles (curva XP) | `src/lib/game/levels.ts` | 🟢 copy-paste | Ninguno |
| Finalize MVP | `src/lib/game/mvp-finalize.ts` | 🟢 copy-paste | Ninguno |
| BadgeArt (metadata visual) | `src/lib/game/badge-art.ts` | 🟢 casi copy-paste | Revisar si usa SVG inline (en RN se usa `react-native-svg`) |
| Utilidades genéricas | `src/lib/utils.ts` | 🟢 copy-paste | Ninguno (es mayormente `uid`, `fmtDateTime`…) |
| Session store | `src/stores/session.ts` | 🟡 adaptar | `persist` con `AsyncStorage` en lugar de `localStorage`; `signInAnonymously` idéntico |
| Supabase client | `src/lib/supabase/client.ts` | 🟡 adaptar | `createClient` directo con `AsyncStorage` (sin `@supabase/ssr`) |
| Supabase server client | `src/lib/supabase/server.ts` | 🔴 no aplica | Nativa no tiene SSR |
| Supabase auth helpers | `src/lib/supabase/auth.ts` | 🟢 casi copy-paste | Idéntico |
| Avatars upload | `src/lib/supabase/avatars.ts` | 🟡 adaptar | Redimensionar con `expo-image-manipulator` en vez de `createImageBitmap`/Canvas |
| Hooks de datos | `src/hooks/use{Community,Events,Players,Pistas,Votes,…}.ts` | 🟡 lógica idéntica | Son hooks de React puros — funcionan tal cual en RN. Revisar solo que `createClient` se importe del adapter |
| Push notifications (cliente) | `src/lib/notifications/push-manager.ts` + `usePushNotifications` | 🔴 reescribir | Web Push/VAPID ≠ APNs/FCM. Se usa `expo-notifications` |
| Notification service (cliente) | `src/lib/notifications/notification-service.ts` | 🟡 adaptar | `showLocalNotification` cambia. `notifyCommunity/Player` (Edge Function invoke) es igual |
| Service Worker `public/sw.js` | — | 🔴 no aplica | RN usa background tasks / notificaciones OS |
| Páginas `src/app/**` | ~15 archivos | 🔴 reescribir | expo-router en lugar de Next App Router |
| Componentes UI `src/components/**` | ~30 archivos | 🔴 reescribir | `div` → `View`, Tailwind → `StyleSheet`/NativeWind |
| Estilos globales `globals.css` | 1 archivo | 🔴 no aplica | Tokens sobreviven como constantes TS — la sintaxis CSS no |
| PistaMap | — (eliminado en web 2026-04-23) | 🆕 **feature exclusiva nativa** | En web no existe mapa. Implementar desde cero en nativa con `react-native-maps` (Apple Maps iOS / Google Maps Android). La tabla `pistas` y columnas `lat`/`lng` ya existen en BD. Ver [FEATURE_AUDIT.md §14](FEATURE_AUDIT.md#14-pistas-sin-mapa-en-web--mapa-reservado-para-nativa) |
| Chart de evolución puntos | `src/components/players/PointsEvolutionChart.tsx` | 🔴 reescribir | SVG web → `react-native-svg` + librería chart (`victory-native`, `recharts-native`…) |
| **Backend Supabase** | `supabase/**` | 🟢 100% | **Mismo proyecto**. Sin cambios. |

---

## 4. Lo que se reusa tal cual (🟢 copy-paste)

Son **1298 + 201 + utils ≈ 1500 líneas** de lógica de negocio pura que funciona idéntica en web y nativa:

- **Dominio del juego** (`src/lib/game/*`): cómo se calcula XP, qué badges se otorgan, cómo se balancean equipos, qué puntos vale cada gol, cuánto XP por nivel. **Sin dependencias del DOM ni de Next.js**. Importan solo `src/types/index.ts`.
- **Tipos** (`src/types/index.ts`): contrato entre el frontend (web o nativa) y Supabase.
- **Utilidades** (`src/lib/utils.ts`): `uid`, `fmtDateTime`, `genPlayerCode`, helpers triviales.

**Valor estratégico**: esta es la propiedad intelectual del producto. Es lo que **NO** vas a reescribir, ni cuando migres a nativa, ni si cambias de Supabase a otro backend, ni si un día lo pasas a SSR en Go. Es el núcleo.

**Recomendación operativa**: extraer este bloque a un **paquete compartido** (monorepo o submódulo git). Detalle en §10.

### Condición única para que siga siendo "copy-paste"

Que **nunca** introduzcamos dependencias del entorno ahí. Concretamente, **prohibido** en `src/lib/game/`:
- `document`, `window`, `localStorage`, `Image`, `fetch` directo.
- Imports de `next/*`, `@supabase/*`, `react`, `react-dom`.
- Cualquier CSS / tailwind / variable de entorno.

Es un invariante fácil de mantener si todos lo saben. Un lint rule (`no-restricted-imports`) lo hace explícito.

---

## 5. Lo que se adapta con ajustes pequeños (🟡 adapter layer)

Son piezas con **la misma lógica** pero que tocan una API que cambia entre web y nativa:

### 5.1 Supabase client

**Web** (`src/lib/supabase/client.ts`):
```ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(URL, ANON_KEY)
}
```

**Nativa**:
```ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(URL, ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
})
```

Cambio mecánico. Una vez hecho, `supabase.from('events').select(...)` funciona idéntico en ambos.

### 5.2 Session store

El store actual ([session.ts](../../src/stores/session.ts)) usa `zustand` con `persist`. `persist` acepta cualquier storage (solo pide `getItem`/`setItem`). Cambio:

```ts
// web
persist(..., { name: 'furbito-session' })
// nativa
persist(..., { name: 'furbito-session', storage: createJSONStorage(() => AsyncStorage) })
```

La lógica (`login`, `logout`, `signInAnonymously`, `upsertUserRecord`) es idéntica.

### 5.3 Hooks de datos

Revisión archivo por archivo:

| Hook | Lógica portable? | Dependencias que cambian |
|------|-----------------|--------------------------|
| `useCommunity` | Sí | Solo el import del Supabase client |
| `useEvents` / `useEvent` | Sí | Ídem. Realtime funciona en RN via WebSocket idéntico |
| `usePlayers` / `usePlayer` | Sí | Ídem |
| `usePistas` | Sí | Ídem |
| `useVotes` | Sí | Ídem |
| `useMvpVotes` / `usePendingMvpVotes` | Sí | Ídem |
| `usePlayerMatches` | Sí | Ídem |
| `useRecentMatchPoints` | Sí | Ídem |
| `usePushNotifications` | **No** — mueve a §6 | Web Push ≠ APNs/FCM |

**Conclusión**: **9 de 10 hooks son portables tal cual** siempre que el Supabase client esté importado desde un adapter compartido.

### 5.4 Avatars upload

[avatars.ts](../../src/lib/supabase/avatars.ts) usa `createImageBitmap` + `<canvas>` para redimensionar. En RN:

```ts
import * as ImageManipulator from 'expo-image-manipulator'
const result = await ImageManipulator.manipulateAsync(
  file.uri,
  [{ resize: { width: 512 } }],
  { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
)
// subir result.uri a Supabase Storage
```

Mismo bucket, mismo path, misma URL resultante. El campo `players.avatar` es idéntico.

### 5.5 Notification service

[notification-service.ts](../../src/lib/notifications/notification-service.ts) tiene dos capas:
- `showLocalNotification`: **cambia** en nativa (se usa `expo-notifications`).
- `notifyCommunity` / `notifyPlayer`: invoca la Edge Function `send-push`. **Idéntica en nativa**, solo hay que enviar un `endpoint` distinto (FCM/APNs vía Expo Push en lugar de Web Push).

**Implicación**: la Edge Function `send-push` tendrá que saber enviar a **tres tipos de endpoint**:
- Web Push (VAPID) — como hoy.
- iOS (APNs) — vía Expo Push Service o directo.
- Android (FCM) — vía Expo Push o directo.

[Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/) unifica iOS+Android bajo un solo API HTTP — la recomendación estándar.

### 5.6 Tokens de diseño

Los tokens del [FURBITO_DESIGN_SYSTEM.md](FURBITO_DESIGN_SYSTEM.md) hoy viven como **CSS variables** en `globals.css`. Si los extraemos a un TS compartido:

```ts
// shared/design-tokens.ts
export const colors = {
  bg:       '#0a0a0a',
  surface:  '#141414',
  primary:  '#a8ff3e',
  // …
}
export const radius = { sm: 8, md: 12, lg: 16, xl: 20 }
export const shadows = { card: '0 1px 0 rgba(255,255,255,0.04), 0 10px 30px rgba(0,0,0,0.4)' }
```

- En web: `globals.css` genera los CSS vars desde este archivo vía build step (o manualmente — 20 tokens no cambian).
- En nativa: `StyleSheet.create({ card: { backgroundColor: colors.surface, borderRadius: radius.md } })`.

El doble mantenimiento desaparece.

---

## 6. Lo que se reescribe (🔴 no portable)

Esto es **inevitable** y **no es deuda** — viene con el territorio de cambiar de web a nativa.

### 6.1 Toda la UI

~30 componentes en `src/components/**` + ~15 páginas en `src/app/**`. Reescritura limpia en React Native:

- `<div>` → `<View>`.
- `<button>` → `<Pressable>` / `<TouchableOpacity>`.
- `<input>` → `<TextInput>`.
- `className="flex gap-2"` → `style={{ flexDirection: 'row', gap: 8 }}` (o NativeWind).
- `<Link href>` → `router.push` de `expo-router` (idéntica API).

**Estimación**: si la arquitectura está bien (design system canónico, componentes pequeños), 3-4 semanas para reescribir toda la UI base + 2-3 semanas para pulir. Con Claude Code ayudando, más cerca del rango bajo.

### 6.2 Navegación y rutas

Next.js App Router → `expo-router`. **Estructura casi idéntica** (file-based routing), pero archivos cambian (`page.tsx` → `index.tsx`, layout conceptos distintos).

### 6.3 Estilos globales / Tailwind

Tailwind web (JIT + PostCSS) **no funciona** nativamente en RN. Opciones:
- **NativeWind v4**: transforma clases Tailwind a `StyleSheet` en RN. Buena DX si la web ya es Tailwind. Overhead pequeño.
- **StyleSheet puro + tokens**: más verboso pero sin dependencias extra.

Recomendación: **StyleSheet + tokens compartidos**. NativeWind es tentador pero añade complejidad (versiones de babel, expo compat, config). Con 30 componentes no merece el framework extra.

### 6.4 Service Worker + PWA

`public/sw.js` y manifest PWA **no aplican** en nativa. La nativa tiene sus propias primitives (notifications, background fetch, etc.).

### 6.5 Web Push con VAPID

Se sustituye por **APNs + FCM** unificados vía [Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/). Flujo:

1. App nativa obtiene un `ExpoPushToken` único por dispositivo.
2. Se guarda en `push_subscriptions` como un tercer tipo (`kind: 'web' | 'ios' | 'android'`).
3. `send-push` Edge Function hace POST a `https://exp.host/--/api/v2/push/send` si `kind != 'web'`, o `web-push` si `kind === 'web'`.

Misma tabla, misma Edge Function, dos branches internas.

### 6.6 Mapas y gráficos

- **Mapa de pistas**: feature **exclusiva de la versión nativa** (eliminada en web 2026-04-23). Implementar desde cero con `react-native-maps` (Apple Maps iOS / Google Maps Android). Alcance mínimo nativa: lista de pistas de la comunidad en mapa + tap-para-añadir con geolocalización + botón "Cómo llegar" a Maps nativo. Propuestas reagrupadas aquí del antiguo [UI_AUDIT_PANTALLAS.md §10](UI_AUDIT_PANTALLAS.md#10-pistas--eliminado-2026-04-23) y [FEATURE_AUDIT.md §14](FEATURE_AUDIT.md#14-pistas-sin-mapa-en-web--mapa-reservado-para-nativa):
  - Vista dual mapa/lista con "pista habitual" destacada.
  - Añadir pista tocando el mapa (tap largo → pin draggable).
  - Distancia a pista desde geolocalización del usuario.
  - Reseñas minimalistas (superficie, condiciones, nota).
  - Clima en el evento vía Open-Meteo.
  - Pistas públicas compartidas entre comunidades cercanas.
- `PointsEvolutionChart` → `react-native-svg` + librería de chart (`victory-native`).

El mapa es 3-5 días si se hace bien (permisos, lista dual, tap-pin, deep-link Maps). El chart, 1 día.

---

## 7. Preguntas de fondo antes de decidir

Antes de lanzarse a cualquiera de las dos vertientes, responder estas 5 preguntas. Cada respuesta cambia la estrategia.

### 7.1 ¿La nativa es **sustituto** o **complemento** de la web?

- **Sustituto**: la web queda como landing + demo, la nativa es el producto real (muchas apps lo hacen). → Doble mantenimiento bajo, pero pierdes el SEO/link-sharing.
- **Complemento** (modelo Mister/Sofascore): web y nativa en paralelo, misma base. → Doble mantenimiento alto sin shared-core, razonable con él.

Hoy el repo [GUIA_MIGRACION_APP_NATIVA.md §1](../GUIA_MIGRACION_APP_NATIVA.md) ya asume **complemento**. Sensato — pero solo si montas el shared-core.

### 7.2 ¿Qué features **requieren nativa** para existir?

Solo un puñado. El resto son "nice to have" en nativa:

| Feature | Posible en PWA hoy | Mejor en nativa |
|---------|:------------------:|:---------------:|
| Push confiable en iOS | ⚠️ solo PWA instalada + iOS 16.4+ | ✅ |
| App Store presence (descubrimiento + confianza) | ❌ | ✅ |
| Biometric unlock (Face ID) | ❌ | ✅ |
| Cámara para avatar | ✅ (file input) | ✅ (mejor UX) |
| Compartir a WhatsApp | ✅ (navigator.share) | ✅ (mejor nativo) |
| Offline-queue de confirmaciones | ⚠️ con IndexedDB + SW | ✅ (AsyncStorage + background sync) |
| Contact picker para invitar | ⚠️ limitado | ✅ (expo-contacts) |
| Widget de "próximo partido" | ❌ | ✅ (iOS WidgetKit, Android AppWidget) |
| Apple/Google Wallet integration | ❌ | ✅ |

**Las ganancias reales de ir a nativa son**: (a) push iOS que funciona, (b) app store presence, (c) features hardware (cámara, contactos, widgets, background), (d) percepción de calidad (apps > web en deporte amateur según benchmarks).

### 7.3 ¿La marca está lista para soportar una app nativa?

La app nativa **requiere** más madurez de marca que una web:
- Icono pulido + splash screen (iOS rechaza lo mediocre).
- Screenshots para store (6-8 por plataforma).
- Descripción en ES/EN.
- Política de privacidad pública + términos ([BACKEND_AUDIT §13](BACKEND_AUDIT.md#13-backup-recuperación-y-gdpr) P0).
- Website de marca `furbito.app` (hoy es la propia app).
- Soporte: email, twitter, algo para responder en stores.

Publicar una nativa a medio-cocer **daña** la marca más que no tenerla. Google Play es más tolerante; iOS App Store puede rechazar por "minimum functionality" si la app parece thin.

### 7.4 ¿Hay bandwidth humano para mantener tres frentes?

Hoy: web + backend. Si añades nativa, son tres frentes. Sin shared-core, se multiplican bugs, inconsistencias, sprints perdidos resincronizando.

Con shared-core real (y el backend blindado según [BACKEND_AUDIT §14](BACKEND_AUDIT.md#14-seguridad--cross-cutting)), el incremento marginal de mantener nativa es **~30% adicional** sobre solo web, no 100%. Pero esos dos preparativos son condición sine qua non.

### 7.5 ¿La web actual está **suficientemente buena** para justificar split?

Si la web tiene fricciones grandes (las del [FEATURE_AUDIT.md](FEATURE_AUDIT.md) P0s), llevar eso mismo a nativa **duplica los problemas**. Mejor estabilizar web → shared-core → nativa. No hacer nativa sobre fundamentos movedizos.

---

## 8. Las dos vertientes: cuándo tiene sentido cada una

Reformulo tus dos vertientes con lo aprendido arriba:

### Vertiente A — "Marca FURBITO + app nativa"

**Qué es**:
- Website de marca (landing, pricing si aplica, blog, FAQ, privacy/terms) separado de la app.
- App nativa en App Store + Google Play como producto principal.
- Web app actual → queda como "FURBITO Lite" o se deprecia (decisión más adelante).

**Cuándo tiene sentido**:
- Hay margen para 2-3 meses sin añadir features (solo reescribir + branding).
- La web actual ya tiene los P0 críticos resueltos (sobre todo los de [BACKEND_AUDIT §14](BACKEND_AUDIT.md#14-seguridad--cross-cutting)).
- Hay buena historia de marca clara (personas del [MARKETING_PLAN.md](MARKETING_PLAN.md) bien comunicadas en landing).
- Target es "el organizador serio que busca app pro", no "el del WhatsApp que apenas quiere fricción".

**Cuándo NO tiene sentido**:
- Si la web tiene más de 3 P0s abiertos en [BACKEND_AUDIT.md](BACKEND_AUDIT.md) (ahora mismo: sí los tiene).
- Si no hay al menos 200-500 usuarios activos validando el producto — hacer nativa antes de validar es quemar 2-3 meses.

### Vertiente B — "Mejorar lo existente (solo si portable)"

**Qué es**:
- Cada feature nueva se diseña pensando "¿esto se portará bien?".
- Cada pieza que crezca en cliente se evalúa para moverla al shared-core o al backend.
- Cualquier mejora que solo beneficie web y no sea portable se **posterga** o se rediseña.

**Cuándo tiene sentido**:
- Si la validación del mercado todavía está en curso (primeros 6 meses).
- Si no hay bandwidth para los dos frentes.
- Si el coste de oportunidad de NO mejorar la web es alto (usuarios reales pidiendo features).

**Cuándo NO tiene sentido**:
- Si terminas bloqueando features útiles "porque no son portables". Ejemplo: un feature que solo aporta en PWA (instalación contextual, offline web) es útil ahora y se tira en nativa; no vale la pena bloquearlo.

### La regla que evita el dilema

> Todo feature que involucre **dominio** (cálculos, puntuación, balanceador, detección de badges, validación de votos) vive en el **shared-core** o en el **backend**. Todo lo que involucre **presentación** vive en la plataforma (web o nativa).

Con esa regla:
- Puedes mejorar la web sin "desperdiciar" trabajo — la lógica nueva se reusa en nativa.
- Puedes añadir UI exclusivamente web (ej. un dashboard desktop rico) sin culpa — no es "deuda portable", es una ventaja de la plataforma.
- Cuando tocas algo de dominio, lo tocas en un solo sitio.

Esto rompe la dicotomía de "construir marca nativa" vs "mejorar web". **Ambas conviven** si respetas la separación.

---

## 9. Recomendación de ruta

Con todos los inputs, **la recomendación** es una secuencia clara, no un either-or. Las fechas son orientativas; ajusta a tu bandwidth real.

### Fase 0 — Fundamentos (6-8 semanas, hoy → mediados junio 2026)

- [BACKEND_AUDIT §14](BACKEND_AUDIT.md#14-seguridad--cross-cutting) plan de 4 semanas (RLS fina + Edge Functions + avatars owner + rate-limit).
- [BACKEND_AUDIT §5 P0](BACKEND_AUDIT.md#5-edge-functions): `finalize-match` + `submit-vote` como Edge Functions que importan `shared/game/*`.
- Extraer `src/lib/game/*`, `src/types/*`, `src/lib/utils.ts` a **paquete `@furbito/core`** (ver §10).
- Resolver los **P0 UI más dolorosos** de [UI_AUDIT_PANTALLAS.md](UI_AUDIT_PANTALLAS.md) — pero SOLO los que aportan a producto; no polish.
- Publicar **política de privacidad + términos** (requisito previo a cualquier store).

Al final: web estabilizada, backend blindado, shared-core existente.

### Fase 1 — Refuerzo y validación (4-6 semanas, mediados junio → fin julio)

- [FEATURE_AUDIT Top 15 P0](FEATURE_AUDIT.md#20-top-15-mejoras-priorizadas) priorizados 1-5 (eventos recurrentes, reliability score, sesión valoración post-partido, badges faltantes, digest semanal).
- Setup de analytics (Plausible/Umami) + Sentry.
- Validar con 100-300 usuarios beta. Tracking de funnel real. Iteración rápida sobre web.

**Decisión de ir/no-ir a nativa al final de Fase 1**:
- Si adopción orgánica + retención > umbral (p.ej. WAU/MAU > 40%), ir. Si no, estabilizar más.
- Si stores (particularmente iOS) te impiden crecer por falta de push, ir aunque los números sean menores.

### Fase 2A — App nativa (8-12 semanas, ago → oct/nov)

Solo si Fase 1 valida. Pasos:

1. **Semana 1-2**: Setup Expo + copiar `shared/*` + tokens + Supabase adapter + session store + hooks.
2. **Semana 3-6**: reescritura UI pantalla por pantalla. Orden sugerido:
   - Login + gate (más simple).
   - Home + perfil (core visual).
   - Partidos + detalle.
   - Ranking + badges.
   - Admin.
3. **Semana 7-8**: push (Expo) + `send-push` multi-kind + deep links.
4. **Semana 9-10**: beta interna + TestFlight / Play Internal.
5. **Semana 11-12**: submission + ajustes store.

### Fase 2B — Paralelo: web sigue mejorando (continuo)

- Mejoras que **solo afectan UI web** → siguen (dashboard admin, desktop features).
- Mejoras de **dominio** → tocan shared-core → aprovechan las dos plataformas.

No es "stop-the-world" cuando arranque la nativa. Es doble frente con baja fricción.

---

## 10. Plan de "shared-core" accionable

Este es el trabajo concreto de infraestructura que habilita todo lo demás.

### 10.1 Estructura recomendada

Opción A — **monorepo con workspaces** (recomendado):

```
furbito/                      # monorepo
├── apps/
│   ├── web/                  # lo que hoy es este repo (Next.js)
│   └── native/               # nueva app Expo (cuando toque)
├── packages/
│   ├── core/                 # lógica de dominio (era src/lib/game + src/types)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── scoring.ts
│   │   │   ├── teams.ts
│   │   │   ├── badges.ts
│   │   │   ├── levels.ts
│   │   │   ├── mvp-finalize.ts
│   │   │   ├── badge-art.ts
│   │   │   └── utils.ts
│   │   └── tsconfig.json
│   └── design-tokens/        # colores, radios, sombras, tipografías
│       ├── package.json
│       └── src/index.ts
├── supabase/                 # el backend (sin cambios)
├── pnpm-workspace.yaml (o turbo.json)
└── package.json
```

Herramientas: **pnpm workspaces** o **Turborepo** (más completo). Turbo cachea builds y es gratis para OSS/small teams.

Opción B — **submódulo git**: menos elegante, sin cache, pero con menor fricción de migración. Para empezar sirve.

### 10.2 Migración desde el repo actual

Si eliges monorepo:

1. Crear `furbito/` raíz con `pnpm-workspace.yaml`.
2. Mover el repo actual a `furbito/apps/web`.
3. Crear `furbito/packages/core`:
   - Mover `apps/web/src/lib/game/*` → `packages/core/src/`.
   - Mover `apps/web/src/types/index.ts` → `packages/core/src/types.ts`.
   - Mover `apps/web/src/lib/utils.ts` → `packages/core/src/utils.ts`.
   - `package.json` con `"name": "@furbito/core"`, export field.
4. En `apps/web` reemplazar imports:
   - `import { … } from '@/lib/game/badges'` → `import { … } from '@furbito/core'`.
   - `import { Player, Event } from '@/types'` → `import { Player, Event } from '@furbito/core'`.
5. CI verifica que `apps/web` builda. Si sí, merge.
6. Cuando llegue la nativa: `pnpm create expo apps/native`, declarar dependencia `"@furbito/core": "workspace:*"`.

Estimación: **2-3 días** de trabajo + 1 día de estabilización. No es arriesgado si se hace con una rama aparte.

### 10.3 Edge Functions también importan core

Las Edge Functions en Deno pueden importar TS directamente. Para compartir con `@furbito/core`:

- Opción simple: **copiar** `packages/core/src/*.ts` al directorio `supabase/functions/_shared/core/` en cada build (script `cp -r`).
- Opción pro: publicar `@furbito/core` como paquete npm privado o vía `deno.land/x` self-hosted. Overkill al inicio.

Empezar por la copia. Si dos semanas después el copy-paste duele, subir a publicación.

### 10.4 Linting: prohibir dependencias prohibidas en core

`packages/core/.eslintrc.js`:

```js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        'next/*', 'react', 'react-dom',
        '@supabase/*', 'zustand/*',
        '*/client', '*/server',
      ],
      paths: ['react-native'],
    }],
    'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'fetch'],
  },
}
```

Blindaje automático del invariante. Cualquier PR que viole se rechaza en CI.

### 10.5 Estado de adopción (checklist)

- [ ] Monorepo `furbito/` con `apps/web`, `packages/core`, `packages/design-tokens`.
- [ ] `@furbito/core` publicado internamente, `apps/web` importa desde ahí.
- [ ] `packages/design-tokens` existe y `globals.css` se genera desde él (o se mantiene en paralelo).
- [ ] Edge Functions importan desde `core` (vía copia o vía publicación).
- [ ] Lint rules activas.
- [ ] CI corre tipos y lint en monorepo.

Todos estos ticks son pre-requisito razonable para considerar "listo para nativa".

---

## 11. Riesgos y trampas comunes

### 11.1 "Vamos a por la nativa ya" sin estabilizar web

Error típico. La nativa **amplifica** los problemas de la web (doble UI para arreglar, doble release cycle, doble crash report). Si la web no está sólida, hacer nativa se siente productivo pero es deuda disfrazada.

**Contramedida**: primero [BACKEND_AUDIT §14](BACKEND_AUDIT.md#14-seguridad--cross-cutting) + Top 5 P0s de [FEATURE_AUDIT](FEATURE_AUDIT.md).

### 11.2 "Compartimos lógica" → acaba siendo 30% compartido

Sin linting ni disciplina, el shared-core se contamina con imports de React, de Next, de Supabase. Se convierte en "otro cajón de sastre". Dejar de ser portable.

**Contramedida**: lint rule estricto. Code review: cualquier PR a `packages/core` que añada una dep o un import pasa por tres pares de ojos.

### 11.3 Duplicar tokens de diseño

Web define colores en `globals.css`, nativa los redefine en `StyleSheet`. Al cambiar un color, se actualizan 2 sitios… hasta que se olvida uno.

**Contramedida**: `packages/design-tokens` como fuente única. Web los consume vía un build step (o mano si son pocos); nativa los importa directo.

### 11.4 Realtime refetch-all en nativa

En la web ya es pesado (ver [BACKEND_AUDIT §6](BACKEND_AUDIT.md#6-realtime)). En nativa con red móvil variable es **doloroso**. Cuidar las quotas + considerar delta-apply antes de la nativa.

### 11.5 Ignorar que iOS Store puede rechazar

iOS revisa features. Si la app es "demasiado simple" o "parece una web envuelta" → rechazo. Mitigar:
- Usar features nativas reales (haptics en eventos importantes, biometric unlock, contact picker).
- Tener contenido suficiente (10+ pantallas reales, no 3).
- Imágenes de store cuidadas.

### 11.6 Promesa "offline-first" sin cumplirla

Muchas apps prometen offline y entregan "cache-last-fetch". Si FURBITO lo promete, cumplirlo (queue de escrituras en AsyncStorage + reconciliación). Si no, **no prometerlo**. Decepción > ausencia.

### 11.7 Intentar mantener la PWA y la nativa "iguales"

Inevitablemente divergen. Plataformas empujan distinto. Mejor aceptar que:
- Web se especializa en: SEO, link-sharing, landing de marketing, dashboard admin desktop.
- Nativa se especializa en: push, widgets, biometric, flow rápido día a día.

El 80% de features coinciden; el 20% es específico de plataforma. No es bug, es feature.

---

## Resumen ejecutivo (para consumo rápido)

- **Portable tal cual**: `src/lib/game/*`, `src/types/*`, utilidades (~1500 LoC). Shared-core obligatorio.
- **Adaptable**: Supabase client, session store, hooks de datos, avatars. Adapter layer.
- **Se reescribe**: toda UI, Tailwind, rutas Next, SW, Web Push. Inevitable en cambio web→nativa.
- **Backend**: 100% reutilizable. Mismo proyecto Supabase. Las Edge Functions son el puente que asegura consistencia web↔nativa.
- **Decisión**: no elegir entre A (marca+nativa) y B (mejorar web). **Ambas sobre shared-core** + regla "dominio en core, presentación en plataforma" = trabajo que no se pierde.
- **Ruta**: Fase 0 seguridad/shared-core (6-8 sem) → Fase 1 refuerzo web + validación (4-6 sem) → decisión ir/no-ir a nativa → Fase 2 paralelo.
- **Trampas a evitar**: nativa prematura, shared-core contaminado, tokens duplicados, realtime masivo, offline prometido sin entregar.
