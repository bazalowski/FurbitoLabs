# FURBITO — Reconfiguración de Notion

> **Propósito**: reestructurar el workspace de Notion como centro único de mando para (1) llevar la PWA existente a **app nativa** (iOS + Android) y (2) ejecutar el **plan de marketing** de lanzamiento.
> **Fecha**: 2026-04-23
> **Estado app**: PWA funcional, rediseño UI/UX cerrado, puntuación Comunio live, realtime + MVP por voto + equipos v2 + ranking premium.

---

## 0. Filosofía del workspace

El Notion anterior era un contenedor de documentos sueltos (guías, roadmaps, notas). Este rediseño lo convierte en **sistema operativo del producto**: bases de datos relacionadas, vistas por rol, y docs que viven dentro de sus entidades.

**Reglas del workspace**:

1. **Bases de datos > páginas sueltas**. Cada tipo de ítem (tarea, bug, feature, test, copy, campaña, canal) es una fila de una base de datos. Las páginas largas solo existen para *docs vivos* (arquitectura, DS, playbooks).
2. **Vista por rol, no por página**. Una base de datos → varias vistas (Hoy, Esta semana, Backlog, Por persona, Por release).
3. **Linear-style para tareas**, **Airtable-style para assets**, **Notion-style para docs**. Cada sección respeta el formato que mejor sirve.
4. **Todo tiene propietario, estado y release**. Sin propietario = tarea muerta. Sin release = tarea huérfana.
5. **Nada existe en dos sitios**. Si algo se duplica, se convierte en relation.

---

## 1. Estructura top-level

```
FURBITO HQ (workspace icon: ⚽)
│
├── 🏠 Home                         ← dashboard (embeds de vistas clave)
│
├── 📦 PRODUCT
│   ├── 🗺️  Roadmap                 (DB · releases)
│   ├── ✨ Features                  (DB · features, hijas de release)
│   ├── 🐞 Bugs & QA                 (DB · con severidad, device, repro)
│   ├── 🧪 Experiments               (DB · A/B, pricing tests, ideas)
│   └── 📋 Backlog                    (vista filtrada de Features+Bugs sin release)
│
├── 📱 NATIVE APP (migración v3)
│   ├── 📘 Playbook migración         (doc vivo — ver §3)
│   ├── ⚙️  Setup & infra             (checklist)
│   ├── 🎨 Paridad de pantallas       (DB · pantalla web → pantalla nativa)
│   ├── 🚀 Features nativas           (DB · push, biometría, haptics, deep links)
│   ├── 🧰 Assets stores              (DB · icono, screenshots, copy ASO)
│   ├── 📝 Submisión                  (checklist Apple + Google)
│   └── 🧪 Beta (TestFlight/Play)     (DB · testers + feedback)
│
├── 📈 MARKETING
│   ├── 🎯 Estrategia (pillar)        (doc vivo)
│   ├── 👥 Personas                   (DB · 4-5 personas canónicas)
│   ├── 🏁 Campañas                   (DB · objetivo, canal, KPI, estado)
│   ├── 📅 Content Calendar           (DB · reel, post, email, blog)
│   ├── ✏️  Copy Library              (DB · headlines, CTAs, taglines)
│   ├── 🎨 Brand assets               (DB · logos, plantillas, reels master)
│   ├── 📊 Métricas semanales         (DB · snapshot KPIs cada lunes)
│   └── 💬 Feedback entrante          (DB · WhatsApp, App Store, correo)
│
├── 🎨 DESIGN SYSTEM
│   ├── 📐 Tokens & fundamentos        (doc — link a FURBITO_DESIGN_SYSTEM.md)
│   ├── 🧩 Componentes                 (DB · 1 fila por componente, con spec + screenshot)
│   ├── 🎭 Patrones UX                 (DB · tutorial, empty state, onboarding, recompensa)
│   └── 🧪 Auditoría continua          (DB · issues de consistencia detectados)
│
├── ⚙️  ENGINEERING
│   ├── 🏛️  Architecture                (doc vivo — link a ARCHITECTURE.md)
│   ├── 🔑 Secrets & envs               (lista + enlaces a 1Password/Vercel)
│   ├── 🗃️  DB schema                   (doc — link a supabase/schema.sql)
│   ├── 🧪 Test plan                    (DB · casos de prueba)
│   └── 📚 Runbooks                     (DB · deploy, rollback, incidentes)
│
├── 💰 BUSINESS
│   ├── 💸 Pricing & monetización       (doc)
│   ├── 📊 Finanzas                     (DB · gastos mensuales: Supabase, Vercel, Apple, Google, ads)
│   └── 🤝 Partnerships & outreach      (DB · clubes, federaciones, creadores)
│
└── 📂 ARCHIVO
    └── (docs antiguos, decisiones pasadas, lessons learned)
```

