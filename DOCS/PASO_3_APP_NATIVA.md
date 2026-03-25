# FURBITO v3 — Migración a App Nativa

> Documento de análisis completo para la migración de FURBITO desde web (Next.js) a aplicación móvil nativa.
> Fecha: Marzo 2026 | Versión actual: v2.0 (web PWA)

---

## Índice

1. [Análisis del Estado Actual](#1-análisis-del-estado-actual)
2. [Opciones de Tecnología para App Nativa](#2-opciones-de-tecnología-para-app-nativa)
3. [Plan de Migración Paso a Paso](#3-plan-de-migración-paso-a-paso)
4. [Funcionalidades Nuevas para App Nativa](#4-funcionalidades-nuevas-para-app-nativa)
5. [Requisitos Técnicos](#5-requisitos-técnicos)
6. [Presupuesto y Costes](#6-presupuesto-y-costes)
7. [Pros y Contras de Cada Enfoque](#7-pros-y-contras-de-cada-enfoque)
8. [Roadmap Recomendado](#8-roadmap-recomendado)
9. [Riesgos y Mitigación](#9-riesgos-y-mitigación)
10. [Conclusión y Recomendación Final](#10-conclusión-y-recomendación-final)

---

## 1. Análisis del Estado Actual

### 1.1 Stack Tecnológico Actual

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Framework | Next.js (App Router) | 14.2.x | SSR/SSG, desplegado en Vercel |
| Lenguaje | TypeScript | 5.4.x | Tipado estricto en todo el proyecto |
| Estilos | Tailwind CSS | 3.4.x | Utility-first + CSS custom properties |
| Base de datos | Supabase (PostgreSQL) | SDK 2.45.x | Realtime, RLS habilitado |
| Estado global | Zustand | 4.5.x | Estado persistente ligero |
| Mapas | Leaflet | 1.9.4 | Mapa de pistas/canchas |
| Deploy | Vercel | - | CI/CD automático desde GitHub |
| PWA | manifest.json + SW | - | Instalable, modo standalone, orientación portrait |

### 1.2 Inventario Completo de Funcionalidades

#### Gestión de Comunidades
- Crear comunidad con nombre, color personalizado y PIN de acceso
- Sistema de roles: guest / player / admin
- Hasta 3 admins por comunidad (`admin_ids[]`)
- Acceso mediante PIN de comunidad + código de jugador (4 caracteres)

#### Gestión de Jugadores
- Registro de jugadores con nombre, código, posición y avatar (emoji)
- Posiciones: portero, defensa, centrocampista, delantero
- Perfil individual con stats acumuladas
- Vitrina de badges (máximo 3 badges seleccionados para mostrar)

#### Sistema de Eventos/Partidos
- Crear eventos: partido, entrenamiento u otro
- Vincular a pista (cancha) o lugar libre
- Control de máximo de jugadores
- Sistema de confirmación de asistencia (sí / no / quizá)
- Eventos abiertos (visibles para otras comunidades)
- Registro post-partido: resultado, equipos, MVP, stats individuales

#### Estadísticas por Partido (MatchPlayer)
- Goles y asistencias individuales
- Portería a cero
- Hazañas especiales: parada de penalti, chilena, olímpico, tacón
- XP ganado por partido
- Asignación a equipo A o B

#### Generador de Equipos
- 4 modos: balanced (equilibrado), random, snake draft, capitanes
- Algoritmo de scoring basado en valoraciones + stats
- Indicador de balance entre equipos (diferencia porcentual)

#### Sistema de Valoraciones (Votes)
- 5 categorías: ataque, defensa, técnica, velocidad, empeño
- Escala 1-5 por categoría
- Un voto por par jugador-votante
- Media calculada para scoring de equipos

#### Sistema de Gamificación — Niveles
- 99 niveles con curva XP cuadrática: `floor(N * N * 0.77)`
- 10 rangos: Rookie, Amateur, Semi-Pro, Profesional, Crack, Estrella, Crack Mundial, Leyenda, Leyenda Suprema, GOAT
- Barra de progreso XP con porcentaje

#### Sistema de Gamificación — Badges (Insignias)
- **+130 badges** organizados en categorías:
  - Goles (por partido y acumulados): primer gol, doblete, hat trick, póker, manita, doble dígito, goleador 10/25/50/100/200/300/500
  - Asistencias: primera asistencia, doble/triple pase, asistidor 10/25/50/100/200
  - Hazañas: chilena, olímpico, tacón, portería a cero, parada de penalti
  - Partidos jugados: debut, 5, 10, 25, 50, 75, 100, 200, 500, 1000
  - MVP: primer MVP, MVP x3/5/10/20/50/100, combos con goles/asistencias
  - XP y nivel: hitos de XP (100, 250, 500, 750...20000), niveles alcanzados
  - Combos: diamante, perfecto, doble doble, triple doble, partido perfecto
  - Rachas: 2, 3, 5, 7, 10, 15, 20 victorias seguidas
  - Social: votos dados, votos recibidos, ratings altos
  - Pistas: explorador, nómada, trotamundos, local, señor del campo
  - Temporales: madrugador, nocturno, weekender, lunes guerrero, navidad, nochevieja
  - Portero: guardameta, muro, héroe, invicto
  - Resultados: goleada, remontada, empate 0-0, thriller, partido épico

#### Mapas de Pistas
- Mapa interactivo con Leaflet
- Registro de canchas con nombre, dirección, coordenadas (lat/lng)
- Vinculación de eventos a pistas

#### Rankings
- Múltiples categorías de ranking
- Sistema ELO, goles, asistencias, MVPs

#### Navegación
- Bottom navigation con 5 tabs: home, partidos, jugadores, ranking, perfil
- Rutas dinámicas por comunidad: `/[cid]/...`

### 1.3 Modelo de Datos (6 tablas)

```
communities ─┬─ players ──── match_players
             ├─ pistas       confirmations
             ├─ events ──┬── match_players
             │           └── confirmations
             └─ votes
```

| Tabla | Registros estimados (beta) | Crecimiento |
|-------|---------------------------|-------------|
| communities | 5-20 | Lento |
| players | 50-200 | Moderado |
| events | 100-500 | Rápido (semanal) |
| confirmations | 500-2500 | Rápido |
| match_players | 500-2500 | Rápido |
| votes | 200-1000 | Moderado |

### 1.4 Limitaciones Actuales de la Versión Web/PWA

| Limitación | Impacto | Detalle |
|-----------|---------|---------|
| **Sin push notifications reales** | ALTO | Las PWA tienen soporte limitado en iOS para push. No podemos avisar de partidos nuevos, recordatorios ni resultados |
| **Sin acceso a cámara nativa** | MEDIO | No se pueden subir fotos de perfil ni de partidos fácilmente |
| **Sin GPS en background** | MEDIO | No podemos detectar automáticamente cuando un jugador está cerca de una pista |
| **Sin modo offline robusto** | MEDIO | El Service Worker cachea assets pero no datos. Sin conexión no se puede ver nada útil |
| **Sin biometría** | BAJO | El acceso es por PIN + código. No hay FaceID ni huella |
| **Sin deep links fiables** | MEDIO | Los enlaces compartidos abren el navegador, no la app directamente |
| **Rendimiento de animaciones** | BAJO | Las animaciones CSS son limitadas vs animaciones nativas (60fps consistentes) |
| **Sin widgets** | BAJO | No hay widget de próximo partido en la pantalla de inicio |
| **Discoverability nula** | ALTO | No estamos en App Store ni Google Play. Los usuarios no nos encuentran buscando "fútbol" |
| **Instalación PWA confusa** | ALTO | Muchos usuarios no saben instalar una PWA. El flujo "Añadir a pantalla de inicio" es poco intuitivo |
| **Sin haptic feedback** | BAJO | No hay retroalimentación táctil en acciones clave |
| **Mapas limitados** | MEDIO | Leaflet funciona pero no tiene Street View, ni la fluidez de Google Maps nativo |

### 1.5 Datos de la Fase Beta

Durante la fase beta con la versión web, se espera recopilar:

- **Métricas de uso**: pantallas más visitadas, tiempo en sesión, frecuencia de uso
- **Flujos más usados**: crear partido > confirmar asistencia > registrar resultado
- **Puntos de abandono**: dónde los usuarios dejan de usar la app
- **Feedback cualitativo**: qué funcionalidades piden los usuarios
- **Dispositivos**: % Android vs iOS, resoluciones de pantalla
- **Retención**: cuántos usuarios vuelven después de 1 semana, 1 mes
- **Comunidades activas**: cuántas comunidades tienen actividad regular

Estos datos son fundamentales para priorizar las funcionalidades de la app nativa.

---

## 2. Opciones de Tecnología para App Nativa

### 2.1 React Native con Expo

**Qué es**: Framework de Meta para crear apps nativas con React y JavaScript/TypeScript. Expo es una capa que simplifica enormemente el desarrollo, build y despliegue.

| Aspecto | Detalle |
|---------|---------|
| **Lenguaje** | TypeScript/JavaScript (mismo que FURBITO actual) |
| **Plataformas** | iOS + Android desde un solo código |
| **UI** | Componentes nativos reales (no WebView) |
| **Rendimiento** | Cercano a nativo (~95%), excelente para apps de datos |
| **Ecosistema** | Enorme: 300k+ paquetes en npm compatibles |
| **Curva de aprendizaje** | BAJA para devs de React/Next.js |

**Pros:**
- La transición desde React/Next.js es la más natural posible
- Se reutiliza todo el conocimiento de React, hooks, estado, TypeScript
- La lógica de negocio (badges, levels, scoring, teams) se puede copiar directamente
- Expo maneja builds, certificados, OTA updates sin necesidad de Xcode/Android Studio
- EAS Build compila en la nube (no necesitas Mac para builds de iOS)
- Supabase tiene SDK oficial para React Native
- Hot reload para desarrollo rápido
- Claude Code puede generar código React Native con la misma fluidez que React web
- Comunidad gigante: cualquier problema ya tiene solución en Stack Overflow

**Contras:**
- La UI necesita reescribirse (no se puede copiar HTML/Tailwind directamente)
- Algunos paquetes nativos complejos pueden requerir "eject" de Expo
- El rendimiento en animaciones muy complejas puede ser inferior a nativo puro
- El tamaño del bundle es mayor que una app nativa pura (~15-25MB vs ~5-10MB)
- Dependencia del ecosistema Expo/Meta para actualizaciones

**Coste estimado:**
- Herramientas: GRATIS (Expo es open source)
- EAS Build (gratis con límites, $99/mes para builds ilimitados)
- Tiempo de desarrollo: 3-4 meses para MVP

**Reutilización del código actual:**
- **100% reutilizable**: Tipos TypeScript (`types/index.ts`), lógica de badges, levels, scoring, teams
- **~70% adaptable**: Hooks de datos (usePlayers, useEvents, etc.) — misma lógica, distinto import de Supabase
- **0% reutilizable**: Componentes UI (se reescriben con React Native components)
- **~80% reutilizable**: Estado Zustand (mismo código, distinto storage adapter)

---

### 2.2 Flutter (Google)

**Qué es**: Framework de Google para apps multiplataforma con el lenguaje Dart. Renderiza su propia UI (no usa componentes nativos del SO).

| Aspecto | Detalle |
|---------|---------|
| **Lenguaje** | Dart (nuevo lenguaje a aprender) |
| **Plataformas** | iOS + Android + Web + Desktop |
| **UI** | Motor de renderizado propio (Skia/Impeller) |
| **Rendimiento** | Excelente, 60/120fps consistentes |
| **Ecosistema** | Grande y creciendo: pub.dev |
| **Curva de aprendizaje** | MEDIA-ALTA (Dart es nuevo, paradigma diferente) |

**Pros:**
- Rendimiento excelente en animaciones y transiciones
- UI consistente en todas las plataformas (pixel-perfect)
- Hot reload muy rápido
- Soporte oficial de Google con actualizaciones frecuentes
- Buena integración con Firebase (similar a Supabase en concepto)
- Una sola codebase para móvil, web y desktop

**Contras:**
- **Hay que aprender Dart desde cero** — es un lenguaje diferente a TypeScript
- **No se reutiliza NADA del código actual** — todo se reescribe
- Claude Code genera Dart pero con menos fluidez que TypeScript/React
- El ecosistema de paquetes es menor que npm
- Los componentes no tienen look & feel nativo por defecto (Material/Cupertino)
- Supabase tiene SDK para Flutter pero menos maduro que el de JS
- Comunidad más pequeña que React Native

**Coste estimado:**
- Herramientas: GRATIS
- Tiempo de desarrollo: 5-7 meses para MVP (incluye aprender Dart)

**Reutilización del código actual:**
- **0% reutilizable**: Todo se reescribe en Dart
- Solo se reutiliza la estructura de datos y la lógica conceptual

---

### 2.3 Capacitor / Ionic

**Qué es**: Capacitor envuelve tu app web existente en un contenedor nativo (WebView), dándole acceso a APIs nativas. Ionic es un framework UI opcional encima.

| Aspecto | Detalle |
|---------|---------|
| **Lenguaje** | El mismo que tengas (TypeScript/React) |
| **Plataformas** | iOS + Android |
| **UI** | WebView (tu app web actual) + plugins nativos |
| **Rendimiento** | Inferior a nativo (~70-80%), depende de la complejidad |
| **Ecosistema** | Plugins de Capacitor + todo npm |
| **Curva de aprendizaje** | MUY BAJA (es tu app web actual) |

**Pros:**
- **Se reutiliza el 90-95% del código actual** — es literalmente tu app web en un contenedor
- Tiempo de desarrollo mínimo: semanas, no meses
- Acceso a APIs nativas via plugins (cámara, GPS, push, biometría)
- No hay que aprender nada nuevo
- Misma base de código para web y móvil

**Contras:**
- **No es una app nativa real** — los usuarios notan la diferencia (scroll, animaciones, transiciones)
- Rendimiento inferior, especialmente en listas largas y animaciones
- La UI no se siente "nativa" (no sigue las guidelines de iOS/Android)
- Apple puede rechazar apps que son "solo una WebView" sin valor añadido nativo
- Limitaciones en funcionalidades nativas complejas
- Debugging más complejo (web + nativo)
- El tamaño de la app es mayor (incluye motor web completo)

**Coste estimado:**
- Herramientas: GRATIS
- Tiempo de desarrollo: 2-4 semanas para empaquetado básico, 2-3 meses para integración nativa completa

**Reutilización del código actual:**
- **90-95% reutilizable**: Toda la app web se mantiene
- Plugins de Capacitor para funcionalidades nativas
- Ajustes menores de CSS para look & feel móvil

---

### 2.4 Swift (iOS) + Kotlin (Android) — Nativo Puro

**Qué es**: Desarrollo nativo separado para cada plataforma. Swift/SwiftUI para iOS, Kotlin/Jetpack Compose para Android.

| Aspecto | Detalle |
|---------|---------|
| **Lenguaje** | Swift + Kotlin (2 lenguajes diferentes) |
| **Plataformas** | Cada una por separado |
| **UI** | 100% nativa, componentes del sistema |
| **Rendimiento** | Máximo posible |
| **Ecosistema** | Completo acceso a todas las APIs de cada plataforma |
| **Curva de aprendizaje** | MUY ALTA (2 lenguajes, 2 IDEs, 2 ecosistemas) |

**Pros:**
- Máximo rendimiento y fluidez
- Acceso completo a todas las APIs nativas sin restricciones
- UI 100% nativa (sigue las guidelines de cada plataforma)
- Mejor integración con el SO (widgets, extensiones, Siri, etc.)
- Menos probabilidad de rechazo en App Store

**Contras:**
- **Hay que mantener 2 codebases completamente separadas**
- Doble el tiempo de desarrollo
- Hay que aprender 2 lenguajes nuevos (Swift Y Kotlin)
- 0% de reutilización del código actual
- Para iOS necesitas un Mac obligatoriamente (Xcode solo corre en macOS)
- Claude Code puede ayudar con Swift/Kotlin pero el contexto es menor que con React
- Coste de mantenimiento doble: cada bug se arregla dos veces

**Coste estimado:**
- Herramientas: Mac (si no tienes) ~1000-1500 EUR
- Tiempo de desarrollo: 8-12 meses para MVP (ambas plataformas)

**Reutilización del código actual:**
- **0% reutilizable**: Todo se reescribe desde cero, dos veces

---

### 2.5 Kotlin Multiplatform (KMP)

**Qué es**: Tecnología de JetBrains que permite compartir lógica de negocio en Kotlin entre iOS y Android, con UI nativa separada.

| Aspecto | Detalle |
|---------|---------|
| **Lenguaje** | Kotlin (compartido) + SwiftUI (iOS UI) + Compose (Android UI) |
| **Plataformas** | iOS + Android con lógica compartida |
| **UI** | Nativa en cada plataforma (o Compose Multiplatform) |
| **Rendimiento** | Nativo |
| **Ecosistema** | En crecimiento, respaldado por JetBrains y Google |
| **Curva de aprendizaje** | ALTA (Kotlin + conceptos multiplataforma) |

**Pros:**
- Lógica de negocio compartida (badges, levels, scoring se escriben una vez)
- UI nativa en cada plataforma
- Rendimiento nativo
- Google lo está adoptando oficialmente para Android + iOS

**Contras:**
- Tecnología relativamente nueva, ecosistema en maduración
- Necesitas aprender Kotlin (y algo de Swift para UI de iOS)
- Documentación y recursos menos abundantes
- Menos soporte de Claude Code comparado con React
- Necesitas Mac para iOS
- Comunidad más pequeña

**Coste estimado:**
- Herramientas: Mac (si no tienes) + IDEs gratuitos
- Tiempo de desarrollo: 6-9 meses para MVP

**Reutilización del código actual:**
- **0% reutilizable directamente**, pero la lógica se traduce una vez a Kotlin y sirve para ambas plataformas

---

### 2.6 Tabla Comparativa Resumen

| Criterio | React Native (Expo) | Flutter | Capacitor | Nativo Puro | KMP |
|----------|:-------------------:|:-------:|:---------:|:-----------:|:---:|
| Reutilización de código FURBITO | **70%** | 0% | **95%** | 0% | 0% |
| Curva de aprendizaje | **Baja** | Media-Alta | **Muy Baja** | Muy Alta | Alta |
| Rendimiento | Alto | **Muy Alto** | Medio | **Máximo** | Alto |
| Tiempo hasta MVP | **3-4 meses** | 5-7 meses | **2-4 semanas** | 8-12 meses | 6-9 meses |
| Calidad UX nativa | Alta | Alta | **Baja** | **Máxima** | Alta |
| Soporte de Claude Code | **Excelente** | Bueno | **Excelente** | Medio | Medio |
| Coste total estimado | **Bajo** | Medio | **Muy Bajo** | Alto | Medio-Alto |
| Probabilidad App Store OK | Alta | Alta | **Baja-Media** | **Máxima** | Alta |
| Mantenimiento a largo plazo | **Bajo** (1 codebase) | **Bajo** (1 codebase) | **Muy Bajo** | Alto (2 codebases) | Medio |
| Push notifications | Nativo | Nativo | Plugin | Nativo | Nativo |
| Acceso APIs nativas | Alto | Alto | Medio | **Completo** | Alto |

### 2.7 RECOMENDACION: React Native con Expo

**Para el caso específico de FURBITO, la recomendación clara es React Native con Expo.** Las razones:

1. **Máxima transferencia de conocimiento**: Ya sabes React, TypeScript, hooks, Zustand. El salto a React Native es mínimo.
2. **Reutilización real**: Toda la lógica de juego (badges.ts, levels.ts, scoring.ts, teams.ts, types/index.ts) se copia directamente.
3. **Claude Code funciona perfecto**: La asistencia de IA para React Native es tan buena como para React web.
4. **Expo simplifica todo**: No necesitas Xcode ni Android Studio para builds. EAS Build compila en la nube.
5. **Un solo desarrollador puede manejarlo**: Una codebase, dos plataformas.
6. **Supabase SDK oficial**: `@supabase/supabase-js` funciona idéntico en React Native.
7. **Comunidad y documentación**: Cualquier problema que encuentres ya tiene solución online.
8. **Coste-beneficio óptimo**: El mejor equilibrio entre calidad, tiempo y coste para un desarrollador novato con IA.

> **Nota sobre Capacitor**: Aunque Capacitor es la opción más rápida, el riesgo de rechazo en App Store y la experiencia de usuario inferior lo descartan como opción principal. Sin embargo, puede servir como **paso intermedio** para tener presencia en stores mientras se desarrolla la versión React Native.

---

## 3. Plan de Migración Paso a Paso

### Fase 1: Setup y Navegación Core (Semanas 1-3)

**Objetivo**: Tener la estructura base de la app con navegación funcional.

| Tarea | Tiempo estimado | Detalle |
|-------|----------------|---------|
| Instalar Expo y crear proyecto | 1 día | `npx create-expo-app furbito-native -t tabs` |
| Configurar TypeScript estricto | 0.5 días | Copiar tsconfig base, ajustar paths |
| Copiar tipos (`types/index.ts`) | 0.5 días | Copia directa, sin cambios |
| Copiar lógica de juego | 1 día | `badges.ts`, `levels.ts`, `scoring.ts`, `teams.ts` — copia directa |
| Configurar navegación (expo-router) | 2 días | Tab navigator con 5 tabs: Home, Partidos, Jugadores, Ranking, Perfil |
| Pantalla de login (comunidad + PIN) | 2 días | Input de código comunidad + PIN |
| Sistema de tema/colores | 1 día | Variables de color dinámicas por comunidad |
| Componentes UI base | 3 días | Button, Card, Input, Modal (equivalentes nativos de los web) |
| Setup de Zustand | 0.5 días | Mismo store, con AsyncStorage en vez de localStorage |
| **Total Fase 1** | **~2.5 semanas** | |

**Lo que se reutiliza del código actual:**
- `src/types/index.ts` — 100% igual
- `src/lib/game/*` — 100% igual (lógica pura sin dependencias de DOM)
- `src/lib/utils.ts` — parcialmente (funciones de formato)
- Estructura de Zustand store — 90% igual

**Lo que se reescribe:**
- Todos los componentes UI (de HTML/Tailwind a React Native components)
- Navegación (de Next.js App Router a expo-router)
- Estilos (de Tailwind a StyleSheet.create o NativeWind)

---

### Fase 2: Integración con Supabase (Semanas 4-5)

**Objetivo**: Conectar la app al mismo backend de Supabase que usa la web.

| Tarea | Tiempo estimado | Detalle |
|-------|----------------|---------|
| Instalar `@supabase/supabase-js` | 0.5 días | Mismo paquete que en web |
| Configurar cliente Supabase | 1 día | AsyncStorage adapter para tokens |
| Migrar hooks de datos | 3 días | `usePlayers`, `useEvents`, `usePistas`, `useVotes`, `useCommunity` |
| Configurar Realtime | 1 día | Suscripciones a cambios en events, confirmations |
| Probar CRUD completo | 2 días | Crear, leer, actualizar, borrar en todas las tablas |
| **Total Fase 2** | **~1.5 semanas** | |

**Importante**: La app nativa se conecta a la MISMA base de datos de Supabase. No hay migración de datos. Los usuarios de web y app ven los mismos datos.

```
┌──────────────┐     ┌──────────────┐
│  Web (Next.js)│────>│              │
│  furbito.app  │     │   Supabase   │
└──────────────┘     │  PostgreSQL  │
                      │  + Realtime  │
┌──────────────┐     │  + Storage   │
│  App Nativa   │────>│  + Auth      │
│  React Native │     │              │
└──────────────┘     └──────────────┘
```

---

### Fase 3: Migración de Features (Semanas 6-10)

**Priorización por impacto y complejidad:**

#### Prioridad ALTA (Semanas 6-7)
| Feature | Tiempo | Complejidad | Notas |
|---------|--------|-------------|-------|
| Lista de jugadores | 2 días | Baja | FlatList nativa, avatar + stats |
| Perfil de jugador | 2 días | Media | Stats, badges, vitrina, nivel |
| Lista de eventos/partidos | 2 días | Baja | FlatList con EventCard |
| Detalle de evento | 2 días | Media | Info + confirmaciones + resultado |
| Confirmar asistencia | 1 día | Baja | Botones sí/no/quizá |
| Sistema de badges visual | 1 día | Baja | Grid de badges con iconos |

#### Prioridad MEDIA (Semanas 8-9)
| Feature | Tiempo | Complejidad | Notas |
|---------|--------|-------------|-------|
| Crear evento nuevo | 2 días | Media | Formulario con date/time pickers nativos |
| Registrar resultado post-partido | 3 días | Alta | Stats individuales, MVP, equipos |
| Generador de equipos | 2 días | Media | Lógica existente + UI de drag/tap |
| Rankings | 1 día | Baja | Tabla con tabs y ordenación |
| Valoraciones (votar jugador) | 2 días | Media | Sliders nativos 1-5 por categoría |

#### Prioridad BAJA (Semana 10)
| Feature | Tiempo | Complejidad | Notas |
|---------|--------|-------------|-------|
| Mapa de pistas | 3 días | Alta | react-native-maps (Google Maps nativo) |
| Añadir pista nueva | 1 día | Media | Formulario + selector de ubicación |
| Ajustes/configuración | 1 día | Baja | Cambiar comunidad, cerrar sesión |

---

### Fase 4: Features Nativas Exclusivas (Semanas 11-14)

| Feature | Tiempo | Detalle |
|---------|--------|---------|
| Push notifications | 3 días | Expo Notifications + Supabase Edge Functions |
| Cámara para avatar | 1 día | expo-camera + Supabase Storage |
| Biometría (FaceID/Fingerprint) | 1 día | expo-local-authentication |
| Deep links | 1 día | Expo Linking para invitaciones |
| Haptic feedback | 0.5 días | expo-haptics en acciones clave |
| Modo offline básico | 3 días | Cache local con sincronización |
| Animaciones Lottie | 2 días | Animaciones para badge unlocks |
| Share nativo | 1 día | Compartir evento/resultado via WhatsApp, etc. |

---

### Fase 5: Testing y Beta (Semanas 15-17)

| Tarea | Tiempo | Detalle |
|-------|--------|---------|
| Testing en dispositivos reales | 1 semana | Probar en Android + iOS, diferentes tamaños |
| Beta interna (TestFlight + Google Play Beta) | 1 semana | Distribuir a 10-20 usuarios de comunidades existentes |
| Corrección de bugs de beta | 1 semana | Iterar según feedback |
| Performance profiling | 2 días | Optimizar listas largas, animaciones, carga |
| Accessibility check | 1 día | Tamaños de texto, contraste, screen readers |

---

### Fase 6: Publicación en Stores (Semanas 18-19)

| Tarea | Tiempo | Detalle |
|-------|--------|---------|
| Preparar assets para stores | 2 días | Screenshots, feature graphic, icono, descripciones |
| Configurar App Store Connect | 1 día | Metadata, categoría, edad, privacidad |
| Configurar Google Play Console | 1 día | Listing, clasificación, políticas |
| Build de producción (EAS Build) | 0.5 días | Build firmado para ambas plataformas |
| Submit a App Store | 1 día | Subir + rellenar formulario de revisión |
| Submit a Google Play | 0.5 días | Subir + configurar lanzamiento |
| Esperar aprobación | 1-7 días | Apple: 1-3 días típico. Google: horas a 1 día |
| Fix si hay rechazo + re-submit | 0-5 días | Depende del motivo de rechazo |

---

### Resumen de Timeline

```
Semana  1-3:   [████████████] Fase 1 — Setup + Navegación
Semana  4-5:   [████████]     Fase 2 — Supabase
Semana  6-10:  [████████████████████] Fase 3 — Features
Semana  11-14: [████████████████] Fase 4 — Nativo exclusivo
Semana  15-17: [████████████] Fase 5 — Testing + Beta
Semana  18-19: [████████]     Fase 6 — Publicación
─────────────────────────────────────────────────
TOTAL:         ~19 semanas (4.5 meses) para un developer con IA
```

> **Nota**: Estos tiempos asumen trabajo a tiempo parcial (15-20h/semana) con asistencia de Claude Code. A tiempo completo se podrían reducir un 40%.

---

## 4. Funcionalidades Nuevas para App Nativa

### 4.1 Push Notifications

Las notificaciones push son la funcionalidad nativa más importante. Transforman la app de pasiva a activa.

| Tipo de notificación | Trigger | Prioridad |
|---------------------|---------|-----------|
| Partido nuevo creado | Admin crea evento | ALTA |
| Recordatorio pre-partido (2h antes) | Hora del evento - 2h | ALTA |
| Resultado disponible | Admin registra resultado | ALTA |
| Votación MVP abierta | Post-partido | MEDIA |
| Badge desbloqueado | Detección de badge | MEDIA |
| Subida de nivel | XP alcanza nuevo nivel | MEDIA |
| Alguien te valoró | Voto nuevo recibido | BAJA |
| Resumen semanal | Domingo por la noche | BAJA |
| Racha en peligro | 7 días sin jugar | BAJA |

**Implementación técnica:**
- **Expo Notifications** para el cliente (solicitar permisos, mostrar)
- **Supabase Edge Functions** o **Database Webhooks** para disparar desde el backend
- **Expo Push Token** se almacena en la tabla `players` (nuevo campo `push_token`)
- Servicio: Expo Push Service (gratuito, ilimitado)

---

### 4.2 Cámara Nativa

| Funcionalidad | Uso | Librería |
|---------------|-----|----------|
| Foto de perfil | Subir avatar real en vez de emoji | `expo-camera` + `expo-image-picker` |
| Foto de partido | Documentar el partido, compartir | `expo-camera` |
| Foto de pista | Añadir foto al registrar cancha | `expo-image-picker` |

**Almacenamiento**: Supabase Storage (bucket público para avatares, privado para fotos de partido).

---

### 4.3 GPS y Geolocalización

| Funcionalidad | Detalle |
|---------------|---------|
| Detectar pistas cercanas | Mostrar canchas en un radio de X km |
| Auto-check-in | Detectar que estás en una pista y sugerir confirmar asistencia |
| Distancia a pista | Mostrar "a 2.3 km" en la lista de pistas |
| GPS en background | Notificación cuando pasas cerca de una pista (con permiso explícito) |

**Librería**: `expo-location` (foreground y background).

**Consideración de privacidad**: El GPS en background requiere justificación explícita para Apple. Solo activar si el usuario lo habilita manualmente.

---

### 4.4 Modo Offline con Sincronización

| Dato | Estrategia offline |
|------|-------------------|
| Lista de jugadores | Cache local en SQLite, sync al conectar |
| Próximos partidos | Cache local, mostrar último estado conocido |
| Confirmación de asistencia | Cola de acciones offline, sync automático |
| Stats del jugador | Cache local |
| Mapa de pistas | Tiles cacheados + datos de pistas en SQLite |

**Implementación:**
- `expo-sqlite` para cache local estructurado
- Cola de operaciones pendientes (optimistic updates)
- Indicador visual "Sin conexión" + "Sincronizando..."
- Sincronización automática al recuperar conexión

---

### 4.5 Autenticación Biométrica

| Método | Plataforma | Librería |
|--------|-----------|----------|
| Face ID | iOS | `expo-local-authentication` |
| Touch ID / Fingerprint | iOS + Android | `expo-local-authentication` |
| PIN como fallback | Ambas | Implementación propia |

**Flujo propuesto:**
1. Primera vez: login con PIN de comunidad + código de jugador (como ahora)
2. Ofrecer "Activar Face ID / Huella"
3. Próximas veces: biometría directa, PIN como fallback

---

### 4.6 Compartir Nativo y Deep Links

| Funcionalidad | Detalle |
|---------------|---------|
| Invitar a comunidad | Deep link: `furbito://join/{cid}?pin=XXXX` |
| Compartir resultado | Imagen generada con resultado + stats |
| Compartir perfil | Tarjeta de jugador con stats y badges |
| Universal Links | `https://furbito.app/invite/{cid}` abre la app si está instalada |

**Librería**: `expo-sharing` + `expo-linking`.

---

### 4.7 Haptic Feedback

Feedback táctil sutil en acciones clave:

| Acción | Tipo de vibración |
|--------|------------------|
| Confirmar asistencia | Éxito (notificationSuccess) |
| Desbloquear badge | Impacto fuerte (impactHeavy) |
| Subir de nivel | Impacto fuerte + vibración |
| Votar MVP | Éxito |
| Marcar gol en stats | Impacto ligero |
| Error / acción inválida | Error (notificationError) |
| Pull to refresh | Impacto ligero |

**Librería**: `expo-haptics` (3 líneas de código por acción).

---

### 4.8 Widget de Próximo Partido

**iOS (WidgetKit):**
- Widget pequeño: próximo partido (fecha, hora, lugar)
- Widget mediano: próximo partido + quién ha confirmado
- Actualización cada 15 minutos

**Android (App Widget):**
- Equivalente con Glance (Jetpack)
- Mismo contenido que iOS

**Nota**: Los widgets requieren código nativo específico para cada plataforma. En Expo, se implementan con `expo-widget` (en desarrollo) o módulos nativos custom. Es una feature para v3.1+, no para el MVP.

---

### 4.9 Apple Watch / WearOS Companion

Feature avanzada para versiones futuras (v3.2+):

| Funcionalidad | Detalle |
|---------------|---------|
| Próximo partido | Ver fecha, hora, lugar |
| Confirmación rápida | "Voy" / "No voy" desde el reloj |
| Notificaciones | Alertas de partido en la muñeca |
| Stats rápidas | Nivel, goles totales, partidos |

**Complejidad**: ALTA. Requiere desarrollo nativo separado (WatchKit para Apple Watch, Wear Compose para WearOS). Recomendado solo si la app tiene tracción significativa.

---

### 4.10 Chat In-App y Notas de Voz

| Feature | Detalle | Prioridad |
|---------|---------|-----------|
| Chat por evento | Mensajes en el detalle del partido | MEDIA |
| Chat de comunidad | Chat general de la comunidad | BAJA |
| Notas de voz | Grabar y enviar audio en el chat | BAJA |
| Reacciones | Emojis rápidos en mensajes | BAJA |

**Implementación**: Supabase Realtime para mensajes. Supabase Storage para audios. Nueva tabla `messages`.

---

### 4.11 Social Features

| Feature | Detalle |
|---------|---------|
| Activity Feed | "Juan marcó 3 goles", "María desbloqueó Hat Trick" |
| Stories | Fotos del partido que desaparecen en 24h |
| Reacciones a actividad | Like/celebrar logros de compañeros |
| Perfil público | Compartir perfil fuera de la comunidad |

---

### 4.12 Google Maps Nativo con Street View

| Mejora sobre Leaflet | Detalle |
|----------------------|---------|
| Rendimiento nativo | 60fps, gestos fluidos |
| Street View | Ver la pista desde la calle |
| Directions API | "Cómo llegar" a la pista |
| Custom markers | Marcadores con el color de la comunidad |
| Satellite view | Vista satélite de la cancha |
| Place Autocomplete | Buscar direcciones al añadir pista |

**Librería**: `react-native-maps` (wrapper de Google Maps SDK nativo).

---

### 4.13 Animaciones Nativas (Lottie)

| Momento | Animación |
|---------|-----------|
| Badge desbloqueado | Explosión de confeti + badge apareciendo |
| Subida de nivel | Barra de XP llenándose + nuevo rango |
| MVP seleccionado | Corona cayendo sobre el avatar |
| Racha de victorias | Llamas creciendo |
| Hat trick | 3 balones rebotando |
| Portería a cero | Candado cerrándose |

**Librería**: `lottie-react-native`. Las animaciones se crean en After Effects y se exportan como JSON.

---

### 4.14 App Clips (iOS) / Instant Apps (Android)

| Concepto | Detalle |
|----------|---------|
| App Clip (iOS) | Mini-app de <15MB que se abre sin instalar. Perfecto para: escanear QR en la pista y unirse al partido |
| Instant App (Android) | Equivalente de Google. Se abre desde un link sin instalar |
| Caso de uso | Un jugador nuevo escanea un QR, ve el partido, confirma asistencia. Luego se le sugiere instalar la app completa |

**Complejidad**: MEDIA-ALTA. Requiere una versión reducida de la app. Recomendado para v3.2+.

---

## 5. Requisitos Técnicos

### 5.1 Entorno de Desarrollo

| Requisito | Necesario para | Alternativa |
|-----------|---------------|-------------|
| **Node.js 18+** | Expo CLI, desarrollo | Ya lo tienes |
| **Expo CLI** | Crear y gestionar el proyecto | `npm install -g expo-cli` |
| **Android Studio** | Emulador Android + builds locales | EAS Build (en la nube) |
| **Xcode 15+** | Emulador iOS + builds locales | EAS Build (en la nube) |
| **Mac con macOS** | Compilar para iOS localmente | **EAS Build elimina este requisito** |
| **Dispositivo físico** | Testing real | Expo Go app (testing sin build) |
| **VS Code** | Editor de código | Ya lo tienes |

> **IMPORTANTE**: Con Expo EAS Build, **no necesitas un Mac** para generar builds de iOS. EAS compila en servidores Mac en la nube. Solo necesitas Mac si quieres compilar localmente o usar el simulador de iOS.

### 5.2 Cuentas de Developer

| Cuenta | Coste | Duración | Para qué |
|--------|-------|----------|----------|
| **Apple Developer Program** | 99 USD/año (~92 EUR) | Anual (renovar) | Publicar en App Store, TestFlight |
| **Google Play Console** | 25 USD (una vez) (~23 EUR) | Permanente | Publicar en Google Play |
| **Expo Account** | Gratis (Free tier) | - | EAS Build (30 builds/mes gratis) |

### 5.3 Certificados y Signing

#### iOS
| Certificado | Propósito | Gestión |
|------------|-----------|---------|
| Distribution Certificate | Firmar builds de producción | EAS lo genera automáticamente |
| Push Notification Certificate | Enviar push notifications | EAS lo configura |
| Provisioning Profile | Vincular app a dispositivos/store | EAS lo gestiona |

#### Android
| Elemento | Propósito | Gestión |
|---------|-----------|---------|
| Upload Keystore | Firmar el APK/AAB para Play Store | EAS lo genera, **guárdalo en lugar seguro** |
| SHA-256 Fingerprint | Verificar la app | Se obtiene del keystore |

> **Con EAS**: Expo gestiona todos los certificados automáticamente. Solo necesitas ejecutar `eas build` y responder las preguntas.

### 5.4 CI/CD Pipeline

**Opción recomendada: EAS Build + EAS Submit**

```
GitHub Push → EAS Build (nube) → TestFlight / Play Beta → EAS Submit → Stores
```

| Herramienta | Función | Coste |
|------------|---------|-------|
| **EAS Build** | Compilar iOS y Android en la nube | Gratis: 30 builds/mes. Pro: $99/mes ilimitado |
| **EAS Update** | OTA updates (sin pasar por store) | Gratis: 1000 updates/mes |
| **EAS Submit** | Subir automáticamente a App Store / Play Store | Gratis |
| **GitHub Actions** | Trigger automático al hacer push | Gratis para repos públicos |

**Alternativa**: Fastlane (gratuito, open source) pero requiere más configuración manual.

**Flujo recomendado:**
1. Desarrollo local con Expo Go (sin builds)
2. `eas build --profile preview` para testing en dispositivos
3. `eas build --profile production` para build de store
4. `eas submit` para subir a App Store / Play Store
5. EAS Update para hotfixes sin pasar por revisión del store

### 5.5 Cambios Necesarios en el Backend (Supabase)

| Cambio | Detalle | Dificultad |
|--------|---------|-----------|
| Campo `push_token` en `players` | Almacenar token de push por jugador | Fácil |
| Campo `avatar_url` en `players` | URL de la foto de perfil (Supabase Storage) | Fácil |
| Supabase Storage bucket | Bucket para fotos de perfil y partidos | Fácil |
| Edge Function: send_push | Enviar push notifications via Expo Push API | Media |
| Database Webhook → push | Trigger automático al crear evento/resultado | Media |
| Tabla `messages` (opcional) | Para chat in-app | Media |
| Tabla `devices` (opcional) | Multi-device push tokens | Baja |

**Schema SQL adicional:**
```sql
-- Nuevos campos en players
ALTER TABLE players ADD COLUMN push_token TEXT;
ALTER TABLE players ADD COLUMN avatar_url TEXT;

-- Tabla de mensajes (opcional, para chat)
CREATE TABLE messages (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id    TEXT REFERENCES events(id) ON DELETE CASCADE,
  player_id   TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  type        TEXT DEFAULT 'text', -- text | image | audio
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.6 Requisitos de Supabase por Plan

| Feature | Free Tier | Pro ($25/mes) | Necesario para FURBITO |
|---------|-----------|---------------|----------------------|
| Base de datos | 500 MB | 8 GB | Free OK hasta ~1000 usuarios |
| Storage | 1 GB | 100 GB | Free OK sin muchas fotos |
| Realtime | 200 conexiones simultáneas | 500 | Free OK hasta ~200 usuarios simultáneos |
| Edge Functions | 500K invocaciones/mes | 2M | Free OK para push |
| Bandwidth | 5 GB/mes | 250 GB | Free OK para uso normal |
| Auth | 50K MAU | 100K MAU | Free OK (si migramos a Supabase Auth) |

**Recomendación**: Empezar con Free Tier. Migrar a Pro ($25/mes) cuando se superen 200 usuarios activos simultáneos o 500 MB de datos.

---

## 6. Presupuesto y Costes

### 6.1 Costes de Desarrollo (Tiempo)

#### Escenario A: Solo Developer con IA (Claude Code)

| Fase | Horas estimadas | Semanas (a 15h/sem) |
|------|----------------|---------------------|
| Fase 1: Setup + Navegación | 40h | 2.5 sem |
| Fase 2: Supabase | 20h | 1.5 sem |
| Fase 3: Features | 60h | 4 sem |
| Fase 4: Nativo exclusivo | 40h | 2.5 sem |
| Fase 5: Testing | 30h | 2 sem |
| Fase 6: Publicación | 15h | 1 sem |
| **TOTAL** | **~205 horas** | **~14 semanas** |

**Coste**: Tiempo propio + suscripción Claude Code Pro (~$20/mes x 4 meses = $80)

#### Escenario B: Contratar un Desarrollador Freelance

| Tipo | Tarifa/hora | Total estimado | Tiempo |
|------|------------|----------------|--------|
| Junior (España) | 25-35 EUR/h | 5,000-7,000 EUR | 3-4 meses |
| Mid-level (España) | 40-60 EUR/h | 8,000-12,000 EUR | 2-3 meses |
| Senior (España) | 60-100 EUR/h | 12,000-20,000 EUR | 1.5-2 meses |
| Freelance LatAm | 15-25 USD/h | 3,000-5,000 USD | 3-4 meses |

#### Escenario C: Agencia de Desarrollo

| Tipo | Presupuesto | Tiempo | Incluye |
|------|------------|--------|---------|
| Agencia local (España) | 15,000-40,000 EUR | 3-6 meses | Diseño + desarrollo + testing |
| Agencia nearshore (Portugal/LatAm) | 8,000-20,000 EUR | 3-5 meses | Desarrollo + testing |
| Agencia offshore (India/Europa del Este) | 5,000-15,000 EUR | 3-6 meses | Solo desarrollo |

### 6.2 Costes Fijos de Infraestructura

| Concepto | Coste | Frecuencia |
|----------|-------|-----------|
| Apple Developer Account | 99 USD (~92 EUR) | Anual |
| Google Play Developer | 25 USD (~23 EUR) | Una vez |
| Supabase Free Tier | 0 EUR | - |
| Supabase Pro (cuando escale) | 25 USD (~23 EUR)/mes | Mensual |
| Vercel (web, ya lo tienes) | 0 EUR (free tier) | - |
| Expo EAS Build Free | 0 EUR | - |
| Expo EAS Build Pro (opcional) | 99 USD/mes | Mensual (solo si necesitas más builds) |
| Dominio furbito.app (si no lo tienes) | 12-15 EUR | Anual |

### 6.3 Costes de APIs Externas

| API | Free Tier | Coste después | Uso en FURBITO |
|-----|-----------|---------------|----------------|
| Google Maps SDK (móvil) | 28,000 cargas de mapa/mes gratis | $7 por 1000 cargas | Mapa de pistas |
| Google Directions API | 40,000 llamadas/mes (crédito $200) | $5-10 por 1000 llamadas | "Cómo llegar" |
| Expo Push Notifications | Ilimitado | GRATIS | Push notifications |
| Sentry (crash reporting) | 5K eventos/mes gratis | $26/mes | Monitoreo de errores |

**Google Maps**: Google da $200/mes de crédito gratis. Con 28,000 cargas de mapa gratis al mes, FURBITO no pagará por mapas hasta tener miles de usuarios activos diarios.

### 6.4 Costes de Mantenimiento Mensual

| Concepto | Fase inicial (0-1000 usuarios) | Escala (1000-10000 usuarios) |
|----------|-------------------------------|------------------------------|
| Supabase | 0 EUR | 23 EUR/mes |
| Apple Developer | ~8 EUR/mes (99/12) | ~8 EUR/mes |
| Google Maps | 0 EUR | 0-15 EUR/mes |
| Expo EAS | 0 EUR | 0-99 USD/mes |
| Sentry | 0 EUR | 0-26 USD/mes |
| **TOTAL mensual** | **~8 EUR/mes** | **~50-170 EUR/mes** |

### 6.5 Tabla Comparativa de Costes Totales (Primer Año)

| Concepto | DIY + Claude Code | Freelance | Agencia |
|----------|:-----------------:|:---------:|:-------:|
| Desarrollo | ~80 EUR (Claude Pro) | 5,000-12,000 EUR | 15,000-40,000 EUR |
| Apple Developer | 92 EUR | 92 EUR | 92 EUR |
| Google Play | 23 EUR | 23 EUR | 23 EUR |
| Infraestructura (12 meses) | ~96 EUR | ~96 EUR | ~96 EUR |
| **TOTAL primer año** | **~291 EUR** | **~5,211-12,211 EUR** | **~15,211-40,211 EUR** |

> **La opción DIY con Claude Code es 17-50x más barata que contratar desarrollo externo.** El coste real es tu tiempo.

---

## 7. Pros y Contras de Cada Enfoque

### 7.1 Web-Only (Mantener PWA Actual)

| Pros | Contras |
|------|---------|
| Sin coste adicional de desarrollo | Sin push notifications fiables en iOS |
| Una sola codebase | No aparece en App Store / Google Play |
| Actualizaciones instantáneas | Los usuarios no la encuentran buscando |
| Funciona en cualquier dispositivo con navegador | Instalación PWA confusa para usuarios no técnicos |
| Sin necesidad de aprobación de stores | Sin acceso a cámara, GPS background, biometría |
| Sin costes de developer accounts | Percepción de "no es una app real" |
| Ya está hecho y funcionando | Limitado en animaciones y rendimiento |

**Mejor para**: Fase beta, validación de concepto, comunidades pequeñas (<50 usuarios).

---

### 7.2 Híbrido (Capacitor wrapping web)

| Pros | Contras |
|------|---------|
| Reutiliza 95% del código web actual | No se siente nativo (scroll, transiciones) |
| Implementación en semanas | Apple puede rechazar "web en contenedor" |
| Presencia en stores con mínimo esfuerzo | Rendimiento inferior en dispositivos antiguos |
| Acceso a plugins nativos (push, cámara) | Debugging complejo (web + nativo) |
| Un solo equipo/persona puede mantenerlo | Tamaño de app grande (~30-50MB) |
| Mismo código para web y app | Los usuarios avanzados notan que no es nativa |
| Bajo coste | Limitaciones en features nativas complejas |

**Mejor para**: Presencia rápida en stores mientras se desarrolla la versión nativa real. Paso intermedio.

---

### 7.3 App Nativa (React Native / Expo)

| Pros | Contras |
|------|---------|
| Experiencia de usuario nativa real | Requiere reescribir la UI completa |
| Push notifications completas | 3-5 meses de desarrollo |
| Acceso total a APIs nativas | Necesidad de mantener web + app |
| Presencia real en App Store y Google Play | Actualizaciones pasan por revisión del store |
| Animaciones fluidas a 60fps | Hay que aprender React Native (parecido, pero diferente) |
| Widgets, biometría, deep links | Doble testing (iOS + Android) |
| Los usuarios confían más en una app del store | Costes de developer accounts |
| Mejor retención (icono permanente en home) | Dependencia del ecosistema Expo/Meta |
| Lottie, haptics, offline mode | |

**Mejor para**: Producto maduro que ha validado su mercado en web y quiere escalar.

---

### 7.4 Tabla Comparativa Final

| Criterio | Web PWA | Híbrido (Capacitor) | Nativa (React Native) |
|----------|:-------:|:-------------------:|:---------------------:|
| Coste de desarrollo | Nulo | Bajo | Medio |
| Tiempo hasta stores | N/A | 2-4 semanas | 3-5 meses |
| UX / Calidad percibida | Media | Media-Baja | Alta |
| Push notifications | Limitadas | Sí | Sí (nativas) |
| Discoverability (stores) | Nula | Sí | Sí |
| Rendimiento | Medio | Medio-Bajo | Alto |
| Mantenimiento | 1 codebase | 1 codebase + wrapper | 1 codebase RN + web |
| Aprobación App Store | N/A | Riesgo medio | Sin problemas |
| Funcionalidades nativas | Muy limitadas | Limitadas | Completas |
| Valor percibido por usuario | "Es una web" | "App básica" | "App real" |
| **Recomendación** | **Ahora (beta)** | **Puente (opcional)** | **Objetivo final** |

---

## 8. Roadmap Recomendado

### 8.1 Plan de 6 Meses (Mes a Mes)

#### MES 1 — Fundamentos (Semanas 1-4)

| Semana | Tareas | Entregable |
|--------|--------|-----------|
| 1 | Crear proyecto Expo, configurar TypeScript, copiar types y lógica de juego | Proyecto base funcional |
| 2 | Implementar navegación (5 tabs), pantalla login, tema de colores | Navegación completa |
| 3 | Integrar Supabase, migrar hooks de datos, probar conexión | CRUD funcional |
| 4 | Lista de jugadores, perfil de jugador con stats y badges | Primera feature completa |

**Hito Mes 1**: App navegable con datos reales de Supabase.

#### MES 2 — Features Core (Semanas 5-8)

| Semana | Tareas | Entregable |
|--------|--------|-----------|
| 5 | Lista de eventos, detalle de evento, confirmación de asistencia | Flujo de eventos |
| 6 | Crear evento nuevo, formulario con date/time pickers nativos | Creación de eventos |
| 7 | Registro post-partido (resultado, stats, MVP) | Flujo post-partido |
| 8 | Generador de equipos (4 modos), rankings | Equipos y rankings |

**Hito Mes 2**: Todas las features core migradas. La app es funcionalmente equivalente a la web.

#### MES 3 — Features Nativas (Semanas 9-12)

| Semana | Tareas | Entregable |
|--------|--------|-----------|
| 9 | Push notifications (setup Expo + Supabase Edge Function) | Notificaciones funcionando |
| 10 | Mapa de pistas con react-native-maps, valoraciones | Mapas y votos |
| 11 | Cámara para avatar, biometría (FaceID/huella), haptic feedback | Features nativas |
| 12 | Deep links, share nativo, animaciones Lottie para badges | Sharing y animaciones |

**Hito Mes 3**: App nativa con features exclusivas que la web no tiene.

#### MES 4 — Pulido y Testing (Semanas 13-16)

| Semana | Tareas | Entregable |
|--------|--------|-----------|
| 13 | Modo offline básico (cache de datos), indicadores de sync | Offline mode |
| 14 | Testing en dispositivos reales (Android + iOS), fix bugs | App estable |
| 15 | Performance profiling, optimización de listas y carga | App rápida |
| 16 | Accessibility, ajustes de UI, estados vacíos, onboarding | App pulida |

**Hito Mes 4**: App lista para beta testing.

#### MES 5 — Beta y Preparación (Semanas 17-20)

| Semana | Tareas | Entregable |
|--------|--------|-----------|
| 17 | Build beta, distribuir via TestFlight (iOS) y Play Beta (Android) | Beta disponible |
| 18 | Recoger feedback de 10-20 beta testers de comunidades existentes | Lista de mejoras |
| 19 | Iterar según feedback, fix bugs críticos | Beta v2 |
| 20 | Preparar assets de store: screenshots, icono, descripción, feature graphic | Assets listos |

**Hito Mes 5**: Beta estable con feedback positivo de usuarios reales.

#### MES 6 — Lanzamiento (Semanas 21-24)

| Semana | Tareas | Entregable |
|--------|--------|-----------|
| 21 | Build de producción, submit a App Store y Google Play | Apps enviadas |
| 22 | Esperar revisión, fix si hay rechazo, re-submit | Apps aprobadas |
| 23 | Lanzamiento suave: avisar a comunidades beta, pedir reviews | v3.0 LIVE |
| 24 | Monitoreo de crashes (Sentry), hotfixes con EAS Update | Estabilidad |

**Hito Mes 6**: FURBITO v3.0 disponible en App Store y Google Play.

---

### 8.2 MVP Features para v3.0 (Lanzamiento)

**Incluido en v3.0:**
- Login con PIN + código (igual que web)
- Biometría (FaceID / huella) como opción
- Lista y detalle de jugadores con perfil completo
- Lista y detalle de eventos/partidos
- Confirmación de asistencia
- Crear evento (solo admin)
- Registro post-partido con stats
- Generador de equipos (4 modos)
- Rankings
- Sistema de badges y niveles (visual)
- Mapa de pistas (Google Maps nativo)
- Push notifications (partido nuevo, recordatorio, resultado)
- Compartir resultado / invitar a comunidad
- Haptic feedback

**NO incluido en v3.0 (para versiones futuras):**
- Chat in-app
- Modo offline completo
- Widgets
- Stories / activity feed
- Apple Watch / WearOS
- App Clips / Instant Apps
- Notas de voz
- Street View

---

### 8.3 Releases Post-Lanzamiento

#### v3.1 (Mes 7-8): Social y Engagement

| Feature | Prioridad |
|---------|-----------|
| Activity Feed ("Juan desbloqueó Hat Trick") | Alta |
| Chat por evento | Alta |
| Foto de partido (cámara + galería) | Media |
| Modo offline básico mejorado | Media |
| Widget de próximo partido (iOS) | Media |

#### v3.2 (Mes 9-10): Avanzado

| Feature | Prioridad |
|---------|-----------|
| Widget de próximo partido (Android) | Media |
| Street View en pistas | Media |
| GPS: detectar pistas cercanas | Media |
| Animaciones Lottie mejoradas | Baja |
| Stories de partido (24h) | Baja |
| Exportar stats como imagen | Media |

#### v3.3 (Mes 11-12): Escalabilidad

| Feature | Prioridad |
|---------|-----------|
| Múltiples comunidades por usuario | Alta |
| Torneos / ligas dentro de comunidad | Alta |
| Temporadas con reset de stats | Media |
| App Clips / Instant Apps | Baja |
| Internacionalización (i18n) | Media |
| Apple Watch companion (si hay demanda) | Baja |

---

### 8.4 ASO (App Store Optimization) Básico

| Elemento | Recomendación |
|----------|--------------|
| **Nombre** | FURBITO - Organiza tu Fútbol |
| **Subtítulo (iOS)** | Partidos, equipos, stats y más |
| **Descripción corta (Android)** | Organiza partidos de fútbol con amigos. Stats, badges y rankings. |
| **Categoría** | Sports (primaria), Social Networking (secundaria) |
| **Keywords** | fútbol, partidos, equipos, stats, amigos, organizar, amateur, pistas, ranking, MVP |
| **Screenshots** | 6 screenshots mostrando: home, crear partido, perfil con badges, generador equipos, mapa, ranking |
| **Feature Graphic (Android)** | Imagen de 1024x500 con logo + "Organiza tu fútbol" |
| **Preview Video (opcional)** | 15-30 segundos mostrando el flujo principal |
| **Icono** | El logo de FURBITO en formato cuadrado con esquinas redondeadas |

---

## 9. Riesgos y Mitigación

### 9.1 Rechazo en App Store

| Motivo frecuente de rechazo | Cómo evitarlo |
|---------------------------|---------------|
| **"Es solo un wrapper de web"** | Asegurarse de usar componentes nativos (React Native), no WebView |
| **Funcionalidad mínima** | Incluir suficientes features nativas (push, cámara, biometría, haptics) |
| **Bugs o crashes** | Testing exhaustivo en dispositivos reales antes de submit |
| **Metadata incorrecta** | Capturas reales de la app, descripción precisa, categoría correcta |
| **Privacidad** | Declarar exactamente qué datos se recogen (App Privacy Labels) |
| **Login issues** | Proporcionar credenciales de test al reviewer de Apple |
| **In-App Purchase required** | Si hay features premium, usar IAP de Apple (no pagos externos) |
| **Guideline 4.2 (Minimum Functionality)** | Demostrar que la app ofrece valor más allá de una web |
| **COPPA (menores)** | Si admites menores de 13, cumplir regulaciones |

**Acciones preventivas:**
1. Incluir una cuenta de demo en los "Review Notes" de App Store Connect
2. Tener al menos 5 features nativas que la web no puede hacer
3. No mencionar que es "una web convertida" en ningún lugar
4. Testear con TestFlight al menos 2 semanas antes de submit

### 9.2 Migración de Datos de Usuarios Web

| Riesgo | Mitigación |
|--------|-----------|
| Los usuarios de web no migran a la app | Mantener la web funcionando, no forzar migración |
| Pérdida de datos al migrar | No hay migración de datos: ambas apps usan la misma BD de Supabase |
| Sesiones diferentes (web vs app) | Implementar un flujo de "vincular cuenta" (mismo PIN + código) |
| Push tokens solo en app | Campo `push_token` es NULL para usuarios solo-web, no afecta |

**Estrategia de migración de usuarios:**
1. Fase 1: Ambas versiones coexisten, misma base de datos
2. Fase 2: Notificación en la web "Descarga la app para recibir notificaciones"
3. Fase 3: Features exclusivas de la app como incentivo (offline, biometría, widgets)
4. Fase 4: La web se mantiene como landing page + acceso básico

### 9.3 Mantener la Versión Web Durante la Transición

| Aspecto | Estrategia |
|---------|-----------|
| Ambas versiones con features diferentes | La web mantiene features actuales, la app añade nuevas |
| Bugs que afectan a ambas | Supabase es compartido: un fix en la BD beneficia a ambas |
| Desarrollo paralelo | Priorizar app nativa, web en "modo mantenimiento" (solo bugs) |
| Coste de mantener 2 frontends | Aceptable si la web se congela en features |
| Cuándo retirar la web | NO retirar. Convertirla en landing page + acceso básico |

### 9.4 Adopción por Parte de los Usuarios

| Riesgo | Mitigación |
|--------|-----------|
| Los usuarios no descargan la app | Incentivos: features exclusivas, push notifications |
| Resistencia al cambio | La app debe ser igual o mejor que la web en todo |
| Usuarios sin espacio en el móvil | Optimizar tamaño de la app (<50MB) |
| Usuarios con Android antiguo | Soportar Android 6+ (API 23), que cubre >95% del mercado |
| Usuarios con iPhone antiguo | Soportar iOS 14+, que cubre >95% de iPhones activos |

### 9.5 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Expo no soporta una feature necesaria | Baja | Medio | Expo soporta el 95% de casos. Si falta algo, usar `expo-dev-client` con módulo nativo |
| Supabase tiene downtime | Baja | Alto | Implementar cache local para modo offline |
| Google Maps cambia precios | Media | Medio | El crédito de $200/mes cubre uso normal. Alternativa: Mapbox |
| React Native deprecated | Muy Baja | Alto | Meta usa RN en sus propias apps (Facebook, Instagram). No va a desaparecer |
| Apple cambia reglas del store | Media | Medio | Seguir las guidelines actualizadas, tener margen de maniobra |
| Expo actualiza con breaking changes | Media | Medio | Fijar versiones, actualizar gradualmente |

---

## 10. Conclusión y Recomendación Final

### 10.1 Recomendación para el Caso FURBITO

**La migración a app nativa con React Native (Expo) es el siguiente paso lógico para FURBITO**, pero **no debe hacerse inmediatamente**. El momento óptimo depende de métricas específicas de la fase beta.

### 10.2 El Camino Recomendado (Budget-Conscious, Solo Developer)

```
FASE ACTUAL (Ahora)
└─ Web PWA en producción
   └─ Beta testing con comunidades reales
      └─ Recopilar métricas y feedback

TRIGGER para empezar migración (cuando se cumpla AL MENOS 2 de 3):
├─ 50+ usuarios activos semanales
├─ 5+ comunidades con actividad regular
└─ Feedback recurrente pidiendo "app real" / push notifications

MIGRACIÓN (4-6 meses)
├─ Mes 1-2: Core features en React Native
├─ Mes 3: Features nativas (push, cámara, biometría)
├─ Mes 4: Testing y pulido
├─ Mes 5: Beta con usuarios reales
└─ Mes 6: Publicación en stores

POST-LANZAMIENTO
├─ Web se mantiene como acceso básico + landing page
├─ App nativa es el producto principal
├─ Iteración mensual con nuevas features
└─ v3.1, v3.2, v3.3 según feedback de usuarios
```

### 10.3 Por Qué NO Empezar la Migración Ahora

1. **La web necesita validar el producto primero**: Si el concepto no funciona en web (gratis, sin fricción), no va a funcionar en app nativa
2. **Los datos de beta son esenciales**: Saber qué features usan más, dónde abandonan, qué piden, permite priorizar mejor la app
3. **El coste de oportunidad**: Cada hora en la app nativa es una hora no invertida en mejorar la web (que ya tiene usuarios)
4. **Las stores requieren mantenimiento**: Una vez publicada, hay que mantenerla actualizada o Apple/Google la retiran

### 10.4 Por Qué SÍ Prepararse Ahora

1. **Estructurar el código web pensando en la migración**: Lógica pura separada de UI (ya lo tienes con `lib/game/`)
2. **Crear cuenta de Apple Developer**: El proceso tarda 24-48h y a veces más
3. **Familiarizarse con React Native**: Hacer un mini-proyecto de práctica (1-2 días)
4. **Definir el branding para stores**: Nombre, icono, screenshots, descripción

### 10.5 Presupuesto Mínimo Viable

| Concepto | Coste |
|----------|-------|
| Claude Code Pro (4 meses) | ~80 USD |
| Apple Developer Account | 99 USD |
| Google Play Developer | 25 USD |
| Supabase (Free tier) | 0 USD |
| Expo (Free tier) | 0 USD |
| **TOTAL** | **~204 USD (~190 EUR)** |

Con menos de 200 EUR y tu tiempo, puedes tener FURBITO en App Store y Google Play.

### 10.6 Resumen Ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| **Qué tecnología usar** | React Native con Expo |
| **Cuánto tiempo** | 4-6 meses (a tiempo parcial, 15-20h/semana) |
| **Cuánto cuesta** | ~200 EUR en herramientas + tu tiempo |
| **Cuándo empezar** | Cuando la beta web tenga tracción (50+ usuarios activos) |
| **Qué se reutiliza** | Types, lógica de juego, hooks (adaptados), estado Zustand |
| **Qué se reescribe** | Toda la UI (componentes React Native en vez de HTML) |
| **Mayor beneficio** | Push notifications + presencia en stores + percepción de "app real" |
| **Mayor riesgo** | Invertir tiempo antes de validar el producto en web |
| **Alternativa intermedia** | Capacitor para tener presencia en stores en 2-4 semanas |

---

> **Documento generado para FURBITO v2.0**
> Última actualización: Marzo 2026
> Para consultas o actualizaciones, revisar junto con DOCS/ARCHITECTURE.md y DOCS/WARROOM_ROADMAP_30D.md
