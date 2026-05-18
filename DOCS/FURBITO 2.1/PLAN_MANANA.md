# Plan de trabajo — 2026-05-18 (post A+B+C)

> Contexto: en una sola sesión cerramos las 3 opciones del plan anterior
> (Undo 15 min, Score de fiabilidad, Posts automáticos del muro) y el
> bug de creación de comunidades (Edge Function `community-create`).
> Migs 017/018 ya aplicadas en prod, edge functions deployadas.
> **El siguiente movimiento es el lanzamiento público — necesitamos
> datos reales** (ver §3 "Reconfiguración para lanzamiento" abajo).

---

## 0. Lo hecho esta sesión (2026-05-18)

- ✅ **`feat(auth)` crear comunidad** — bug crítico que llevaba semanas
  silencioso desde la mig 014: handleCreate hacía INSERT directo contra
  `communities` (sin policy anon). Edge Function `community-create`.
  Commit `e7d83cb`.
- ✅ **🅐 Undo 15 min** (Top 15 #11). Mig 017 + `unfinalize-match` +
  CTA con countdown.
- ✅ **🅑 Score de fiabilidad** (Top 15 #2). Helper + chip en perfil.
- ✅ **🅒 Posts automáticos del muro** (§16 gap). Mig 018 + 3 triggers
  + WallSystemPost.
- Commit `e4ef899` (A+B+C). Push pendiente (entorno actual sin creds
  GitHub — el usuario corre `git push origin main` en su terminal).

Tachado en docs: FEATURE_AUDIT Top 15 #2 y #11 marcados ✅, §16 gap 6
resuelto. PLAN_MANANA reescrito (este doc).

---

## 1. Recordatorio crítico — push pendiente

Antes de seguir con cualquier feature: hacer `git push origin main`
desde tu terminal. Sin eso, Vercel sigue con la versión vieja y los
usuarios no verán los cambios deployados en Supabase.

Si Vercel falla el build: lo más probable es la exclude de `DOCS/` en
[tsconfig.json](../../tsconfig.json) que añadimos en el commit `e7d83cb`
para arreglar el build roto desde el commit del paquete RN — ese arreglo
ya está en `main` local.

---

## 2. Lo que NO tocamos esta sesión y debería decidirse antes del lanzamiento

### Backlog Top 15 — quedan 11 P0

Pendientes con más impacto/coste razonable (en orden recomendado):

1. **#14 · Error tracking + analytics ligero** `@obs`
   **Por qué primero**: hoy estamos ciegos. El bug de "crear comunidad"
   estuvo roto semanas sin que lo viéramos. Lanzar al público sin esto
   es lanzar a oscuras. Mínimo viable: Sentry free tier (5k errors/mes)
   o un endpoint simple `error-log` en Supabase Edge Functions + tabla
   `client_errors`. Analytics: Plausible o un contador propio en
   `events`/`page_views`.
   **Coste estimado**: 2-4h para Sentry; 1 día para casero.

2. **#9 · Recovery key por jugador** `@auth`
   **Por qué**: hoy si pierdes el PIN o cambias de móvil → identidad
   perdida. Pre-launch este gap mata retención de día 1.
   **Coste**: 4-6h (columna + pantalla + flujo).

3. **#1 · Eventos recurrentes** `@evento`
   **Por qué**: dolor #1 del organizador semanal. Sin esto, el uso
   colapsa tras 3-4 semanas porque el organizador se cansa de crear
   "Partido del jueves" cada jueves.
   **Coste**: 1 día (mig + UI de patrón RRULE simplificado).

Resto del Top 15 P0 (#3, #4, #5, #6, #7, #8, #10, #12): no críticos
para soft launch, fundamentales para hard launch.

---

## 3. Reconfiguración para lanzamiento público

Este es el bloque nuevo. Si lanzamos esta semana, necesitamos:

### 3.1 Pre-flight técnico (must-do antes del primer link compartido)

- [ ] **Error tracking activo** (ver §2.1).
- [ ] **Probar end-to-end el flujo nuevo de usuario**:
      crear comunidad → crear admin → invitar jugador (compartir PIN
      comunidad) → onboarding del jugador → primer partido → finalizar
      → muro v1 + system posts. Lo ideal: tú haciendo el flujo en una
      ventana incógnito mientras grabas pantalla.
- [ ] **Health check del super-admin** (`/admin`). ¿Sigue funcionando
      tras la mig 014 y el cambio de auth a Supabase Auth? Si no, soft
      launch sin panel admin es un suicidio operativo.
- [ ] **Plan de rollback**: la mig 017 + 018 incluyen comentarios de
      rollback. Tener el SQL listo para pegar en SQL Editor si algo
      se rompe en prod tras lanzamiento.
- [ ] **`.env` de Vercel auditado**: confirmar que `NEXT_PUBLIC_*`
      apunta a prod y no a dev/staging.

### 3.2 Onboarding (mínimo viable para no perder al primer usuario)

- [ ] **Landing pública** (puede ser un README + screenshots en la
      home pública, no es necesario un sitio aparte). Pitch en 3 líneas
      + screenshot de PostMatchReveal + CTA "Crear comunidad".
- [ ] **Tutorial en-app primer-uso**: hoy hay `OnboardingOverlay` pero
      auditar que cubre los 3 momentos clave: (1) crear partido,
      (2) invitar jugadores con el PIN comunidad, (3) finalizar y ver
      el resultado.
- [ ] **FAQ visible**: ya existe `/ayuda` — revisar que está al día y
      añadir 2-3 entradas sobre el flujo de invitación.

### 3.3 Distribución (cómo llegan los primeros 10-50 usuarios)

Reusar el [MARKETING_PLAN.md](MARKETING_PLAN.md) §soft-launch. Si está
desactualizado, dedicarle 1h de revisión antes de empezar.

Canales propios primero (no compras de tráfico):
- WhatsApp grupos propios (3-5 organizadores que conozcas que sufren
  el dolor — son tu best-bet para feedback brutal en semana 1).
- Reddit r/futbol_es / r/pichanga / r/spain con post honesto "construyo
  esto, busco 5 grupos que lo prueben".
- Twitter/Bluesky build-in-public si tienes audiencia ahí.

**No** lanzar todavía en Product Hunt, App Stores, etc. — primero
validar con 5-10 grupos reales 2 semanas.

### 3.4 Lo que TIENES que mirar cada día durante la primera semana

- Errores en Sentry / dashboard de errores (#14).
- Cuántas comunidades creadas (`SELECT count(*) FROM communities WHERE
  created_at > now() - interval '1 day'`).
- Cuántos partidos finalizados — la métrica norte (sin esto no hay
  loop social).
- Si hay undo activado — útil para entender qué pasa con los admins.
- Posts en el muro (humanos + sistema).

Quedamos sin dashboard, lo ideal sería **un SQL pinned en Supabase**
con esas 5 cifras. 30 min de trabajo.

---

## 4. Decisiones que no son mías

Estas las tienes que tomar tú antes de lanzar — yo solo apunto las
opciones:

- **¿Limitar a una región?** Si quieres feedback en castellano, soft
  launch España + LATAM. Si quieres más volumen de tests, abre.
- **¿Pricing futuro?** Plan: "free hasta X comunidades" / "premium
  por comunidad" / "por jugador". Decisión que cambia onboarding
  copy ("crea gratis tu comunidad para siempre" suena distinto a
  "prueba 30 días").
- **¿Borrar el `/admin/login` con PIN público o esperamos?** Hoy
  coexisten dos métodos de auth admin (PIN público + Supabase Auth
  de la mig 013). Pre-launch: limpiar el viejo o documentar
  expresamente que está deprecado.

---

## 5. Lo que NO hacemos esta semana

- No tocar el muro v2 (imágenes, push, menciones). Los system posts
  ya recuperan la parte automatizada — esperar datos de uso.
- No empezar nada de "wall promoted to tab" — esperar datos.
- No `system_level_up` aún — pendiente de la mig 019 con comparación
  pre/post nivel en `finalize-match`.
- No añadir librerías pesadas (`framer-motion`, `react-query`, ORMs).
  Sigue siendo Next + CSS + Supabase.

---

## 6. Si sobra tiempo

Mini-QoL del muro que no entró en V1 (ya identificados en el viejo
plan):

- [ ] Avatar placeholder con iniciales para jugadores borrados.
- [ ] Hora absoluta en tooltip del timestamp relativo.
- [ ] Tecla Cmd/Ctrl+Enter para enviar en composer.
- [ ] Optimistic insert al publicar.

Pero **antes que cualquiera de estos**: hacer #14 (observabilidad).
Tener mini-QoL sin ver errores en prod es polish sobre arena movediza.