> **Convención de emojis**: 1 emoji por top-level. No mezclar estilos dentro del mismo nivel (evitar mezclar ⚽ con 🏈 con 🎮).

---

## 2. Bases de datos clave — esquema detallado

### 2.1 🗺️ Roadmap

Cada fila = 1 release. Las features cuelgan de aquí.

| Propiedad | Tipo | Notas |
|-----------|------|-------|
| Name | Title | `v2.4 – Push nativas` |
| Status | Select | `Idea` · `Diseño` · `Build` · `QA` · `Released` · `Postponed` |
| Target date | Date | Fecha objetivo de release |
| Platform | Multi-select | `Web (PWA)` · `iOS` · `Android` |
| Theme | Select | `Onboarding` · `Retención` · `Gamificación` · `Admin` · `Marketing` |
| Owner | Person | 1 solo propietario |
| Features | Relation → Features | rollup count |
| Outcome | Rich text | qué problema resuelve, hipótesis |
| Docs | Files & media | mockups, specs, decisiones |

**Vistas**:
- 📅 **Timeline** (Gantt por target date)
- 🧱 **Kanban** agrupado por Status
- 🎯 **Esta quincena** (filtro target date ≤ hoy+14d, status ≠ Released)

---

### 2.2 ✨ Features

| Propiedad | Tipo | Notas |
|-----------|------|-------|
| Name | Title | Verbo + objeto: "Añadir compartir resultado como imagen" |
| Release | Relation → Roadmap | obligatorio |
| Status | Select | `Idea` · `Spec` · `Design` · `Build` · `Review` · `Shipped` · `Killed` |
| Priority | Select | `P0 crítico` · `P1 alto` · `P2 medio` · `P3 low` |
| Owner | Person | |
| Surface | Multi-select | `Home` · `Partido detalle` · `Perfil` · `Ranking` · `Admin` · `Login` · `Settings` |
| Platforms | Multi-select | `Web` · `iOS` · `Android` · `Backend` |
| Dependencies | Relation → Features | bloquea / bloqueado por |
| QA owner | Person | |
| Linked files | Rich text | rutas `src/...` del repo |
| Metric to move | Text | "Asistencia media +5%" |

**Vistas**:
- 🛠️ **En desarrollo** (status in Build/Review)
- 🧊 **Backlog priorizado** (P0/P1 sin release)
- 📱 **Solo nativa** (Platforms contiene iOS o Android)

---

### 2.3 🐞 Bugs & QA

| Propiedad | Tipo |
|-----------|------|
| Title | Title |
| Severity | Select (`S0 bloqueante` · `S1 mayor` · `S2 menor` · `S3 cosmético`) |
| Status | Select (`Open` · `Triage` · `In fix` · `Fixed` · `Verified` · `Won't fix`) |
| Device | Multi-select (`iPhone 15` · `iPhone SE` · `Pixel 7` · `Android low-end` · `Safari desktop` · `Chrome desktop`) |
| Repro | Rich text |
| Screenshot | Files |
| Related feature | Relation → Features |
| Reported by | Person |
| Assignee | Person |
| Release fix | Relation → Roadmap |

**Vistas**: por severidad · por device · por release · abiertos sin asignar.

---

### 2.4 🎨 Paridad de pantallas (native migration)

La migración no es "reescribir todo"; es **alcanzar paridad pantalla por pantalla**. Esta DB lo traquea.

| Propiedad | Tipo | Notas |
|-----------|------|-------|
| Pantalla | Title | `Home`, `Partido → Equipos`, `Ranking`, ... |
| Ruta web | URL | `/[cid]/page.tsx` |
| Ruta nativa | Text | `app/(tabs)/index.tsx` |
| Estado web | Select | `v1` · `v2 (rediseño)` · `v3 (polish premium)` |
| Estado nativa | Select | `Todo` · `Skeleton` · `UI done` · `Data done` · `QA` · `Parity ✅` |
| Bloqueadores | Multi-select | `Leaflet` · `CSS custom (shine-sweep)` · `Realtime` · `Storage` |
| Screenshot web | Files | actual |
| Screenshot nativa | Files | actual |
| Notas | Rich text | decisiones específicas (p.ej. sustituir `shine-sweep` por reanimated) |

