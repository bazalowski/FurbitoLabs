# FURBITO — Auditoría funcional (features) y cómo mejorarlas

> **Objetivo**: mapear las **funcionalidades** de FURBITO (no la UI — eso está en [UI_AUDIT_PANTALLAS.md](UI_AUDIT_PANTALLAS.md)) y dejar para cada módulo:
> - Qué hace hoy (comportamiento observable + dónde vive en el código).
> - Fortalezas a preservar.
> - Gaps funcionales, riesgos y deuda de producto.
> - **Mejoras propuestas** priorizadas P0/P1/P2 con impacto/coste estimado.
>
> Cada mejora lleva un tag de módulo (`@auth`, `@evento`, `@equipos`, …) para trasladarla directa a la DB `✨ Features` de Notion y emparejarla con KPI del plan de marketing.
>
> **Convención**:
> - 🟢 **Fortaleza** — comportamiento que hay que preservar en la migración nativa
> - 🔴 **Gap** — falta o riesgo funcional concreto
> - ✨ **Propuesta** — mejora priorizada
> - 🧪 **Experimento** — algo a validar antes de construir
> - ⚙️ **Técnico** — deuda / cambio interno sin valor visible inmediato
>
> **Prioridades**:
> - **P0**: bloquea lanzamiento hard, retención o claim de marketing.
> - **P1**: mueve KPIs medibles (asistencia, MVPs, comparticiones).
> - **P2**: deleite, nicho o cuando el P0/P1 esté hecho.

---

## Índice

