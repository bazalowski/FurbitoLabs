# FURBITO — Auditoría UI/UX pantalla por pantalla

> **Objetivo**: recorrer cada pantalla de la app en su estado actual (abr 2026) y dejar documentada:
> - Estructura visual actual (sin abrir Figma — se describe con texto).
> - Fortalezas que se mantienen.
> - Issues detectados (bugs de UX, fricción, inconsistencias).
> - **Mejoras propuestas** priorizadas P0/P1/P2.
>
> Cada mejora está marcada con un tag de surface (`@home`, `@partido`, etc.) para que sea directa trasladar a la DB `✨ Features` de Notion.
>
> **Convención**:
> - 🟢 **Fortaleza** — algo que funciona y hay que preservar
> - 🔴 **Issue** — problema detectado
> - ✨ **Propuesta** — mejora concreta (con prioridad P0/P1/P2)
> - 📸 **Screenshot** — referencia a captura del estado actual (se anexa en Notion, no en el repo)

---

## Índice

1. [Login + gate inicial](#1-login--gate-inicial)
2. [Home de comunidad](#2-home-de-comunidad)
3. [Lista de partidos](#3-lista-de-partidos)
4. [Detalle de partido — Convocados](#4-detalle-de-partido--convocados)
5. [Detalle de partido — Equipos](#5-detalle-de-partido--equipos)
6. [Detalle de partido — Resultado (stepper)](#6-detalle-de-partido--resultado-stepper)
7. [Lista de jugadores](#7-lista-de-jugadores)
8. [Perfil de jugador](#8-perfil-de-jugador)
9. [Ranking](#9-ranking)
10. [Pistas — ELIMINADO (mapa aplazado a nativa)](#10-pistas--eliminado-2026-04-23)
11. [Ajustes](#11-ajustes)
12. [Ayuda / Tutorial](#12-ayuda--tutorial)
13. [Admin (super-admin panel)](#13-admin-super-admin-panel)
14. [Layout global: Header + BottomNav + Toast](#14-layout-global-header--bottomnav--toast)
15. [Cross-cutting: mejoras que afectan a varias pantallas](#15-cross-cutting-mejoras-que-afectan-a-varias-pantallas)
16. [Pre-nativa: decisiones que ahorran trabajo luego](#16-pre-nativa-decisiones-que-ahorran-trabajo-luego)

---

## 1. Login + gate inicial

**Ruta**: `src/app/page.tsx`

**Estado actual**:

- Gate inicial con 2 cards: `🆕 Usuario nuevo` · `🔑 Ya tengo un PIN`.
- A partir de la 2ª visita aparece `No volver a mostrar` (localStorage).
- Tab "Ya tengo PIN": input de 4 dígitos + botón Entrar, admin PIN por env.
- "Usuario nuevo": modal → PIN de comunidad + nombre → crea jugador con `genPlayerCode()` y loguea como `player`.
- Tagline: *"Tu app de comunidades de fútbol"*.

### 🟢 Fortalezas

- Sin email ni contraseña — fricción cero, gran acierto estratégico.
- Gate de 2 cards reduce parálisis ("soy nuevo" vs "tengo PIN" es claro).
- Shake animation en error — feedback físico inmediato.

### 🔴 Issues detectados

1. El tagline actual es genérico y no transmite el dolor que resuelve.
2. El gate, desde la 3ª visita, puede ser fricción para el power user que quiere abrir la app y entrar rápido.
3. No hay **preview** de qué vas a encontrar dentro (un usuario nuevo entra "a ciegas" al PIN).
4. Falta link a FAQ / política de privacidad / términos — necesario para stores.
5. El PIN admin actualmente es una env pública (`NEXT_PUBLIC_ADMIN_PIN`) — ok para dev, pero revisar para prod.

### ✨ Propuestas

- **P0 · Tagline con beneficio concreto** `@login`
  Reemplazar *"Tu app de comunidades de fútbol"* por algo que venda el resultado, no la categoría. Candidatos a A/B:
  - *"Organiza tu grupo de fútbol en 30s."*
  - *"Tu pachanga, mejor organizada."*
  - *"Partidos, equipos y ranking. Sin WhatsApp."*

- **P1 · Preview visual debajo del gate** `@login`
  Carrusel pasivo de 3 slides con 1 screenshot cada uno: partido en vivo · equipos auto-balanceados · ranking con podio. 8s de loop, no intrusivo. Convierte dudosos que entraron desde un link y no conocen el producto.

- **P1 · Footer links obligatorios** `@login`
  Añadir pequeños links a "Política de privacidad" · "Términos" · "Ayuda". Requisito para stores y profesionaliza la impresión.

- **P2 · Recordar último PIN usado** `@login`
  Si el usuario ha entrado antes a una comunidad, prellenar el PIN (con opción de "otra comunidad"). Reduce fricción para recurrentes.

- **P2 · "Usuario nuevo" sugiere pegar PIN del portapapeles** `@login`
  Si al abrir la app se detecta un PIN de 4 dígitos en el portapapeles (venido de WhatsApp), ofrecer usarlo con 1 tap.

---

## 2. Home de comunidad

**Ruta**: `src/app/[cid]/page.tsx`

**Estado actual**:

- Eliminado el grid 2x2 antiguo.
- Nueva estructura: PlayerCard (propio) → NextMatchHero → stats 3-col → ActivityFeed (5 últimos).
- Shortcuts: Generar equipos (solo si no hay partido próximo), MVP, Valorar, Tutorial (solo 1ª visita).
- Cards migradas a `.card hairline-top card-glow`, chevrons convertidos en pills 7×7 tintadas.
- NextMatchHero es toggle (un click colapsa/expande), CTAs Sí/No semánticos.

### 🟢 Fortalezas

- La jerarquía está muy bien: lo personal primero (tu card), lo urgente después (próximo partido), el contexto al final (stats + feed).
- Polish premium con `hairline-top` + `card-glow` en hover — premium sin sentirse exagerado.
- Chevrons-pills tintados con `--comm-color` — microdetalle que refuerza identidad de comunidad.

### 🔴 Issues detectados

1. Para un usuario guest (que entró por link sin PIN de jugador), la PlayerCard personal **no existe** y la Home se siente vacía. No hay CTA claro para "entra como jugador".
2. El `ActivityFeed` muestra eventos como "Juan metió 2 goles" pero no siempre linkea al partido → quedan huérfanos.
3. No hay **contador de "pendiente tuyo"**: si tengo confirmación pendiente o un voto de MVP pendiente, no se ve desde Home sin entrar al partido.
4. El "Tutorial" CTA desaparece al visitar → los power users que lo saltaron pierden visibilidad.

### ✨ Propuestas

- **P0 · Tira de "Pendiente de ti"** `@home`
  Encima de NextMatchHero, banner horizontal solo si hay acciones pendientes:
  - "Confirma asistencia al partido del viernes" → Sí/No en el propio banner.
  - "Vota al MVP del sábado pasado" → link al voto.
  Desaparece cuando no hay nada. Gran impacto en retención y en el KPI "tasa asistencia".

- **P0 · CTA guest → convertir a jugador** `@home`
  Si el role es `guest` en una comunidad, card inicial "Eres espectador. ¿Quieres jugar con este grupo?" → abre modal de alta (nombre + genera código). Convierte directo sin salir a la landing.

- **P1 · ActivityFeed con deep link** `@home`
  Cada item del feed enlaza a su origen (partido, perfil, badge) con preview visual. Refuerza navegación horizontal.

- **P1 · Saludo con hora + racha** `@home`
  Header de la home con "Buenos días, Juan 🔥 7 partidos seguidos" (si existe racha). Refuerza identidad + retención emocional.

- **P2 · Widget "comunidad esta semana"** `@home`
  Tarjeta compacta con 4 números: partidos jugados / MVPs repartidos / nuevos badges / asistencia media. Da pulso rápido al admin.

---

## 3. Lista de partidos

**Ruta**: `src/app/[cid]/partidos/page.tsx`

**Estado actual**:

- Lista cronológica de eventos (próximos + pasados).
- Cada card: tipo (⚽/🏋️), fecha, pista, nº confirmados, estado.
- Admin puede crear nuevo desde CTA.

### 🔴 Issues detectados

1. No hay separador claro entre **próximos** y **pasados** → listas largas se vuelven confusas.
2. No hay filtro por mes / por tipo (partido vs entreno).
3. El estado (abierto/cerrado/finalizado) está en texto pequeño — debería ser badge.
4. Cuando no hay partidos, el empty state es flojo (texto sin CTA).

### ✨ Propuestas

- **P0 · Sticky section headers** `@partidos`
  "Próximos", "Esta semana", "Pasados (últimos 30d)", "Histórico". Sticky en scroll para que el usuario no se pierda.

- **P1 · Estado como chip** `@partidos`
  Badge tintado:
  - `ABIERTO` → verde (community-color)
  - `CERRADO` → gris
  - `FINALIZADO` → dorado con ✓
  - `CANCELADO` → rojo apagado

- **P1 · Empty state con CTA** `@partidos`
  Si no hay partidos próximos: ilustración simple + "Aún no hay partido próximo. ¿Montamos uno?" + botón "Crear partido" (si admin) o "Pedir al admin" (si jugador → genera mensaje para WhatsApp).

- **P2 · Swipe rapidísimo para confirmar/rechazar desde la lista** `@partidos`
  En partidos próximos con confirmación abierta, swipe right = Sí, swipe left = No (patron iOS-like). Reduce taps, muy mobile-native.

---

## 4. Detalle de partido — Convocados

**Ruta**: `src/app/[cid]/partidos/[eid]/page.tsx` (tab Convocados)

**Estado actual**:

- Tab bar pill: Convocados | Equipos | Resultado.
- Lista de jugadores de la comunidad con estado: sí / quizá / no / sin respuesta.
- CTAs Sí/Quizá/No semánticos con colores (verde/ámbar/rojo), activo con sombra.
- Realtime activo: las confirmaciones aparecen sin recargar.

### 🟢 Fortalezas

- Realtime es diferencial → las confirmaciones aparecen en vivo, muy wow.
- Colores semánticos en CTAs de confirmación son claros.

### 🔴 Issues detectados

1. El **avatar + nombre** de cada jugador se ve en fila densa, pero no hay **avatar tintado por estado** → a golpe de vista cuesta saber quién ya confirmó.
2. No hay contador prominente "X/Y confirmados" que dé pulso.
3. No hay forma de **empujar a los que no han respondido** (admin) sin salir y usar WhatsApp.

### ✨ Propuestas

- **P0 · Barra de progreso + contador grande** `@partido`
  Encima de la lista: barra tipo `[███████░░░] 7/10 confirmados` con glow tintado. Arriba a la derecha, el número grande "7/10". Satisface el ego del admin y informa al jugador.

- **P0 · Grupos visuales por estado** `@partido`
  Dividir la lista en 4 secciones colapsables:
  - ✅ Confirmados (verde)
  - 🤔 Quizá (ámbar)
  - ❌ No pueden (rojo, colapsado por defecto)
  - ⏳ Sin respuesta (gris, expandido si admin)

- **P1 · "Empujar a los que no han respondido"** `@partido` (solo admin)
  Botón "Pinchar a los silenciosos" → genera mensaje de WhatsApp con la lista de los que faltan + link directo al evento. El admin puede copiar o compartir.

- **P1 · Avatar teñido por estado** `@partido`
  Borde de avatar en verde/ámbar/rojo/gris según estado. Microbadge ✓ / ? / ✗ arriba-derecha. Resuelve el escaneo visual rápido.

- **P2 · Histórico de asistencia** `@partido`
  Al lado del nombre, chip `12/15` = asistió a 12 de los últimos 15 partidos. Ayuda al admin a entender el grupo.

---

## 5. Detalle de partido — Equipos

**Ruta**: `src/app/[cid]/partidos/[eid]/page.tsx` (tab Equipos)

**Estado actual**:

- Admin ve CTA "⚡ Generar/Regenerar equipos" → abre Modal con `<TeamGenerator>`.
- `onConfirmTeams` persiste a `events.equipo_a/b`.
- Pool: jugadores `si` (fallback: toda la comunidad).
- TeamGenerator v3: pills de modo con halo, chips de score por jugador, `.card hairline-top`.
- Algoritmo: vectores atk/def/tec/vel/emp con relaciones ocultas.

### 🟢 Fortalezas

- El generador es una feature killer — la demo visible está muy bien resuelta.
- El algoritmo con relaciones "rivales/complementarios" es único en el mercado amateur.
- Score chips por jugador dan transparencia al balanceo.

### 🔴 Issues detectados

1. Un jugador no-admin no puede ver los equipos antes del partido — tiene que preguntar al admin.
2. El algoritmo es potente pero el usuario no tiene manera de aprender qué significan atk/def/tec/vel/emp.
3. No hay forma de "forzar" equipos manualmente desde el Modal (drag & drop) si el admin quiere ajustar.
4. La visualización del balanceo es texto (score A vs score B) — podría ser visual.

### ✨ Propuestas

- **P0 · Equipos visibles para todos los confirmados** `@equipos`
  Una vez `onConfirmTeams` guardado, todos los `si` ven los equipos (no solo admin). Aumenta anticipación y reduce preguntas al admin.

- **P0 · Barra visual de balanceo** `@equipos`
  Encima de los equipos: `[■■■■■■■■■■] 5.2 | 5.0 [■■■■■■■■■■]` tintada. Muy visual.

- **P1 · Drag & drop manual post-generación** `@equipos`
  Después de generar, el admin puede arrastrar jugadores entre equipos. Se actualiza el balance en vivo. Crítico para respetar amistades / coches / roles no contemplados en skills.

- **P1 · Tooltip pedagógico en skills** `@equipos` `@perfil`
  Al tocar atk/def/tec/vel/emp aparece breve: *"Ataque: lo que marca y genera. Defensa: lo que recupera y bloquea."* Reduce misterio y baja fricción del rating.

- **P2 · "Guardar equipos favoritos"** `@equipos`
  Si el admin suele usar los mismos equipos (ej. "los rojos vs los blancos"), poder guardar configuraciones con nombre y recuperarlas. Patrón tipo preset.

---

## 6. Detalle de partido — Resultado (stepper)

**Ruta**: `src/app/[cid]/partidos/[eid]/resultado/page.tsx`

**Estado actual**:

- Stepper visual 3 pasos: Marcador → Stats → Resumen.
- Paso 2: steppers +/− para goles/asistencias/porterías a cero (antes toggles).
- Chip de puntos live en Paso 2 con tier color.
- Paso 3: visualización de puntos por jugador con tier (arcoíris animado ≥20).
- MVP NO se elige aquí: se guarda `mvp_id: null` + `mvp_voting_closes_at = +24h`.
- Finalización por voto en `mvp-finalize.ts`.

### 🟢 Fortalezas

- El stepper de 3 pasos es nítido, no da miedo.
- Los tiers por color (rojo/naranja/verde/cyan/arcoíris) son una idea muy fuerte — merchandisable.
- Chip live de puntos en Paso 2 da dopamina inmediata al admin al introducir stats.

### 🔴 Issues detectados

1. Si el admin se equivoca y guarda el resultado, **no hay "deshacer"** claro (afecta a puntos, XP, badges).
2. En Paso 3, los puntos de cada jugador se ven pero falta un **tl;dr emocional** del partido ("3 debuts de rating 10" / "Primer hat-trick de Juan" / "Racha rota del equipo A").
3. La acción de "avanzar" de paso 2 a paso 3 no siempre es clara si quedan datos sin meter.

### ✨ Propuestas

- **P0 · Undo de 5 minutos** `@resultado`
  Después de "Finalizar partido", banner persistente 5 min: *"Partido finalizado. Deshacer"* → revierte stats/XP/badges. Reduce estrés del admin novato.

- **P0 · Validación bloqueante en paso 2** `@resultado`
  Si el total de goles del partido ≠ marcador, banner rojo "El marcador indica 4-3 (7 goles), tenéis 6 registrados" + botón "Ajustar". Evita desincronía entre marcador y stats.

- **P1 · Resumen emocional en paso 3** `@resultado`
  Arriba del detalle de puntos, 2-3 frases generadas con reglas simples:
  - "Hat-trick de Juan" (si goles ≥ 3)
  - "Pedro sumó su 4ª portería a cero del mes" (si cumple)
  - "Legendario: Juan alcanza 20 puntos" (tier leyenda)
  - "MVP en votación — cerrará en 24h"

- **P2 · Reparto de XP/puntos con animación** `@resultado`
  Al finalizar, secuencia breve (2-3 s): cada jugador aparece con sus puntos "volando" al contador. Dopamina. Se puede saltar con un tap. Usa haptics si hay app nativa.

---

## 7. Lista de jugadores

**Ruta**: `src/app/[cid]/jugadores/page.tsx`

**Estado actual**:

- Grid de PlayerCards con avatar, nombre, posición, nivel, puntos totales.
- Búsqueda / filtro (si implementado).

### 🔴 Issues detectados

1. Si el grupo tiene 20+ jugadores, el grid puede ser largo. No hay agrupación natural.
2. No hay toggle para ver "solo activos últimos 30 días".
3. La diferencia visual entre admin y no-admin depende del chip "Admin" — no siempre escaneable.

### ✨ Propuestas

- **P1 · Toggle "Activos / Todos"** `@jugadores`
  Por defecto, activos últimos 30 días. "Ver todos" muestra también los inactivos (útil para admin que quiere depurar comunidad).

- **P1 · Ordenación por "próximo partido"** `@jugadores`
  Cuando hay un partido próximo, mostrar primero los que han confirmado Sí, luego Quizá, luego el resto. Convierte la lista en "quién viene este fin de semana".

- **P2 · Quick action desde cada card** `@jugadores`
  Long-press en PlayerCard → menú: Ver perfil · Valorar · Enviar mensaje (solo si admin). Reduce navegación.

---

## 8. Perfil de jugador

**Ruta**: `src/app/[cid]/jugadores/[pid]/page.tsx`

**Estado actual**:

- Stats fila horizontal 5 chips (scroll).
- Skill bars siempre visibles (atk/def/tec/vel/emp).
- "⭐ Valorar" abre bottom-sheet.
- BadgeShowcase desplegable + BadgeVitrina (5 slots, reordenable).
- PointsEvolutionChart entre skill bars y BadgeShowcase (SVG puro, leyenda tiers, bandas, lollipops, pulse en último).
- Botón "🎓 Ver tutorial" (perfil propio).
- Timeline con chip 🎖️ N por partido.

### 🟢 Fortalezas

- El PointsEvolutionChart es premium — muy difícil de replicar sin tocar tu código.
- BadgeVitrina con 5 slots reordenables = engagement fuerte.
- Skill bars siempre visibles = pedagógico + social.

### 🔴 Issues detectados

1. En móvil pequeño (iPhone SE), la fila de 5 chips de stats es scrollable pero sin indicador → los usuarios a veces no saben que hay más.
2. El botón "Valorar" está en la parte superior, pero los **usuarios nuevos no saben cuánto pesa su voto** ni cómo funciona.
3. La sección de badges desbloqueadas + BadgeShowcase puede sentirse duplicada con la Vitrina.

### ✨ Propuestas

- **P0 · Indicador de scroll en fila de stats** `@perfil`
  Fade en los bordes derecho/izquierdo (gradiente `to-transparent`) que desaparece cuando llegas al final. Microdetalle que evita confusión.

- **P0 · Tooltip "Cómo funciona la valoración"** `@perfil`
  Al tocar "⭐ Valorar", bottom-sheet con 2 líneas explicativas antes del formulario:
  *"Tu voto cuenta igual que el resto. Las habilidades se calculan como la media de todos los jugadores que han valorado."*

- **P1 · Highlight del último partido** `@perfil`
  Encima del chart, card del último partido con "⚽ 2 · 🎯 1 · 🎖️ 9 pts" y un CTA "Ver detalle". Último partido = mayor engagement emocional.

- **P1 · Comparar con otro jugador** `@perfil`
  Botón "⚔️ Comparar" que abre picker de otro jugador y muestra side-by-side skills + stats. Feature muy compartible (screenshot para WhatsApp).

- **P2 · Timeline con filtro** `@perfil`
  Timeline puede crecer mucho. Filtros "Últimos 10" / "Este mes" / "Todo". Reduce carga cognitiva en perfiles veteranos.

---

## 9. Ranking

**Ruta**: `src/app/[cid]/ranking/page.tsx` + `RankingTable.tsx`

**Estado actual**:

- Tabs scrollables: Puntos (default, hero) · Goles · Asistencias · MVPs · Nivel · etc.
- Podio visual top 3 con plinth, aura-halo, micro-float, reflect.
- Tab Puntos hero: wrapper con `legend-rainbow` animado, icono pulsante, label Bebas.
- Lista 4+ con sparklines tier-coloreados (solo tab Puntos) + chip valor tintado por tier.
- Valor del #1 en arcoíris si tab=puntos y total ≥20.

### 🟢 Fortalezas

- Esta es **la pantalla más premium de la app**. Se siente muy por encima de la media de apps amateur.
- El podio con plinth + glow + aura funciona brutal.
- Sparklines en lista son un detalle muy "Mister-like" — apropiado.

### 🔴 Issues detectados

1. El tab Puntos es canónico pero la diferencia visual con los otros tabs podría ser todavía mayor (es la pieza comercial, debe gritar "esto es lo que me mola").
2. No hay forma de **compartir el ranking como imagen** (killer viral).
3. Lista con 30+ jugadores no tiene ancla "tu posición" → te obliga a scrollear.

### ✨ Propuestas

- **P0 · "Tu posición" sticky** `@ranking`
  Mini-fila sticky al final (o al top) tipo *"Tú → #12 · 73 pts"* cuando no estás en el top visible. Tap → scroll animado a tu fila.

- **P0 · Compartir podio como imagen** `@ranking`
  Botón 📤 arriba-derecha → genera PNG del podio + top 5 con marca FURBITO → abre share sheet. Esto es **munición de marketing directa** para WhatsApp.

- **P1 · Filtro "este mes / este año / histórico"** `@ranking`
  Rotar ranking por período temporal. "Histórico" = estado actual, pero "este mes" reengancha a usuarios que han bajado en el total acumulado.

- **P2 · Ranking por posición (GK / DEF / MID / FWD)** `@ranking`
  Sub-ranking dentro de cada posición. Premia al mejor portero, al mejor defensa, etc. Más premios = más identidad.

---

## 10. Pistas — [ELIMINADO 2026-04-23]

> **Pantalla eliminada.** Ruta `/[cid]/pistas` + componente `PistaMap.tsx` + dependencia `leaflet` removidos del repo en la decisión 2026-04-23 (ver [FEATURE_AUDIT.md §14](FEATURE_AUDIT.md#14-pistas-sin-mapa-en-web--mapa-reservado-para-nativa)).
>
> El mapa queda **aplazado a la versión nativa**, donde la UX mobile-first (geolocalización, tap-pin, Apple/Google Maps integrado) justifica el coste. En web no compensaba: el valor marginal era bajo y la complejidad geográfica (geocoding, permisos, rendimiento Leaflet) no encajaba con la naturaleza ligera de la PWA.
>
> **Qué se conservó**: tabla `pistas`, columna `pista_id` en events, columnas `lat`/`lng` en BD (listas para cuando vuelva el mapa), badges geográficos. La creación de pistas vive ahora inline en [EventForm.tsx](../../src/components/events/EventForm.tsx) vía la opción **"+ Nueva pista…"** del selector.
>
> Todas las propuestas originales de esta sección (vista dual mapa/lista, pista habitual destacada, link a Maps) se reagrupan en [PORTABILIDAD_NATIVA.md](PORTABILIDAD_NATIVA.md) bajo el apartado de features nativas.

---

## 11. Ajustes

**Ruta**: `src/app/[cid]/ajustes/page.tsx`

### 🔴 Issues detectados

(Depende del estado actual — no revisado en detalle.)

### ✨ Propuestas

- **P1 · Sección "Mi cuenta" vs "Esta comunidad"** `@ajustes`
  Separar visualmente qué afecta a mí (avatar, nombre, idioma) vs a la comunidad (nombre, color, PIN, admins).

- **P1 · Borrar cuenta / salir de comunidad** `@ajustes`
  Requisito para stores. Flujo claro con confirmación, explicación de consecuencias.

- **P2 · Exportar datos en JSON/CSV** `@ajustes`
  GDPR + diferencial. Útil para admins que quieran backup.

---

## 12. Ayuda / Tutorial

**Ruta**: `src/app/[cid]/ayuda/page.tsx`

**Estado actual**:

- Visita 1ª vez otorga badge `tutorial`.
- Revisitable desde perfil propio con botón "🎓 Ver tutorial".

### ✨ Propuestas

- **P1 · Tutorial por rol** `@ayuda`
  Flujo distinto para admin vs jugador. Admin ve cómo crear partido, generar equipos, registrar resultado. Jugador ve cómo confirmar, votar MVP, leer ranking.

- **P2 · FAQ buscable** `@ayuda`
  Lista buscable de preguntas frecuentes (con emoji icon por tema). Reduce soporte.

---

## 13. Admin (super-admin panel)

**Rutas**: `src/app/admin/page.tsx` · `src/app/admin/[cid]/page.tsx`

**Estado actual**:

- Panel rediseñado con métricas + buscador.
- Ruta por comunidad con tabs Comunidad / Jugadores / Eventos / Pistas y CRUD completo via Supabase.

### 🟢 Fortalezas

- CRUD directo es poderoso — no necesitas abrir Supabase.

### 🔴 Issues detectados

1. Es potente pero "peligroso" — una acción destructiva sin confirmación puede romper una comunidad viva.
2. Falta log de acciones (quién borró qué, cuándo).

### ✨ Propuestas

- **P0 · Confirmación doble para destructivas** `@admin`
  Borrar comunidad/jugador/evento = modal con "Escribe el nombre de la comunidad para confirmar" tipo GitHub.

- **P1 · Audit log** `@admin`
  Tabla `admin_actions` en Supabase + vista simple en panel: timestamp · quién · acción · target.

- **P2 · Modo "impersonar jugador"** `@admin`
  Entrar como un jugador específico para debuggear reportes. Muy útil en soporte.

---

## 14. Layout global: Header + BottomNav + Toast

**Rutas**: `src/components/layout/Header.tsx` · `BottomNav.tsx` · `Toast.tsx`

**Estado actual**:

- Header: subraya con `header-underline` (gradiente community-tinted) + logo con halo radial.
- BottomNav: icono activo dentro de `nav-icon-wrap` con halo; indicator superior gradient + glow.
- Toast: glass con border community-tinted, blur backdrop.
- RoleBanner según guest/player/admin.

### 🟢 Fortalezas

- BottomNav con halo tintado es elegante + informativo.
- Toast glass-morphic encaja con el resto del sistema.

### 🔴 Issues detectados

1. El header en páginas muy cargadas puede sentirse "pequeño" (56px) — algunas apps premium usan 64-72px para respiro.
2. La BottomNav no desaparece al scrollear → ocupa pantalla útil en móviles pequeños.
3. El Toast solo aparece arriba → en one-handed iPhone 15 Pro Max, queda fuera de alcance.

### ✨ Propuestas

- **P1 · Auto-hide BottomNav al scroll down** `@layout`
  Ya hay `.nav-transition` preparada. Activar: scroll down > 80px → oculta; scroll up → muestra. Gana 72px de pantalla útil en listas largas.

- **P1 · Toast en posición configurable** `@layout`
  En mobile, aparecer abajo encima de BottomNav (mejor alcance one-handed). Mantener arriba en desktop.

- **P2 · Header expandible en scroll** `@layout`
  Large-title iOS-like: 76px en scroll top, colapsa a 56px al bajar. Opcional, solo si el tiempo lo permite.

---

## 15. Cross-cutting: mejoras que afectan a varias pantallas

### 15.1 Empty states con personalidad

🔴 Muchos empty states actuales son texto plano ("No hay X todavía").

✨ **P1 — Empty states ilustrados** con:
- Iconografía coherente (el mismo set en toda la app)
- CTA claro ("Crear el primer partido" / "Invita al primer jugador")
- Tono cercano ("Todavía no, pero cuando lo hagas…")

Surfaces afectadas: `@partidos`, `@jugadores`, `@ranking`, `@pistas`, `@feed`.

### 15.2 Loading states

🔴 Algunos componentes no tienen Skeleton coherente.

✨ **P1 — Skeletons por tipo**: de PlayerCard, de EventCard, de RankingRow, de StatChip. Reuso en todas las pantallas.

### 15.3 Onboarding contextual

🔴 El tutorial global es útil pero nadie aprende todo de una vez.

✨ **P2 — Tips contextuales**:
- Primera vez que llegas al Resultado: "Vamos paso a paso, no puedes romper nada."
- Primera vez que llegas a Equipos como admin: "Genera equipos con 1 tap."
- Almacenar en localStorage como `furbito_tips_seen` JSON.

### 15.4 Accesibilidad

🔴 Algunos elementos con solo color como señal (verde/rojo) excluyen daltónicos.

✨ **P1 — Añadir icono o texto a estados semánticos**:
- Confirmación Sí/No/Quizá: ya hay color + texto, reforzar con icono consistente.
- Tiers de puntos: hay color + número, añadir label breve ("Regular", "Bueno", "Legendario") en el chip detallado.

### 15.5 Consistencia de modals

🟢 Modal `variant="window"` ya se usa en varios sitios.

✨ **P1 — Auditar** todos los modals: todos los editables deben usar `variant="window"`; los confirmatorios pueden ser más ligeros (bottom-sheet). Ya detectado en VitrinaEditor.

### 15.6 Localización futura

✨ **P2 — Preparar i18n para EN**. Hoy todo es ES. Cuando llegue crecimiento internacional:
- Extraer strings a `src/i18n/es.json`.
- Estructurar por surface, no por key plana.

### 15.7 Feedback visual para acciones destructivas

🔴 Revoca voto / salir de confirmación / borrar → en ocasiones el feedback es solo un toast, que puede pasar desapercibido.

✨ **P1 — Haptic fuerte + toast con "Deshacer"** por 5s en acciones importantes. Patron iOS Mail-style.

---

## 16. Pre-nativa: decisiones que ahorran trabajo luego

Muchas de las mejoras anteriores se deben **implementar primero en web** con la idea de que se porten a nativo. Otras hay que hacerlas **ya pensando en la paridad**.

### 16.1 Efectos CSS que NO se portan

Los siguientes efectos viven solo en CSS + browser APIs. En RN habrá que sustituirlos (decisión documentada en la DB `📱 NATIVE APP / 🎨 Paridad de pantallas`):

| CSS actual | Alternativa nativa sugerida |
|------------|----------------------------|
| `.shine-sweep` (barrido diagonal en hover) | Sustituir por pulse en tap (reanimated) o eliminar (RN no tiene hover real) |
| `.aura-halo` (radial breathing) | `Animated.View` con opacity + scale loop |
| `.legend-rainbow` (gradient animado) | `react-native-linear-gradient` + `reanimated` worklet animando `start`/`end` |
| `.hairline-top::after` | `LinearGradient` absoluto fino (1px height) |
| `.card-glow` (hover border) | Eliminar en mobile (no hay hover real) |
| `::before / ::after` en general | En RN no existen; se convierten en `<View>` absolutes |
| `backdrop-filter: blur()` | `expo-blur` (`BlurView`) para glass effect |
| `mix-blend-mode` | No existe en RN; sustituir por tint + opacity calibrado |
| SVG `<animate>` inline (en `PointsEvolutionChart`) | `react-native-svg` + reanimated worklet |

### 16.2 Tokens que SÍ se portan

Los siguientes son puramente valores → crear `src/theme/tokens.ts` compartido (web + nativa):

```ts
export const tokens = {
  color: {
    bg: '#050d05',
    bg2: '#0a180a',
    accent: '#a8ff3e',
    red: '#ff5c5c',
    orange: '#ff9030',
    gold: '#ffd700',
    muted: 'rgba(240,240,240,0.55)',
    border: 'rgba(255,255,255,0.08)',
  },
  radius: { s: 10, m: 14, l: 20 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  fontSize: { xs: 11, sm: 12, base: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 32 },
  fontFamily: { display: 'Bebas Neue', body: 'Barlow' },
  // ... etc
}
```

En web, `globals.css` lo consume via variables; en RN, los componentes lo consumen via StyleSheet.

### 16.3 Lógica que se copia literal

Ya documentado en `GUIA_MIGRACION_APP_NATIVA.md`: `src/types/index.ts` y `src/lib/game/*.ts` son copia directa.

### 16.4 Patrones de UX que requieren adaptación nativa

| Patrón web | Equivalente nativo |
|------------|--------------------|
| Modal `variant="window"` | `react-native-modal` con presentación `fullScreen` o `formSheet` |
| Bottom-sheet (VitrinaEditor, Valorar) | `@gorhom/bottom-sheet` |
| Toast arriba | `react-native-toast-message` (posición configurable) |
| Long-press en web (cards) | `onLongPress` de TouchableOpacity |
| Swipe para acción rápida | `react-native-swipe-list-view` o `reanimated Gesture` |
| Haptics (no existe en web) | `expo-haptics` (nuevo — aprovechar) |
| Push notifications (flaky en PWA) | `expo-notifications` (feature killer de la versión nativa) |

---

## 17. Resumen priorizado — top 15 mejoras

Ordenadas por **ratio impacto / coste** para ejecutar antes del lanzamiento público:

| # | Mejora | Surface | Prioridad |
|---|--------|---------|-----------|
| 1 | Tagline con beneficio concreto | `@login` | P0 |
| 2 | Tira "Pendiente de ti" | `@home` | P0 |
| 3 | CTA guest → jugador | `@home` | P0 |
| 4 | Barra de progreso + contador confirmados | `@partido` | P0 |
| 5 | Equipos visibles para confirmados | `@equipos` | P0 |
| 6 | Undo de 5 min al finalizar partido | `@resultado` | P0 |
| 7 | Validación de goles vs marcador | `@resultado` | P0 |
| 8 | "Tu posición" sticky en ranking | `@ranking` | P0 |
| 9 | Compartir podio como imagen | `@ranking` | P0 |
| 10 | Confirmación doble en admin destructivo | `@admin` | P0 |
| 11 | ~~Vista dual mapa/lista en pistas~~ — módulo mapa eliminado 2026-04-23, aplazado a nativa | `@pistas` | — |
| 12 | Empty states con personalidad | cross | P1 |
| 13 | Auto-hide BottomNav al scroll | `@layout` | P1 |
| 14 | Highlight último partido en perfil | `@perfil` | P1 |
| 15 | Tokens compartidos (theme/tokens.ts) para paridad nativa | `@native` | P1 |

---

## 18. Proceso para anexar screenshots

Los screenshots del estado actual deben anexarse en Notion, no en el repo. Flujo recomendado:

1. **Captura** con Chrome DevTools → device frame (iPhone 15 Pro Max vertical) a 100% zoom.
2. **Nomenclatura**: `fb_<surface>_<fecha>_<estado>.png` — ej. `fb_home_2026-04-23_v2.png`.
3. **Subir** a la página correspondiente de Notion (sección `📦 PRODUCT / ✨ Features` o equivalente).
4. Al proponer cada mejora en Notion, referenciar el screenshot inline.
5. Tras implementar, capturar el estado nuevo y marcarlo como `after` para comparar.

---

> **Documentos relacionados**:
> - [FURBITO_DESIGN_SYSTEM.md](./FURBITO_DESIGN_SYSTEM.md) — tokens y componentes canónicos
> - [NOTION_RECONFIG.md](./NOTION_RECONFIG.md) — dónde vive esta auditoría como features
> - [MARKETING_PLAN.md](./MARKETING_PLAN.md) — qué mejoras impactan a conversión/retención