> **Por qué es crítica**: la app tiene una capa de polish premium (gloss, shine-sweep, aura halo, legend-rainbow) que NO se porta literalmente a RN. Cada pantalla necesita decisión explícita de qué se mantiene, qué se sustituye y qué se omite.

---

### 2.5 🏁 Campañas (marketing)

| Propiedad | Tipo |
|-----------|------|
| Name | Title |
| Objective | Select (`Awareness` · `Acquisition` · `Activation` · `Retention` · `Referral`) |
| Channel | Multi-select (`Instagram` · `TikTok` · `WhatsApp Communities` · `Email` · `Reddit` · `Product Hunt` · `ASO` · `Google Ads` · `Meta Ads`) |
| Persona target | Relation → Personas |
| Status | Select (`Draft` · `Planned` · `Live` · `Paused` · `Done`) |
| Start / End | Date range |
| Budget EUR | Number |
| KPI primario | Text (`CPI < 0,80€`, `signups ≥ 100`) |
| Actuales | Number (se llena al final) |
| Link analytics | URL |
| Creatives | Relation → Content Calendar |

---

### 2.6 📅 Content Calendar

| Propiedad | Tipo |
|-----------|------|
| Titular | Title |
| Format | Select (`Reel` · `Post estático` · `Carrusel` · `Email` · `Short YouTube` · `Blog` · `Push/in-app`) |
| Channel | Select (hereda de Campañas) |
| Status | Select (`Idea` · `Script` · `Captura` · `Edit` · `Review` · `Scheduled` · `Published`) |
| Publish date | Date |
| Campaign | Relation → Campañas |
| Copy (primary) | Relation → Copy Library |
| Asset | Files & media |
| Owner | Person |
| Result (views/CTR) | Number |

**Vistas**:
- 📆 **Calendar** por publish date
- 🎬 **En producción** (status Captura/Edit/Review)
- 🏆 **Top performers** (ordenado por Result desc, solo Published)

---

### 2.7 👥 Personas

4-5 personas canónicas. 1 página por persona con:

- Foto (AI o ilustrativa)
- Edad, rol, ciudad tipo
- Trigger (el momento concreto en que buscarían FURBITO)
- Jobs-to-be-done
- Canales donde vive (IG? WhatsApp? Reddit r/futbol?)
- Copy que resuena / copy que rechaza
- Objeciones frecuentes

**Personas iniciales sugeridas** (ajustar con datos reales):
1. **El organizador cansado** — 32, juega cada semana con el grupo del curro, usa Excel+WhatsApp para cuadrar asistencia. Trigger: un jueves sin respuestas.
2. **El capitán amateur** — 24-28, líder de un grupo de antiguos compañeros de cole/uni. Trigger: alguien sugiere "una app para esto".
3. **El coach del barrio** — 40+, entrena a un grupo estable 2x/semana. Trigger: quiere rotar mejor y retener gente.
4. **El jugador competitivo** — 20-30, le motiva ranking, stats, MVP. Trigger: ve el perfil de un amigo con badges.
5. **La admin (descubrir si existe)** — mujeres que organizan mixtos/femeninos. Trigger: inclusividad, no pelearse con apps "de tíos".

---

### 2.8 📊 Métricas semanales

Snapshot semanal (cada lunes). Histórico para ver tendencias.

| Propiedad | Tipo |
|-----------|------|
| Week of | Date (lunes) |
| Comunidades activas | Number |
| Jugadores activos (7d) | Number |
| Partidos jugados (7d) | Number |
| Tasa asistencia media | Number (%) |
| DAU / WAU | Number |
| Instalaciones PWA | Number |
| Instalaciones iOS | Number |
| Instalaciones Android | Number |
| Nuevas comunidades | Number |
| Crashes bloqueantes | Number |
| NPS | Number |
| Nota Apple | Number |
| Nota Google | Number |
| Notas de la semana | Rich text |

Gráfica: linear chart de cada KPI a lo largo del tiempo (Notion Charts).

---

## 3. Playbook de migración nativa — estructura dentro de Notion

Este playbook **no reemplaza** a `DOCS/GUIA_MIGRACION_APP_NATIVA.md` (que ya es exhaustivo): lo **instrumenta**. Es el que usará el equipo día a día.

### Estructura de la página `📘 Playbook migración`