1. [Autenticación y acceso](#1-autenticación-y-acceso)
2. [Comunidades y administración](#2-comunidades-y-administración)
3. [Jugadores y perfiles](#3-jugadores-y-perfiles)
4. [Eventos / partidos (ciclo de vida)](#4-eventos--partidos-ciclo-de-vida)
5. [Confirmaciones de asistencia](#5-confirmaciones-de-asistencia)
6. [Generador de equipos](#6-generador-de-equipos)
7. [Registro de resultado y stats](#7-registro-de-resultado-y-stats)
8. [MVP (nominación y votación)](#8-mvp-nominación-y-votación)
9. [Valoración entre jugadores (5 skills)](#9-valoración-entre-jugadores-5-skills)
10. [Puntuación Comunio y tiers de partido](#10-puntuación-comunio-y-tiers-de-partido)
11. [XP, niveles, rachas e historial](#11-xp-niveles-rachas-e-historial)
12. [Badges y vitrina](#12-badges-y-vitrina)
13. [Ranking de comunidad](#13-ranking-de-comunidad)
14. [Pistas y mapa](#14-pistas-y-mapa)
15. [Notificaciones push + recordatorios](#15-notificaciones-push--recordatorios)
16. [Feed de actividad](#16-feed-de-actividad)
17. [Realtime y sincronización](#17-realtime-y-sincronización)
18. [PWA / offline / migración nativa](#18-pwa--offline--migración-nativa)
19. [Observabilidad, seguridad y admin tooling](#19-observabilidad-seguridad-y-admin-tooling)
20. [Top 15 mejoras priorizadas](#20-top-15-mejoras-priorizadas)
21. [Cómo ver esta forma de trabajo (pregunta del usuario)](#21-cómo-ver-esta-forma-de-trabajo-pregunta-del-usuario)

---

## 1. Autenticación y acceso

**Código**: [src/lib/supabase/auth.ts](../../src/lib/supabase/auth.ts), [src/stores/session.ts](../../src/stores/session.ts), [src/app/page.tsx](../../src/app/page.tsx).

**Comportamiento actual**:

- Sin email ni contraseña. Gate inicial con 2 cards: *usuario nuevo* / *tengo PIN*.
- Roles: `guest`, `player`, `admin`. Admin se promociona desde Ajustes o por PIN público en env (`NEXT_PUBLIC_ADMIN_PIN`).
- Sesión vive en `zustand` con persistencia en `localStorage`.
- Generación de `player_code` con `genPlayerCode()` para identificar al jugador dentro de una comunidad.

### 🟢 Fortalezas

- Fricción cero de onboarding — encaja con el insight principal de [MARKETING_PLAN.md](MARKETING_PLAN.md) (el organizador no quiere pedirle a su grupo "creaos una cuenta").
- Roles claros y pocos — fácil de razonar.

### 🔴 Gaps

1. **No hay forma de recuperar acceso** si el usuario pierde el PIN del jugador o cambia de dispositivo: el `localStorage` es la única identidad.
2. **Dos dispositivos = dos identidades**. Un jugador en móvil + tablet cuenta stats por separado y no puede consolidarlas.
3. **El admin PIN es público** (`NEXT_PUBLIC_*`). Sirve para dev, es un riesgo de escalada en prod.
4. **No hay "kick" de sesión**: si un admin pierde el teléfono, no hay manera de revocarle el acceso desde otra sesión.
5. **No hay rate-limit** de intentos de PIN ni lockout. PIN de 4 dígitos = 10k combinaciones — bruteable por un actor determinado.

### ✨ Propuestas

- **P0 · Recovery key por jugador** `@auth`
  Al crear jugador, mostrar un "código de recuperación" de 12 caracteres (ej. `FB-7A3K-9XQ2-BNM4`). Si pierdes el PIN o cambias de móvil, lo ingresas y recuperas tu `player_id`. Sin email y sin servidor de auth. Coste bajo (es una columna + pantalla de recuperación), impacto alto en retención post-cambio-de-móvil.

- **P0 · Mover admin PIN a per-community + rotable** `@auth`
  Sustituir `NEXT_PUBLIC_ADMIN_PIN` por `communities.admin_pin` (columna). Cada comunidad rota el suyo desde Ajustes. Resuelve el riesgo global + casos "mi amigo no debería ser admin de mi grupo".

- **P1 · Device pairing QR** `@auth`
  Desde un dispositivo logueado, generar un QR efímero (60s, firmado) que el segundo dispositivo escanea y queda linkeado al mismo `player_id`. Sin cuentas, pero con multi-dispositivo real. Aumenta MAU activos por jugador.

- **P1 · Rate-limit de PIN** `@auth`
  3 intentos fallidos → bloqueo 30s en cliente + log server-side. Prevenir bruteforce en comunidades públicas.

- **P2 · Magic link opcional** `@auth`
  Para el admin principal (solo), opción de asociar un email para recovery vía magic link. No es una cuenta — es una "cerradura extra". Mantiene la promesa "sin cuentas" para jugadores.

---

## 2. Comunidades y administración

**Código**: [src/hooks/useCommunity.ts](../../src/hooks/useCommunity.ts), [src/app/admin/[cid]/page.tsx](../../src/app/admin/[cid]/page.tsx), [src/app/[cid]/ajustes/page.tsx](../../src/app/[cid]/ajustes/page.tsx).

**Comportamiento actual**:

- Una comunidad tiene PIN de 4 dígitos, color (`--comm-color`), `comm_admin_id` (primer admin) y `admin_ids[]` (hasta 3).
- Admin panel en `/admin/[cid]`: vista de jugadores, eventos, stats básicas.
- Desde Ajustes, el admin primario puede promocionar hasta 3 admins.
- Un jugador puede pertenecer a **una** comunidad (no hay multi-tenant por jugador).

### 🟢 Fortalezas

- El color por comunidad (propagado en CSS vars) da un "skin" barato y muy efectivo — las comunidades se apropian de la app.
- Jerarquía `admin primario + delegados` está bien pensada.

### 🔴 Gaps

1. **Un jugador = una comunidad**. Realidad: la gente juega en el del curro y en el del barrio. Hoy se duplica identidad.
2. **No hay papel de "coach"** ni roles más granulares (solo admin/player). Sin esto, el coach sin perfil de jugador no tiene lugar natural.
3. **No hay "archivar" comunidad**. Cuando un grupo muere, queda de zombie.
4. **No hay traspaso de admin primario**. Si el creador deja de jugar, no puede ceder la comunidad.
5. **No hay límites/quotas** (número de jugadores, eventos/mes). Bien para hobby, mal cuando se monetice.

### ✨ Propuestas

- **P0 · Multi-comunidad por jugador** `@comunidad`
  Un switcher en Header que muestre tus comunidades (misma identidad, mismo `player_id` "maestro"). Requiere refactor de `session` a un map `{cid: player_id}`. Desbloquea segmento grande (gente del curro + grupo de amigos).

- **P0 · Traspaso de admin primario** `@comunidad`
  Botón "ceder comunidad" en Ajustes. Requiere confirmación del receptor con PIN. Baja fricción, crítico para longevidad.

- **P1 · Archivar/desarchivar comunidad** `@comunidad`
  Si nadie registra partido en 60 días, ofrecer archivar. Archivada = solo lectura, no aparece en el switcher.

- **P1 · Rol "coach" (read + comment, no juega)** `@comunidad`
  Usuario que ve todo pero no aparece en rankings ni equipos. Persona clara en [MARKETING_PLAN.md](MARKETING_PLAN.md) "entrenador amateur".

- **P2 · Plantillas de comunidad** `@comunidad`
  Al crear, preguntar "¿5v5 / 7v7 / 11v11?" y "¿con portero dedicado?" → precargar `max_jugadores`, badges aplicables, si la porteria_cero tiene sentido, etc. Reduce fricción inicial y el "mi app no encaja".

- **P2 · Sub-grupos dentro de la comunidad** `@comunidad`
  Ej: "los viernes" vs "los domingos". Los stats se separan. Escala para comunidades grandes donde la mitad nunca coincide.

---

## 3. Jugadores y perfiles

**Código**: [src/hooks/usePlayers.ts](../../src/hooks/usePlayers.ts), [src/app/[cid]/jugadores/](../../src/app/[cid]/jugadores/), [src/components/players/PlayerCard.tsx](../../src/components/players/PlayerCard.tsx), [src/components/players/PlayerTimeline.tsx](../../src/components/players/PlayerTimeline.tsx), [src/components/players/PointsEvolutionChart.tsx](../../src/components/players/PointsEvolutionChart.tsx).

**Comportamiento actual**:

- Perfil con avatar (Supabase Storage), nombre, posición (opcional), comunidad, color.
- Stats: `partidos`, `goles`, `asistencias`, `mvps`, `partidos_cero`, `xp`, badges, rating medio.
- Nuevo: tab **Puntos** con hero + sparklines + gráfica de evolución (según [memoria proyecto](../../.claude/projects/-home-bazalowski-FurbitoLabs/memory/project_redesign.md)).
- Historial de partidos en Timeline, con filtros recientes.

### 🟢 Fortalezas

- Perfil es la **moneda emocional** del producto. El hero de puntos + sparkline es el mejor surface para engagement diario.
- Stats redundantes entre sí (XP + puntos + rating + badges) permiten que cada perfil "brille por algún lado" — clave para no desmotivar a los flojos.

### 🔴 Gaps

1. **No hay forma de decir "esta foto NO soy yo"**. Avatar uploadeable, pero sin report/moderación.
2. **No hay nickname separado del nombre** (útil cuando dos "Javis" en la misma comunidad).
3. **Posición es texto libre** — ruido. Ni se usa para balancear equipos ni para rankings.
4. **No hay histórico de cambios** del perfil (cambio de nombre, color) → si alguien se tokea la identidad post-migración, no hay rastro.
5. **No hay comparador 1v1** entre 2 jugadores (clave social).
6. **El rating medio** es pasado crudo sin intervalo de confianza — con 2 votos, un 5.0 pinta lo mismo que con 50.

### ✨ Propuestas

- **P0 · Comparador 1v1** `@perfil`
  Desde cualquier PlayerCard, "Comparar con…" → pantalla split con las stats clave lado a lado + sparkline superpuesto + H2H (cuántos partidos juntos, cuántas victorias con el mismo color). Material viral para compartir.

- **P1 · Skill trend últimos 30 días** `@perfil`
  Debajo del radar de skills (ataque/defensa/…), indicador `↑ +0.4 ataque` si el rating ha subido respecto al mes anterior. Recompensa el progreso, no solo el nivel.

- **P1 · Intervalo de confianza visible** `@perfil`
  "4.6 ⭐ (12 votos)" en lugar de "4.6 ⭐" a secas. Y si hay <5 votos, mostrar "aún calibrando" en gris. Evita inflar egos con muestras minúsculas.

- **P1 · Nickname y alias** `@perfil`
  Campo separado del nombre legal. El alias aparece en equipos/ranking, el nombre legal solo en Ajustes.

- **P2 · Moderación básica de avatar** `@perfil`
  Botón "reportar" → flag en base + notif al admin primario. Prevenir casos de fotos que no son del jugador.

- **P2 · Historial de ediciones de perfil** `@perfil`
  Tabla `player_edits` con before/after. No UI; sólo se usa si se reporta un comportamiento.

---

## 4. Eventos / partidos (ciclo de vida)

**Código**: [src/hooks/useEvents.ts](../../src/hooks/useEvents.ts), [src/components/events/EventForm.tsx](../../src/components/events/EventForm.tsx), [src/app/[cid]/partidos/](../../src/app/[cid]/partidos/).

**Comportamiento actual**:

- Estados: `creado` → (confirmaciones) → `con equipos` → (jugado) → `finalizado`.
- Campos: título, tipo (`partido`/`entreno`/`torneo`), fecha, hora, lugar, `max_jugadores`, notas, `pista_id`, `abierto` (público a la comunidad).
- Solo admin crea y edita. Solo admin finaliza.
- Tabs del detalle: `convocados` · `equipos` · `resultado`.

### 🟢 Fortalezas

- Ciclo claro y corto — un organizador puede llevar un partido de A a Z sin salir.
- `abierto` / `cerrado` cubre el caso "solo los fijos" vs "cualquiera de la comunidad apúntese".

### 🔴 Gaps

1. **No hay eventos recurrentes**. Grupos con partido fijo (cada martes 20h) lo recrean a mano cada semana — fricción brutal.
2. **No hay cupo + lista de espera**. `max_jugadores` se respeta por UX, pero no hay waitlist automática si alguien confirma después.
3. **No hay cancelación con motivo** visible a los convocados — si lo cancelas borras, y se pierden las confirmaciones.
4. **No hay re-asignación** de equipos después de lesión/ausencia en el propio partido.
5. **No hay comentarios / chat** en el evento (está en [WARROOM_ROADMAP_30D.md](../WARROOM_ROADMAP_30D.md) semana 3 — sigue sin aterrizar).
6. **No hay export a calendario** (.ics) ni deep-link a Google Maps de la pista.
7. **No hay coste/monetización** del partido (pista que se paga a escote).

### ✨ Propuestas

- **P0 · Eventos recurrentes** `@evento`
  Al crear, opción "repetir cada martes a las 20:00 hasta…". Se materializan como N eventos reales (no virtuales) al guardar — así confirmaciones y stats no se complican. Mata el punto de dolor más cantado para organizadores.

- **P0 · Lista de espera con promoción automática** `@evento`
  Si `confirmed >= max_jugadores`, nuevas confirmaciones caen en `waitlist`. Cuando alguien cambia de `si` a `no`, promover el primero de waitlist y notificarle.

- **P0 · Export a calendario (.ics) + deep-link maps** `@evento`
  Botón "Añadir a mi calendario" genera `.ics` on-the-fly y abre. "Cómo llegar" con `geo:` / Google Maps URL desde `pista.lat/lng`. Coste mínimo, reduce no-shows ~10-15% según datos públicos de otros productos.

- **P1 · Cancelación con motivo + notificación a convocados** `@evento`
  "Cancelar por lluvia" / "Cancelar por falta de jugadores" → mensaje fijo en el evento, status `cancelled`, push a confirmados.

- **P1 · Gastos del partido a escote** `@evento`
  Campo `coste_total` (ej. 30€ la pista). Se reparte entre confirmados `si` al finalizar. Marca quién ha pagado. No es procesador de pago — es contador. Útil y diferencial vs WhatsApp + Excel.

- **P1 · Comentarios del evento** `@evento`
  Hilo simple con texto + emoji. No es chat general — es específico del partido. Registra excusas ("llego 10 min tarde", "traigo 3 balones").

- **P2 · "Partido amistoso" abierto a invitados** `@evento`
  Link compartible `furbito.app/invite/<token>` que permite a alguien fuera de la comunidad ocupar una plaza solo para ese partido. Stats no cuentan para ranking de la comunidad.

- **P2 · Re-asignación de equipos en vivo** `@evento`
  En la pestaña Equipos del detalle, botón "alguien no ha venido" → recoloca y recalcula balance en vivo.

---

## 5. Confirmaciones de asistencia

**Código**: [src/app/[cid]/partidos/[eid]/page.tsx](../../src/app/[cid]/partidos/[eid]/page.tsx) L69-96.

**Comportamiento actual**:

- 3 estados: `si` / `no` / `quiza`.
- Cualquier jugador de la comunidad puede confirmar por sí mismo.
- Admin puede forzar cualquier estado para cualquier jugador.
- Realtime: cualquier cambio se propaga al resto.

### 🟢 Fortalezas

- Tres estados (no dos) refleja la realidad social ("probablemente voy" es información útil).
- Admin-override es realista: muchos grupos tienen un fijo que nunca usa la app y alguien le confirma por él.

### 🔴 Gaps

1. **No hay deadline de confirmación**. El admin no puede forzar "confirma antes del viernes 20h o pasas a `quiza`".
2. **No hay recordatorio automático** a los `quiza` o a los que no han respondido.
3. **No hay historial de confirmaciones** a nivel perfil. "Este es un fiable" vs "cancela siempre" no aflora.
4. **No hay veto por repetición de no-show**. Si alguien dice `si` y no aparece 3 veces, nada cambia — debería haber alguna fricción social.
5. **No hay "+1 invitado"**. "Voy y traigo a un primo" se resuelve fuera de la app.

### ✨ Propuestas

- **P0 · Score de fiabilidad por jugador** `@confirmaciones`
  Métrica `reliability = confirmados_si_y_fueron / confirmados_si` sobre últimos 20 partidos. Se muestra en el perfil como una etiqueta: `Fiable 92%` / `Irregular 60%`. No penaliza, informa. Gran herramienta social.

- **P0 · Push recordatorio a los que no han respondido** `@confirmaciones`
  24h antes del evento, lista de jugadores sin confirmación → push "Aún no has dicho si vienes al partido del martes". Esperable aumento de tasa de confirmación.

- **P1 · Deadline de confirmación + auto-lock** `@confirmaciones`
  Campo `confirm_deadline` en el evento. Pasada la hora, las confirmaciones quedan bloqueadas (admin puede forzar). Útil para eventos con coste.

- **P1 · "+1 invitado"** `@confirmaciones`
  Cada `si` puede añadir 0-2 invitados (nombres de texto, sin perfil). Cuentan para el cupo. Reflejar en equipos como NPCs sin stats.

- **P2 · Racha de asistencia (positiva)** `@confirmaciones`
  "7 partidos seguidos sin faltar". Badge existente (`racha_*`) solo mide victorias — añadir una familia equivalente para asistencia pura.

---

## 6. Generador de equipos

**Código**: [src/lib/game/teams.ts](../../src/lib/game/teams.ts), [src/components/players/TeamGenerator.tsx](../../src/components/players/TeamGenerator.tsx).

**Comportamiento actual**:

- 2 modos: **balanced** y **random** (antes existía `snake`, ya no está en el dispatcher).
- Balanced: 5 skills (ataque, defensa, técnica, velocidad, empeño) → `teamPower` con pesos (rival 0.45 / tec 0.20 / synergy 0.35) + greedy draft con jitter + swap pairwise hasta 40 iter.
- Balance visual: 🟢 ≤5% · 🟡 ≤15% · 🟠 ≤25% · 🔴 >25%.
- Jitter garantiza que "Regenerar" produce combinaciones distintas.

### 🟢 Fortalezas

- El modelo teórico es **bueno** y único en el espacio: rival (atk·def) + synergy (vel·emp) + tec aditivo, con **medias geométricas** que penalizan descompensación. No es "suma de estrellas y parte en dos".
- El jitter resuelve la frustración clásica "el balanceador me da siempre los mismos equipos".

### 🔴 Gaps

1. **Sin votos, todos son "neutros" (2.5)**: las primeras semanas de una comunidad, el balanceador es equivalente a random. El producto tiene que sobrevivir ese valle.
2. **No hay constraints por posición**: 2 porteros en un equipo y 0 en el otro es posible.
3. **No hay "fijar parejas" ni "separar enemigos"** (Pedro y Juan siempre juntos; Marcos y Ander nunca).
4. **No hay memoria de emparejamientos**: mismos equipos repetidos 5 partidos seguidos = aburrimiento, aunque matemáticamente sean los más equilibrados.
5. **La métrica `diffPct`** usa `max(pA, pB)` como base — para valores pequeños infla el % y asusta al usuario sin motivo.
6. **No hay explicación del porqué** (si dice "desnivelado", no dice *por qué* — atk, def, synergy…). Oportunidad de pedagogía.

### ✨ Propuestas

- **P0 · Arranque en frío: cuestionario express** `@equipos`
  Cuando la comunidad tiene <10 votos totales, ofrecer al admin un mini-cuestionario ("valora a cada jugador de 1 a 5 en ataque y defensa — 30s") para sembrar el balanceador. Sin esto, la promesa "equipos equilibrados" se incumple los primeros partidos.

- **P0 · Constraints duros: parejas/enemistades/portero** `@equipos`
  UI en TeamGenerator para marcar:
  - "jugadores que van siempre juntos"
  - "jugadores que nunca juntos"
  - "porteros" (fuerza 1 por equipo si hay 2+)
  El algoritmo los respeta antes de optimizar el power.

- **P0 · Memoria de emparejamientos recientes** `@equipos`
  Penalizar suave (0.05 del power) las parejas que han jugado juntas en los últimos 3 partidos. Rotación social garantizada sin sacrificar balance.

- **P1 · Explicación del balance** `@equipos`
  Debajo de la pastilla 🟠 "Desnivelado", mini-texto: *"Equipo A domina en defensa (+3.2) pero B tiene más técnica (+2.1)"*. Convierte una métrica opaca en conversación.

- **P1 · Modo "equipos históricos"** `@equipos`
  Reutilizar el split de un partido anterior (ej. "el del martes pasado"). Resuelve "hoy faltan 2, no queremos rehacer desde cero".

- **P1 · `diffPct` calibrado** `@equipos`
  Usar `(A + B) / 2` como base (o `max(1, media)`), no `max(A, B)`. Elimina falsos rojos en comunidades con rating bajo.

- **P2 · Modo "snake" reactivado + modo "capitanes"** `@equipos`
  Snake = draft serpiente puro. Capitanes = dos usuarios eligen a mano. El clásico-clásico, por nostalgia y para darle variedad al admin.

- **P2 · Export del gráfico de equipos** `@equipos`
  Botón "compartir por WhatsApp" que genera PNG con los dos equipos, colores de comunidad, balance. Acelera el flujo "organizo partido → copio a grupo de WhatsApp" que hoy está fragmentado.

---

## 7. Registro de resultado y stats

**Código**: [src/app/[cid]/partidos/[eid]/resultado/page.tsx](../../src/app/[cid]/partidos/[eid]/resultado/page.tsx), [src/components/events/PostMatchRating.tsx](../../src/components/events/PostMatchRating.tsx).

**Comportamiento actual**:

- Stepper 3 pasos: `marcador` → `stats` → `resumen`.
- Stats por jugador: goles, asistencias, `porteria_cero` (contador, no boolean — ahora cuenta cuántas porterías mantiene a cero en rotación), `parada_penalti`, hazañas (chilena, olímpico, tacón).
- Al confirmar: calcula XP (`calcXP`), detecta badges (`detectBadges` con ctx: score, meta, history, pistas), actualiza `players`, marca `event.finalizado = true`, emite notificaciones push.
- Puntos Comunio se calculan al vuelo a partir de las stats crudas (no se persisten como columna — se derivan).

### 🟢 Fortalezas

- El stepper guía al admin; muy difícil meter un resultado a medias.
- `porteria_cero` como contador en lugar de boolean (según [memoria](../../.claude/projects/-home-bazalowski-FurbitoLabs/memory/project_redesign.md)) maneja bien la rotación de porteros.
- `detectBadges` con contexto histórico es **ambicioso y bien hecho** — rachas, pistas, horario, victorias se calculan como un todo.
- Todas las puntuaciones se derivan de stats crudas → un día podemos recalcular históricos si cambian fórmulas.

### 🔴 Gaps

1. **No hay Undo por si el admin mete el resultado mal**. Solo puede editar el evento (y eso no revierte el XP/badges ya otorgados).
2. **El cálculo corre 100% en cliente**. Un admin con mala red puede duplicar stats si retoca o si falla la escritura parcialmente.
3. **No hay validación cruzada**: puedes marcar 3-1 pero que la suma de goles individuales no encaje.
4. **No hay stats opcionales "pro"** (amarillas, rojas, posición jugada, minutos) — está bien no tenerlas, pero cortan a comunidades más serias.
5. **El `isMVP` que entra a `detectBadges`** viene del MVP **manual** del admin, no del elegido por votos. Si la comunidad usa votos, algunos badges de MVP pueden no ajustar.
6. **Goles/asistencias no se atribuyen a un equipo en específico** en la stats fase — se deduce por `playerTeam`. Si el admin se lía en la asignación de jugador a equipo en la pestaña Equipos, todo el cálculo está sesgado.

### ✨ Propuestas

- **P0 · Ventana de undo 15 min** `@resultado`
  Tras finalizar, banner "Resultado guardado — deshacer (15:00)". Si deshacen, se revierten match_players, stats agregadas y badges otorgados. Reduce el miedo al "botón irreversible".

- **P0 · Validación de consistencia** `@resultado`
  Si `sum(goles equipo A) ≠ golesA`, aviso rojo + bloqueo del paso 3 hasta resolver. Evita stats corruptas.

- **P1 · Mover cálculo de badges/XP a Edge Function** `@resultado`
  El cliente manda stats crudas; la función calcula XP, detecta badges, actualiza `players` en transacción. Previene dobles escrituras, centraliza la lógica (clave para la migración nativa — el mismo endpoint sirve web y RN).

- **P1 · Stats "pro" opcionales por comunidad** `@resultado`
  Toggle en Ajustes: "mostrar amarillas y rojas", "mostrar minutos", "mostrar posición jugada". Desactivado por defecto.

- **P2 · Stats rápidas en vivo durante el partido** `@resultado`
  Pantalla "registrar en vivo" que va acumulando goles/asist con taps grandes. Al terminar, el resumen ya está casi relleno. Solo tiene sentido si el que registra no juega — flag en `Ajustes`.

---

## 8. MVP (nominación y votación)

**Código**: [src/hooks/useMvpVotes.ts](../../src/hooks/useMvpVotes.ts), [src/hooks/usePendingMvpVotes.ts](../../src/hooks/usePendingMvpVotes.ts), [src/components/events/MvpVoting.tsx](../../src/components/events/MvpVoting.tsx), [src/lib/game/mvp-finalize.ts](../../src/lib/game/mvp-finalize.ts).

**Comportamiento actual**:

- Cada jugador del partido puede votar a 1 MVP (no puede votarse a sí mismo).
- Admin cierra la votación; el más votado se marca como `event.mvp_id`.
- `pendingCount` surface en Home para recordar que tienes MVPs sin votar.
- Badge `primer_mvp`, `mvp_3`, `mvp_5`, … basados en `player.mvps`.

### 🟢 Fortalezas

- El MVP es **el mejor motor social** del producto. La votación pendiente pendiente en Home es la mejor notificación pasiva.
- `finalizeMvpByVotes` permite que el admin no elija a dedo (democracia).

### 🔴 Gaps

1. **No hay empate resuelto con criterio** (goles, asist, rating?). Queda a decisión del admin.
2. **No hay "votación fantasma"** — si cierras y hay 0 votos, no pasa nada. Podría auto-seleccionar el top de puntos Comunio.
3. **No hay histórico de MVPs cerrados por voto vs manual** — interesante para auditoría y confianza.
4. **El push "te han elegido MVP"** está definido en tipos (`mvp_selected`) pero no está claro si se emite siempre al cerrar.
5. **Solo 1 MVP por partido**. En un 10v10 con partidazo, limita la celebración.

### ✨ Propuestas

- **P0 · Regla de desempate explícita** `@mvp`
  Si empate entre N jugadores: desempatar por puntos Comunio del partido > goles > asistencias > rating histórico. Mostrar en UI "resuelto por goles del partido". Evita el "el admin elige a su amigo".

- **P0 · Auto-selección si 0 votos tras 48h** `@mvp`
  Si nadie vota en 48h, el sistema fija al de más puntos Comunio del partido como MVP y notifica. Mantiene la velocidad del ciclo semanal.

- **P1 · MVP por categoría (opt-in por comunidad)** `@mvp`
  Además del MVP general: "Mejor defensa", "Mejor gol" (con campo libre para anécdota). Aumenta el número de premios sociales sin devaluar el MVP.

- **P1 · Push "eres MVP" con CTA a compartir** `@mvp`
  Al recibir el push, tap → pantalla "comparte tu MVP" con la tarjeta ya generada (nombre, partido, puntos). Convierte el logro en viralidad.

- **P2 · Anti-voto-compinche** `@mvp`
  Detectar si el jugador X vota siempre al jugador Y (>70% de partidos juntos) — mostrar un icono `🤝` al admin (no penalizar, solo informar). Saludable para comunidades grandes.

---

## 9. Valoración entre jugadores (5 skills)

**Código**: [src/hooks/useVotes.ts](../../src/hooks/useVotes.ts), [src/app/[cid]/valorar/page.tsx](../../src/app/[cid]/valorar/page.tsx), [src/lib/game/scoring.ts](../../src/lib/game/scoring.ts) L118-143.

**Comportamiento actual**:

- Cada jugador puede valorar a otros en 5 skills (1-5): ataque, defensa, técnica, velocidad, empeño.
- Voto único por par (votante, votado) — se actualiza si revota.
- Media simple por skill, y media global.
- Feeds al balanceador (`teams.ts`) y al perfil.

### 🟢 Fortalezas

- 5 dimensiones capturan la realidad del futbolista amateur mejor que "score único".
- La UI es 5 sliders — barata y rápida.

### 🔴 Gaps

1. **Voto es público-equivalente**: no es anónimo, y aunque no se muestra quién votó qué, la desconfianza existe. Esto baja la tasa de votos.
2. **No hay pesaje temporal**: un voto de hace 2 años pesa igual que uno de ayer. Jugadores que han mejorado/empeorado quedan anclados.
3. **No hay incentivo a votar**. La ratio "gente que vota / gente que podría" será bajísima sin push + gamificación.
4. **No hay descubrimiento**: el jugador no sabe a quién le falta por votar, ni tiene una "sesión de 30s para ponerse al día".
5. **Las 5 dimensiones no están explicadas** en la UI — "empeño" significa cosas distintas para cada uno.

### ✨ Propuestas

- **P0 · Modo "sesión de valoración post-partido"** `@valorar`
  Al terminar un partido, push "valora a tus compañeros del partido de hoy (30s)". Abre flow con SOLO los 9 del partido, un slide por jugador, swipe para siguiente. Espera +3x en tasa de voto.

- **P0 · Pesaje temporal (half-life 90 días)** `@valorar`
  Un voto de hace 90 días pesa 0.5, 180 días 0.25, etc. Mantiene el rating vivo y recompensa la mejora. Implementación: `votes.created_at` y pesos calculados en `getPlayerRating`.

- **P1 · Definiciones visibles al votar** `@valorar`
  Tooltip / microcopy debajo de cada slider:
  - *Ataque*: desborde, chut, definición
  - *Defensa*: anticipación, robo, posicionamiento
  - *Técnica*: control, pase, regate
  - *Velocidad*: recorrido, arranque
  - *Empeño*: actitud, pelea, cierre

- **P1 · Badge "votador frecuente"** `@valorar`
  Aparte de `votos_dados_10/50/100` (que ya existen), XP extra por votar en las primeras 24h tras un partido. Crea ritual.

- **P2 · Anonimización fuerte opcional** `@valorar`
  Toggle por comunidad: "los votos individuales no son rastreables ni siquiera por admin". Elimina suspicacia (a costa de perder auditoría de voto-compinche).

---

## 10. Puntuación Comunio y tiers de partido

**Código**: [src/lib/game/scoring.ts](../../src/lib/game/scoring.ts) L1-95.

**Comportamiento actual**:

- Puntuación tipo Comunio por partido: `partido=3` + `gol=2` + `asist=1` + `porteria_cero=2 (por cada)`.
- Tiers por puntos:
  - ≥20 → **Leyenda** (multigradient)
  - ≥11 → **Excelente**
  - ≥8 → **Bueno**
  - ≥5 → **Regular**
  - <5 → **Mal partido**
- Cada tier tiene color, gradient, glow, fg — integrado en cards y chips.

### 🟢 Fortalezas

- Fórmula **simple y aditiva** — fácil de entender para el usuario, fácil de ajustar para nosotros.
- Los 5 tiers con tratamiento visual premium resuelven el "gratificación instantánea post-partido".

### 🔴 Gaps

1. **Cero puntos por perder / +nada por ganar**. El resultado del equipo no entra en la puntuación individual. Un jugador puede ser "leyenda" en 10 derrotas seguidas.
2. **No hay penalización** por amarillas, autogoles, o directamente partidos malos (faltar, etc.).
3. **El tier max ≥20 es alcanzable** con 5 goles en un partido o 2 goles + 2 asist + 2 porterías a cero — inflable con rotaciones de portero largas.
4. **No hay promedio de puntos**. Ranking por puntos totales premia al que juega más, no al que rinde mejor.
5. **No hay "mejor partido de la temporada"** surface agregado.

### ✨ Propuestas

- **P1 · Bonus por victoria (+2) / penalización por derrota (0)** `@puntos`
  Añadir un multiplicador ligero por resultado. Sin romper el "puedes ser leyenda aunque pierdas" pero recompensando el esfuerzo colectivo.

- **P1 · Puntos por partido (media)** `@puntos`
  Nueva métrica `ppp = puntos_total / partidos`. Segunda columna en ranking. Evita el "siempre gana el que más juega".

- **P1 · Cap de porteria_cero por partido** `@puntos`
  Limitar a +2 porterías a cero contabilizadas en un mismo partido. Previene inflación en partidos con rotación extrema de portero.

- **P1 · "Best game" del perfil** `@puntos`
  Card en el perfil: "Tu mejor partido: 24 pts el 12 feb vs La Tejera". Con link al match.

- **P2 · Comparativa de tier por jugador vs media de la comunidad** `@puntos`
  "70% de tus partidos son ≥Bueno — media de la comunidad: 55%". Contexto relativo vende más que absoluto.

---

## 11. XP, niveles, rachas e historial

**Código**: [src/lib/game/levels.ts](../../src/lib/game/levels.ts), [src/lib/game/badges.ts](../../src/lib/game/badges.ts) L276-285 (`calcXP`).

**Comportamiento actual**:

- `calcXP`: base 12 + 2/gol + 2/asist + 5 hat-trick + 10 MVP + 3 porteria + 5 parada_penalti.
- Curva L1-L99 balanceada (comentada en `badges.ts`): L10 ≈ 510 XP, L50 ≈ 41.7k, L99 ≈ 321k.
- Rachas: badges `racha_2..20` basadas en `streakFromStart` sobre histórico.
- Niveles 2-8 tienen badge marker sin bonus.

### 🟢 Fortalezas

- La curva está **declarada y documentada** — el diseño no es accidental.
- `calcXP` es determinístico y está donde tiene que estar (al finalizar partido, con las stats exactas).

### 🔴 Gaps

1. **XP por asistencia = XP por gol = 2**. En el fútbol real, asistir está infravalorado socialmente — aquí no se corrige.
2. **No hay XP por votar / por crear pista / por invitar a jugadores** — gamificaciones sociales ausentes.
3. **Niveles 9-99 no tienen marker**. Llegar a L50 se celebra con un silencio.
4. **No hay "prestige"** ni temporadas. Curva infinita sin reset.
5. **La racha es solo por victorias seguidas** — no hay racha por "goles en N partidos", "MVPs en N partidos", "asistencia". (Parcialmente sí en badges, pero no como surface principal.)

### ✨ Propuestas

- **P1 · Markers de nivel cada 10 (L10, L20, …L90)** `@xp`
  Badges visuales sin XP. Solo celebración + push. Mata el vacío post-L8.

- **P1 · XP social** `@xp`
  +1 XP por voto emitido en las 24h tras partido, +5 XP por añadir una pista nueva, +10 XP por invitar un jugador que crea perfil. Crea loops de contribución.

- **P1 · Temporada de 12 meses + "Hall of Fame"** `@xp`
  Al cumplir el año de la comunidad, snapshot del top 3 en XP, MVPs, goles → se archiva en "Hall of Fame" de la comunidad. El XP no se resetea (mata motivación), pero gana un layer de "este año has sido 3º".

- **P2 · Multi-streak surface** `@xp`
  En el perfil, mostrar no solo "racha de victorias" sino "racha sin faltar a un partido", "racha con al menos 1 gol o asist". Varias rachas pequeñas > una grande difícil.

---

## 12. Badges y vitrina

**Código**: [src/lib/game/badges.ts](../../src/lib/game/badges.ts) (712 líneas), [src/components/players/BadgeVitrina.tsx](../../src/components/players/BadgeVitrina.tsx), [src/components/ui/BadgeArt.tsx](../../src/components/ui/BadgeArt.tsx).

**Comportamiento actual**:

- >200 badges definidos en `BADGE_DEFS`, organizados en ~15 familias (goles, asist, MVP, partidos, rachas, victorias, pistas, horarios, combos, etc.).
- `detectBadges` corre al finalizar partido con contexto (matchScore, matchMeta, history, pistasStats).
- Vitrina: 3 slots en PlayerCard (configurables) + lista expandida en el perfil.
- XP por badge calibrado a la curva L1-L99.

### 🟢 Fortalezas

- Coleccionismo **real** — el volumen de badges (+variedad de categorías + rareza por tiers) es un diferencial vs cualquier competidor.
- Detección contextual (history/pistas/horario) es adulta — "MVP en Navidad", "partido épico de 15+ goles", "10 partidos en la misma pista".
- La XP marker sin bonus (XP = 0 para marcadores de umbral) evita doble contabilidad.

### 🔴 Gaps

1. **Muchos badges sin descubrimiento previo**. No hay surface "badges que te faltan" — solo los ves al obtenerlos.
2. **La vitrina de 3 slots** fuerza a elegir sin preview — y no hay recomendación ("ponte los más raros").
3. **Badges repetidos semánticamente** (ej. `partidos_5/10/25/50/75/100/150/200/250/300/400/500/750/1000` + `en_racha / veterano / habitual…`). Para nuevos usuarios hay solapamiento confuso.
4. **No hay rareza visible** (% de gente de la comunidad que lo tiene). Un "Hat trick" en una comunidad de pichichis vale menos que en una comunidad de porteros — sin contexto se devalúa.
5. **No hay badges negativos / irónicos** (ej. "Primer autogol", "10 derrotas seguidas"). Cortan al público que busca humor.
6. **Badges que dependen de eventos externos** (votos dados, pistas añadidas) están definidos pero no siempre los dispara el código (ej. `votos_dados_10` — depende de que el detector reciba ctx de votos, no está cableado).
7. **La vitrina personal podría ser un surface mucho más social**: hoy no se comparte.

### ✨ Propuestas

- **P0 · Pantalla "Badges que te faltan"** `@badges`
  Lista ordenada por "cercano a conseguir" (progress %) + grupos por familia. Hoy son invisibles hasta obtenerlos — esta surface multiplica el engagement sin añadir badges.

- **P0 · Rareza visible por comunidad** `@badges`
  Cada badge muestra "7% de tu comunidad lo tiene" en tooltip. Convierte los badges en moneda social comparable.

- **P1 · Cableo de todos los detectores externos** `@badges` ⚙️
  Revisar que badges de voto (`primer_voto`, `votado_10`, `votos_dados_*`, `rating_5`) y de pistas (`pista_nueva`, `pista_10`, etc.) se disparan siempre. Hoy la detección depende del `ctx` que se le pase a `detectBadges` — hay rutas (ej. cuando votas, no hay finalize de partido) que probablemente no las disparan.

- **P1 · Categoría "badges irónicos" opcional** `@badges`
  Familia `badges_humor`: "Sequía (100 partidos sin marcar)", "Autogolazo", "10 amarillas", "Cornijo de oro". Activable por comunidad. Amplía el humor, personalidad.

- **P1 · Compartir badge obtenido** `@badges`
  Al obtener badge, tarjeta generada (PNG) con nombre, comunidad, fecha + botón "compartir". WhatsApp-first. Gratis en el loop "partido → badges → compartir → engagement comunidad".

- **P2 · Vitrina pro: 5 slots + filtros** `@badges`
  Subir a 5 slots, con filtros "más raros", "más recientes", "por categoría". Y permitir al visitante del perfil ver TODOS los badges.

- **P2 · Podar duplicados redundantes** `@badges` ⚙️
  Revisar si vale la pena mantener `partidos_5/10` + `en_racha/veterano`, etc. Alternativa: mergear en uno solo con tiers (bronce/plata/oro) — menos ruido, más claro.

---

## 13. Ranking de comunidad

**Código**: [src/app/[cid]/ranking/page.tsx](../../src/app/[cid]/ranking/page.tsx), [src/components/ranking/RankingTable.tsx](../../src/components/ranking/RankingTable.tsx).

**Comportamiento actual**:

- Tabs de ranking por métrica (puntos, goles, asist, MVPs, XP, rating).
- Según [memoria proyecto](../../.claude/projects/-home-bazalowski-FurbitoLabs/memory/project_redesign.md): tab "Puntos" con hero + sparklines + gráfica de evolución.
- Color por comunidad aplicado en acentos.

### 🟢 Fortalezas

- Múltiples ejes — nadie queda último en todos.
- Sparkline + evolución convierten el ranking de lista estática a narrativa.

### 🔴 Gaps

1. **Ranking total de siempre**. No hay ventana "últimos 30 días", "esta temporada", "este año".
2. **Sin filtros por rol** (porteros vs jugadores de campo) — el ranking por goles aplasta a los porteros.
3. **No hay podio visual** para el Top 3 (solo lista).
4. **No hay comparación contra ti**: si soy el 7º, ¿cuánto me falta para subir al 6º?
5. **No hay ranking inter-comunidades** (cuando el multi-comunidad exista, oportunidad gigante).

### ✨ Propuestas

- **P0 · Selector de ventana temporal** `@ranking`
  Chips: "7 días" · "30 días" · "Temporada" · "Histórico". Cambia la agregación. Responde "¿cómo voy ÚLTIMAMENTE?" — mucho más motivador que el total.

- **P1 · Podio visual + "te faltan X puntos"** `@ranking`
  Top 3 con medallas + desglose "tú vs el siguiente arriba: te faltan 3 puntos = 1 gol". Micro-objetivos accionables.

- **P1 · Filtro por rol (portero / jugador)** `@ranking`
  Si la comunidad ha marcado porteros, ranking separado para porteros (ordenado por porterias a cero) vs jugadores de campo (goles/asist).

- **P2 · Ranking inter-comunidades (cuando aplique)** `@ranking`
  Global de "mejores jugadores de FURBITO" por métrica. Opt-in. Genera FOMO + difusión orgánica.

- **P2 · "Ranking de admins" interno** `@ranking`
  Quién crea más partidos, quién llena más fichas de resultado. Reconocimiento al organizador — persona 1 del plan de marketing.

---

## 14. Pistas y mapa

**Código**: [src/hooks/usePistas.ts](../../src/hooks/usePistas.ts), [src/components/pistas/PistaMap.tsx](../../src/components/pistas/PistaMap.tsx), [src/app/[cid]/pistas/page.tsx](../../src/app/[cid]/pistas/page.tsx).

**Comportamiento actual**:

- Pistas con nombre, lat/lng, notas, superficie (según código).
- Mapa con marcadores de las pistas de la comunidad.
- Eventos se asocian a `pista_id`.
- Badges específicos de pistas (`pistas_5/10`, `jugar_3_pistas`, `pista_favorita_*`, …).

### 🟢 Fortalezas

- Conectar eventos → pistas → badges cierra un loop completo (geo).
- Pista como entidad permite "compartir pistas entre comunidades" (una pista en Madrid puede ser usada por dos comunidades distintas) — poco explotado hoy pero abre puerta a producto de red.

### 🔴 Gaps

1. **Añadir pista fuera del mapa es la única opción fluida** — añadir desde el mapa (tap en coordenadas) no está.
2. **Sin info derivada** por pista: "aquí se juega a las 21h", "superficie cemento", "ha llovido → cerrada".
3. **No hay "pistas favoritas"** del jugador (aparte del badge).
4. **Sin integración con clima** — "mañana 90% de lluvia en tu pista" desaparecería partidos sin sentido.
5. **Sin reseñas** — útiles: "vestuario: no", "aparcamiento: 100m", "balón propio: sí".
6. **Sin "distancia desde tu ubicación"** ni "cómo llegar" — está en el [roadmap](../WARROOM_ROADMAP_30D.md) semana 2 pero pendiente.

### ✨ Propuestas

- **P0 · Añadir pista tocando el mapa** `@pistas`
  Tap largo → pin draggable → formulario flotante. Cierra el loop sin salir del mapa.

- **P0 · "Cómo llegar" + distancia** `@pistas`
  Botón directo a Google Maps/Apple Maps via `geo:lat,lng`. Distancia en km desde ubicación (con permiso). Abre casos de "elijo pista más cercana".

- **P1 · Reseñas minimalistas de pista** `@pistas`
  3 campos: superficie, condiciones (buenas/regular/malas), nota corta. Agregadas por comunidad. Útiles + diferencian vs GMaps genérico.

- **P1 · Clima en el evento** `@evento` + `@pistas`
  Usar una API free (Open-Meteo) para mostrar pronóstico del día del partido en la card del evento. No hace falta cuenta ni API key. 0 coste, alta utilidad.

- **P2 · Pistas públicas compartidas entre comunidades** `@pistas`
  Toggle "pista pública": aparece en el mapa de cualquier comunidad de FURBITO geográficamente cercana. Red de pistas crowd-sourced. Eventual diferencial vs cualquier competidor.

---

## 15. Notificaciones push + recordatorios

**Código**: [src/lib/notifications/notification-service.ts](../../src/lib/notifications/notification-service.ts), [src/lib/notifications/push-manager.ts](../../src/lib/notifications/push-manager.ts), [src/hooks/usePushNotifications.ts](../../src/hooks/usePushNotifications.ts), [supabase/functions/send-push/](../../supabase/functions/send-push/), [supabase/functions/send-reminders/](../../supabase/functions/send-reminders/).

**Comportamiento actual**:

- Web Push con VAPID vía Supabase Edge Function `send-push`.
- Tipos: `event_created`, `event_reminder`, `match_finished`, `badge_earned`, `mvp_selected`.
- Preferencias por tipo, persistidas por jugador y comunidad.
- Cron de recordatorios (`send-reminders`) desde migración [003_push_reminders_cron.sql](../../supabase/migrations/003_push_reminders_cron.sql).
- Local notifications cuando la app está en foreground.

### 🟢 Fortalezas

- Stack propio (VAPID + Edge Function) → no dependes de APNS/FCM ni plataformas de terceros (OneSignal).
- Preferencias granulares por tipo — el usuario elige qué recibir.

### 🔴 Gaps

1. **iOS web push requiere PWA instalada + iOS 16.4+**. Instrucciones al usuario no son claras; hay caída silenciosa.
2. **Push de `mvp_selected` y `badge_earned`** existen en tipos — pero no está claro si todos los triggers los invocan (ver §12 gap 6).
3. **No hay digest diario/semanal** — ofreces push transaccionales pero no "resumen del grupo".
4. **No hay "modo no molestar"** por horas (nocturno).
5. **No hay topic de "comunidad entera" vs "individuales"** — todo push va a suscriptores del mismo player/comm.
6. **No hay deep link al recurso** específico (ej. tap en push de MVP → llegar al voto, no al home).

### ✨ Propuestas

- **P0 · Digest semanal (domingo 20h)** `@notif`
  Push + mini-página con: cuántos partidos jugó la comunidad, top 3 goleadores de la semana, MVPs, tu contribución ("metiste 3 goles"). Principal mecanismo de retención semanal.

- **P0 · Deep links consistentes en todos los push** `@notif`
  Cada push lleva `url` al recurso exacto. Auditar `notification-service.ts` → asegurar que los 5 tipos incluyen URL coherente.

- **P1 · Onboarding iOS específico** `@notif`
  Banner visual que detecta iOS + no-PWA-instalada → guía de 2 pasos ("Añadir a pantalla de inicio → activar notificaciones"). Sin esto perdemos ~40% de los iPhone.

- **P1 · Quiet hours** `@notif`
  Preferencia "no me envíes push entre 23:00 y 08:00". En la Edge Function, diferir los push durante esas horas del timezone del usuario.

- **P2 · Canal "team" para admins** `@notif`
  Tipos nuevos solo para admins: `confirmaciones_bajas`, `incidencia_pista`, `jugador_inactivo_30d`. Les ayuda a gestionar.

- **P2 · Email opt-in paralelo** `@notif`
  Para quienes no pueden/quieren push (iOS sin PWA). Mismo digest semanal en email — requiere un endpoint de email, no más que eso.

---

## 16. Feed de actividad

**Código**: [src/components/feed/ActivityFeed.tsx](../../src/components/feed/ActivityFeed.tsx), integrado en Home.

**Comportamiento actual**:

- Muestra últimos 5 eventos de la comunidad: partidos nuevos, resultados, MVPs, badges.
- Formato texto con emoji.

### 🟢 Fortalezas

- Surface pasivo de "lo que está pasando" en Home — captura curiosidad sin requerir acción.

### 🔴 Gaps

1. **No hay filtro ni paginación** — si quieres ver "todos los goles de la semana" no se puede.
2. **Items no siempre linkean** al recurso concreto (issue ya notado en [UI_AUDIT_PANTALLAS.md](UI_AUDIT_PANTALLAS.md) §2).
3. **Sin reactions** — no se puede dar un 🔥 a un hat-trick de un compañero. El contenido es frío.
4. **Sin generación de items por votación o pistas nuevas** — solo lo clásico (partidos, resultados, MVPs, badges).
5. **Sin "destacados de la semana"** curados.

### ✨ Propuestas

- **P0 · Reactions (🔥 👏 🐐 😂 💀)** `@feed`
  Cualquier jugador puede reaccionar a cualquier item. Contador visible. Clave para convertir feed pasivo en loop social. Persistente en BD.

- **P0 · Linkeo universal de items al recurso** `@feed`
  Cada item del feed tiene `url` clara. Ya es un gap reconocido.

- **P1 · "Highlights de la semana"** `@feed`
  Card generada los lunes 9h: "3 partidos jugados, 17 goles, MVP del fin de semana: Juan". Surface del digest semanal (§15) integrado en feed.

- **P1 · Nuevos tipos de item** `@feed`
  - "Juan añadió la pista Las Moreras"
  - "Votación MVP de hoy ya tiene 5 votos — tú faltas"
  - "Ander ha subido al nivel 10"

- **P2 · Filtro por tipo + paginación infinita** `@feed`
  Chips "Goles / MVPs / Badges / Todo" en la parte superior del feed. Scroll infinito para histórico.

---

## 17. Realtime y sincronización

**Código**: Hooks (`useEvents`, `useEvent`, `usePlayers`, `useVotes`) con canales Supabase Realtime.

**Comportamiento actual**:

- Cada hook abre canal por `cid` o `eid`. Listener `on('postgres_changes', ...)` y refetch completo al cambio.
- Refetch completo (no delta-apply) — simple, un poco caro en datos grandes.

### 🟢 Fortalezas

- Funciona y es predecible (refetch completo = siempre consistente).
- Admin-override + confirmaciones se propagan sin recargar.

### 🔴 Gaps

1. **Refetch completo por cada cambio**: en una comunidad grande con 50 eventos + 200 confirmaciones, cada confirmación re-fetcha todo. Costoso en RLS, ancho de banda y re-render.
2. **Sin reconnect UX**: si pierdes red, no hay indicador. Y al volver, el `load()` inicial se dispara en cada hook sin debouncing.
3. **Canales no compartidos**: si dos hooks abren el mismo canal, se duplican.
4. **Sin versión optimista**: UI espera el round-trip para actualizar (salvo excepciones). En 3G, es perceptible.

### ✨ Propuestas

- **P1 · Delta-apply en hooks críticos** `@realtime` ⚙️
  En `useEvents` y `useConfirmations`, aplicar el payload del event directamente en lugar de refetch. Baja carga servidor y latencia en 60-80%.

- **P1 · Indicador de conexión** `@realtime`
  Chip en Header "reconectando…" / "offline, cambios pendientes". UX de confianza, sobre todo en partidos en campo con mala cobertura.

- **P1 · Cache + optimistic updates** `@realtime` ⚙️
  Toda acción del usuario (confirmar, votar) aplica de inmediato en local y revierte si el servidor rechaza. Sensación instantánea + offline-ready.

- **P2 · React Query / SWR adoption** `@realtime` ⚙️
  Migrar los hooks a React Query con subs de Realtime como invalidator. Menos boilerplate, cache inteligente, devtools.

---

## 18. PWA / offline / migración nativa

**Código**: [public/sw.js](../../public/sw.js), [src/components/ServiceWorkerRegister.tsx](../../src/components/ServiceWorkerRegister.tsx), [DOCS/GUIA_MIGRACION_APP_NATIVA.md](../GUIA_MIGRACION_APP_NATIVA.md).

**Comportamiento actual**:

- PWA instalable. Service Worker para asset caching.
- Manifest con icons 192/512, colors, name.
- Plan de migración a React Native documentado.

### 🟢 Fortalezas

- Instalable = fricción cero vs stores mientras llega la nativa.
- Toda la lógica game/scoring/teams está en `src/lib/game/` **sin dependencia del DOM** — se puede portar literal a RN (insight ya capturado en [UI_AUDIT_PANTALLAS.md](UI_AUDIT_PANTALLAS.md) §16).

### 🔴 Gaps

1. **Sin offline real**: SW cachea assets, no datos. Si pierdes red en el campo, no puedes marcar un gol.
2. **Sin "instalar la app"** prompt contextualmente mostrado (aparece de Chrome, no nuestro).
3. **Sin tracking de PWA vs navegador** — no sabemos cuántos la han instalado.
4. **Migración nativa**: hoy ~60% de lo UI está en Tailwind utility-first — portar a RN es tedioso sin tokens.

### ✨ Propuestas

- **P0 · Prompt de instalación contextual** `@pwa`
  Tras 2ª sesión + habiendo jugado ≥1 partido, modal "instalar FURBITO". Muchas más instalaciones que el prompt nativo del navegador.

- **P0 · Tokens canónicos como CSS vars** `@pwa` ⚙️
  Ya definido en el [design system](FURBITO_DESIGN_SYSTEM.md) — asegurar que todo color/spacing es una var, no un literal Tailwind. Migración RN = tabla de tokens → StyleSheet, trivial.

- **P1 · Offline-queue para acciones de escritura** `@pwa`
  Confirmar, votar, cerrar partido → si no hay red, encolar en IndexedDB y sincronizar al volver. El mayor diferencial para "app de campo".

- **P1 · Tracking PWA install events** `@pwa`
  Listen al evento `appinstalled` + analytics. Métricas clave (hoy ciegas).

- **P2 · Roadmap RN empezado por el componente más aislado** `@nativa` ⚙️
  `BadgeVitrina` + `PlayerCard` son buenos candidatos: lógica pura, sin navegación, reutilizan tokens. Validan el pipeline sin riesgo.

---

## 19. Observabilidad, seguridad y admin tooling

**Código**: [src/app/admin/[cid]/page.tsx](../../src/app/admin/[cid]/page.tsx), RLS en [supabase/schema.sql](../../supabase/schema.sql) + migraciones [005_fix_communities_rls.sql](../../supabase/migrations/005_fix_communities_rls.sql) + [006_fix_remaining_rls.sql](../../supabase/migrations/006_fix_remaining_rls.sql).

**Comportamiento actual**:

- RLS en Supabase por comunidad.
- Panel admin básico en `/admin/[cid]`.
- Sin analytics propio (solo los defaults de Vercel).
- Sin error tracking (Sentry etc.).

### 🟢 Fortalezas

- RLS permite multi-tenant sin lógica propia — buena decisión.
- Migraciones son explícitas y en git.

### 🔴 Gaps

1. **Sin error tracking** — cuando algo peta en prod no nos enteramos.
2. **Sin analytics de funnel** — no sabemos dónde se cae la gente en onboarding.
3. **Sin audit log** — "quién finalizó este partido", "quién cambió este PIN".
4. **Sin "vista como este jugador"** en admin — útil para debug.
5. **Sin herramienta de export de datos** de la comunidad (cumplimiento GDPR básico + portabilidad).

### ✨ Propuestas

- **P0 · Error tracking (Sentry o self-hosted GlitchTip)** `@obs` ⚙️
  1h de setup. Detecta errores reales en prod — crítico para hard launch.

- **P0 · Analytics ligero (Plausible / Umami)** `@obs` ⚙️
  Self-hosted o SaaS. Funnel: landing → PIN → primer partido → primer resultado → primer MVP. Datos para el plan de marketing.

- **P1 · Audit log por comunidad** `@obs`
  Tabla `community_audit` (who, what, when, diff). UI en admin panel. Crucial para confianza interna.

- **P1 · Export CSV de la comunidad** `@obs`
  Admin primario descarga CSV con todos los partidos, stats, jugadores. GDPR básico + genera confianza en "puedes llevarte tus datos".

- **P2 · "Vista como jugador X"** `@obs`
  Admin impersona (read-only) a otro jugador para debug. Log del impersonation.

---

## 20. Top 15 mejoras priorizadas

Ordenadas por **ratio impacto/coste** asumiendo ~1 dev. Los tags y IDs cuadran con la DB `✨ Features` de Notion.

| #  | Prioridad | Tag | Mejora | Por qué mueve aguja |
|----|-----------|-----|--------|---------------------|
| 1  | P0 | @evento | Eventos recurrentes | Mata el principal dolor del organizador — el uso semanal se colapsa sin esto |
| 2  | P0 | @confirmaciones | Score de fiabilidad por jugador | Social, métrica nueva, diferencial vs WhatsApp, trivial de calcular |
| 3  | P0 | @valorar | Sesión de valoración post-partido | 3x tasa de voto → feeds balanceador → mejores equipos → retención |
| 4  | P0 | @badges | Pantalla "badges que te faltan" | Desbloquea el coleccionismo pasivo, cero coste de contenido nuevo |
| 5  | P0 | @notif | Digest semanal | Principal driver de retención en apps de grupo; infra ya existe |
| 6  | P0 | @equipos | Constraints (parejas / enemistades / portero) | Resuelve la queja nº1 del balanceador |
| 7  | P0 | @equipos | Arranque en frío: cuestionario express | Los primeros partidos del balanceador son basura sin esto |
| 8  | P0 | @ranking | Selector temporal (7d/30d/temporada/histórico) | Cambia la narrativa del ranking |
| 9  | P0 | @auth | Recovery key por jugador | Sin esto, cambio de móvil = pérdida de identidad |
| 10 | P0 | @comunidad | Multi-comunidad por jugador | Desbloquea segmento enorme (curro + barrio + pichangas) |
| 11 | P0 | @resultado | Undo 15 min tras finalizar | Elimina miedo al botón + errores en prod |
| 12 | P0 | @evento | Export .ics + deep-link Maps | 15 min de trabajo, reduce no-shows |
| 13 | P0 | @feed | Reactions (🔥 👏 🐐…) | Convierte feed pasivo en loop social |
| 14 | P0 | @obs | Error tracking + analytics ligero | Ceguera total hoy; crítico antes del hard launch |
| 15 | P1 | @equipos | Memoria de emparejamientos recientes | El partido semanal se vuelve aburrido sin rotación |

### Mapa de correspondencia con el plan de marketing

Cruzar esta tabla con [MARKETING_PLAN.md](MARKETING_PLAN.md):

- **Fase soft-launch** se apoya en #1, #2, #6, #7, #11, #12, #14 (estabilidad + balanceador creíble).
- **Fase hard-launch** se apoya en #3, #4, #5, #8, #10, #13 (loops de retención + surfaces nuevos).
- **Fase growth** se apoya en multi-comunidad (#10) + compartir (badges/MVP/equipos, §6 + §12) + pistas compartidas (§14 P2).

---

## 21. Cómo ver esta forma de trabajo (pregunta del usuario)

> *"En un futuro te pasaré esos .md por tu prompteo y tu skill para que trabajes desde ahí, ¿cómo ves esta nueva forma de trabajo?"*

Respuesta honesta, no diseñada para agradar.

### Lo que funciona bien

- **Los .md son contrato explícito**. Mucho más difícil que me desvíe si la especificación vive en `DOCS/FURBITO 2.1/` en lugar de en tu cabeza o en un hilo largo. Pasar de "arréglame esto" a "implementa la propuesta #3 de la §6 del FEATURE_AUDIT" es un salto cualitativo.
- **Permiten priorización real**. P0/P1/P2 con justificación estructurada evitan la trampa clásica de "todo urgente".
- **Son refrescables**. La auditoría de abril 2026 envejece en 3 meses — pero el formato permite hacer "diff" mentalmente de qué cambió y re-priorizar.
- **Alinean bien con la skill [furbito-design](../../.claude/skills/furbito-design/SKILL.md)**. El design system marca *cómo* construir; estos .md marcan *qué* construir. Combinados son un brief completo.
- **Desacoplan audit de implementación**. Yo puedo auditar sin escribir código, tú puedes pensar sin ejecutar. Menos fricción y menos commits fallidos.

### Lo que hay que vigilar

- **Riesgo de "documentación viva" no mantenida**. Si no hay disciplina de tachar propuestas hechas / añadir nuevas, en 2 meses esto es un museo. Recomendación: tras implementar una propuesta, marcarla `✅` en el .md y moverla a una sección `Implementadas` o borrarla si ya no es referencia útil.
- **Riesgo de sobre-planificación**. 200 propuestas en 4 docs es más de un año de trabajo solo. La disciplina real no es escribir más — es **no hacer** el 80% y priorizar el 20% que mueve aguja (el Top 15 de arriba). Si me pasas un .md de 300 ítems y pides "hazlo todo", acabaremos con un producto que hace demasiado y vale menos.
- **Riesgo de divergencia con el código**. Los .md capturan el estado `AS-OF` 2026-04-23. Si en mayo haces cambios grandes sin actualizar los docs, la próxima vez que trabaje "desde el .md" estaré razonando sobre una app que ya no existe. Disciplina: tras un cambio estructural, revisar si toca actualizar.
- **Riesgo de perder oportunidades ad-hoc**. Trabajar desde .md es bueno para construcción planificada, malo para "se me ha ocurrido ahora esto". Mantén espacio para iterar libre. Cuando hagas descubrimientos valiosos fuera del plan, meterlos al .md, no al revés.

### Cómo aprovechar al máximo

- **Cuando quieras que trabaje desde un .md, linkea la sección exacta**. No "trabaja desde el FEATURE_AUDIT" — "implementa §6 P0 constraints de equipos". Respuesta mucho más precisa.
- **Usa los tags (`@evento`, `@equipos`…)**. Te permite pedir "todo lo de @notif P0" y yo puedo buscar + batchear.
- **Si un .md queda obsoleto, dilo explícito**. "Ignora UI_AUDIT §4 — ya está hecho." Mejor que yo lo presuma.
- **Cuida la cadencia de actualización**. Cada 4-6 semanas un repaso de los 4 docs + tachado de ítems + 3-5 nuevos → los docs son brújula viva, no lastre.

En corto: **es la mejor forma de trabajar que hemos probado juntos**, siempre que los .md **se mantengan** y **se usen con quirúrgica precisión** en lugar de como "haz esto todo".

---

## Addendum: cómo encadenar esto en el roadmap

- Este doc reemplaza el bloque funcional del [WARROOM_ROADMAP_30D.md](../WARROOM_ROADMAP_30D.md) — ese doc quedaba más orientado a estabilización. Recomendación: archivarlo o mergear aquí.
- Las propuestas del Top 15 deberían traducirse a entradas en la DB `✨ Features` de Notion siguiendo el esquema de [NOTION_RECONFIG.md](NOTION_RECONFIG.md) §2.
- La matriz P0/P1/P2 de aquí + la del [UI_AUDIT_PANTALLAS.md](UI_AUDIT_PANTALLAS.md) juntas componen el backlog canónico.