```
📘 Playbook migración
│
├── 0. Resumen ejecutivo (3 bullets)
├── 1. Decisión de stack (RN + Expo) — link a PASO_3_APP_NATIVA.md
├── 2. Setup local (toggle con bloques de código)
│   ├── Cuentas necesarias
│   ├── Repositorio monorepo vs separado
│   └── Comandos iniciales
├── 3. Paridad de pantallas (embed DB "Paridad de pantallas")
├── 4. Features nativas exclusivas (embed DB "Features nativas")
│   ├── Push (Expo Notifications + trigger Supabase)
│   ├── Biometría (expo-local-authentication)
│   ├── Haptics (expo-haptics)
│   ├── Share resultado como imagen (view-shot + sharing)
│   ├── Deep links (furbito://join/:cid?pin=XXXX)
│   ├── Offline cache (AsyncStorage)
│   └── In-app rating (StoreReview)
├── 5. Design System en RN
│   ├── Tokens compartidos → archivo `tokens.ts`
│   ├── Mapeo CSS variable → StyleSheet
│   ├── Qué se adapta / qué se sustituye
│   └── Librerías: react-native-reanimated, moti, react-native-svg
├── 6. Supabase en RN
│   ├── AsyncStorage adapter
│   ├── Realtime
│   └── Storage (avatars)
├── 7. Testing
│   ├── Expo Go (dev rápido)
│   ├── Dev build (features nativas)
│   ├── TestFlight (iOS)
│   └── Internal testing (Android)
├── 8. Submisión
│   ├── Checklist Apple (link a DB)
│   ├── Checklist Google (link a DB)
│   ├── Política de privacidad
│   └── ASO (keywords, descripción, screenshots)
├── 9. Post-launch
│   ├── OTA updates (eas update)
│   ├── Crash monitoring (Sentry)
│   └── Rollback plan
└── 10. Riesgos y decisiones abiertas
```

### Fase por fase — timeline sugerido (8 semanas agresivas)

| Semana | Hito | Entregable verificable |
|--------|------|------------------------|
| 1 | Setup + login nativo | APK dev con login por PIN funcionando contra Supabase prod |
| 2 | Home + Partidos list | Paridad de home y partidos (sin stats avanzadas) |
| 3 | Detalle partido + confirmación | Flow completo de confirmar asistencia |
| 4 | Perfil + Ranking | Podio + tabs Puntos/Goles/Asist |
| 5 | Push + Haptics + Biometría | Push funcionando end-to-end; biometría opcional |
| 6 | Deep links + Share imagen | furbito://join/:cid funcional; share a WhatsApp |
| 7 | QA cerrado + TestFlight + Internal Testing | 10 testers reales probando |
| 8 | Submisión a stores | App enviada a review Apple + publicada en interno Google |

> **Regla de entrega**: cada hito termina con un **build real en dispositivo real**, no "funciona en el simulador".

---

## 4. Sección Marketing — cómo está cableada

### Dashboard inicial (`Home` del workspace)

Bloques embebidos:

1. **Esta semana** — vista de Content Calendar con `publish_date` entre hoy y hoy+7.
2. **Campañas live** — vista de Campañas con status = Live.
3. **Últimas métricas** — última fila de Métricas semanales como card.
4. **Bugs S0/S1 abiertos** — vista filtrada de Bugs & QA.
5. **Feedback entrante sin responder** — vista filtrada de Feedback.

### Flujo de contenido (de idea a publicado)

```
Feedback entrante / Idea suelta
        ↓
Content Calendar (status: Idea)
        ↓
    ¿encaja en una Campaña?
   ┌────┴─────┐
   SÍ         NO
   ↓          ↓
link → Campaña  queda "suelto"
   ↓
Script + Copy (status: Script)
   ↓
Captura + Edit (status: Edit, owner = editor)
   ↓
Review (status: Review, owner = revisor)
   ↓
Scheduled (con publish_date)
   ↓
Published + rellenar "Result"
```

---

## 5. Plantillas de páginas

Incluir 3 templates en el workspace (Notion Templates):

1. **`/feature-spec`** — para crear una nueva feature con secciones: Problema · Hipótesis · Diseño · Criterios de aceptación · QA checklist · Métrica a mover.
2. **`/bug-report`** — Título · Severidad · Device · Pasos de repro · Resultado esperado · Resultado actual · Screenshot · Branch/commit donde se detectó.
3. **`/campaign-brief`** — Objetivo · Persona · Canal · Creativity brief · KPI · Budget · Timeline · Next steps.

---

## 6. Vistas del dashboard "🏠 Home"

La página Home es puramente embeddings. No tiene contenido propio. Composición recomendada:

```
┌──────────────────────────────────────────────────────┐
│  FURBITO HQ  ·  Semana del 21 abr 2026                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  KPIs de la semana                                   │
│  [Chart de métricas semanales — 12 semanas]          │
│                                                      │
├──────────────────┬───────────────────────────────────┤
│  Release actual  │  Campañas live                    │
│  [Roadmap card]  │  [Campañas con status = Live]     │
│                  │                                   │
├──────────────────┼───────────────────────────────────┤
│  Content calendar (próx 7 días)                      │
│  [vista calendar]                                    │
├──────────────────────────────────────────────────────┤
│  Bugs P0/P1 abiertos   │  Feedback sin responder     │
└──────────────────────────────────────────────────────┘
```

---

## 7. Migración desde el Notion antiguo

Pasos concretos (1-2 horas):

1. **Archivar el contenido actual** en `📂 ARCHIVO / Notion v1 (abr 2026)`. No borrar.
2. **Crear la estructura top-level** (`📦 PRODUCT`, `📱 NATIVE APP`, `📈 MARKETING`, etc.).
3. **Crear las 8 bases de datos** con los esquemas de §2.
4. **Poblar Roadmap** con los hitos de las próximas 2 releases (v2.4 nativa alpha, v2.5 submisión stores).
5. **Volcar DOCS/*.md** como páginas linkeadas dentro de las secciones correspondientes:
   - `ARCHITECTURE.md` → `⚙️ ENGINEERING / 🏛️ Architecture`
   - `GUIA_MIGRACION_APP_NATIVA.md` → `📱 NATIVE APP / 📘 Playbook migración`
   - `WARROOM_ROADMAP_30D.md` → convertir a filas de `🗺️ Roadmap`
   - `PARAMETROS_JUEGO.md` → `⚙️ ENGINEERING / Parámetros`
   - `TIER1_IMPLEMENTACION.md` → archivar si ya está implementado
6. **Configurar permisos**: workspace privado para ti, invitar colaboradores a secciones concretas si aparecen.
7. **Configurar notificaciones**: una sola vez — "solo me notifico cuando me mencionan o cambian el status de algo que soy owner".

---

## 8. Integraciones recomendadas

| Integración | Para qué |
|-------------|----------|
| Notion ↔ GitHub | Enlazar PRs a features automáticamente |
| Notion ↔ Linear (opcional) | Si crece el equipo, Linear para ejecución, Notion para docs |
| Notion ↔ Posthog | Enviar KPIs automáticamente a `Métricas semanales` |
| Notion ↔ Slack/Discord | Canal de anuncios de releases |
| Zapier o n8n | Feedback de email/WhatsApp → fila nueva en `💬 Feedback entrante` |

---

## 9. Reglas de higiene semanal (15 min/semana)

Cada lunes:

1. Rellenar una nueva fila en `📊 Métricas semanales`.
2. Revisar Bugs abiertos — cerrar los ya resueltos, reasignar los huérfanos.
3. Mover Features `Review → Shipped` para todo lo merged.
4. Revisar Content Calendar — pasar a `Published` lo de la semana pasada y rellenar `Result`.
5. Vista "Release actual" → ¿vamos on-track? Si no, re-priorizar.

---

## 10. Próximos pasos inmediatos (hoy)

1. [ ] Aplicar la reconfiguración del workspace según §1–§2 (2-3 horas).
2. [ ] Copiar este documento como la primera página del nuevo `📦 PRODUCT` con el título "Notion HQ — guía de uso".
3. [ ] Volcar `MARKETING_PLAN.md` (hermano de este archivo) a la sección `📈 MARKETING / 🎯 Estrategia`.
4. [ ] Volcar `UI_AUDIT_PANTALLAS.md` como input de la DB `✨ Features` — cada mejora detectada es una feature candidata.
5. [ ] Crear las 3 personas iniciales en `👥 Personas` para empezar a escribir copy realista.

---

> **Documentos relacionados en el repo**:
> - [MARKETING_PLAN.md](./MARKETING_PLAN.md) — plan go-to-market detallado
> - [UI_AUDIT_PANTALLAS.md](./UI_AUDIT_PANTALLAS.md) — auditoría extensiva pantalla por pantalla
> - [FURBITO_DESIGN_SYSTEM.md](./FURBITO_DESIGN_SYSTEM.md) — spec del design system canónico
> - [GUIA_MIGRACION_APP_NATIVA.md](./GUIA_MIGRACION_APP_NATIVA.md) — guía técnica RN/Expo
