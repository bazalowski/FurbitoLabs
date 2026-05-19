# FURBITO — Auditoría premium (mantener / elevar / esconder / cortar)

> **Fecha**: 2026-05-18 · **Estado**: working document
> **Propósito**: cribar la app para el soft-launch. La regla de oro es **menos features mejor presentadas** en lugar de más features apiladas.
> Este documento NO sustituye [FEATURE_AUDIT.md](FEATURE_AUDIT.md) ni [UI_AUDIT_PANTALLAS.md](UI_AUDIT_PANTALLAS.md) — los complementa con una lente distinta: **qué deja brillar la app**.

---

## 0. Filosofía del cribado

Cuatro principios que mandan sobre todo lo demás:

1. **Una cosa por pantalla**. Si una pantalla tiene 4 cards equivalentes apiladas, es una tab disfrazada — no es premium. Premium = jerarquía visual brutal: 1 protagonista, todo lo demás subordinado.
2. **Cortar > esconder > elevar**. Antes de pulir, eliminar. Antes de eliminar, esconder. Lo último es invertir tiempo en pulir.
3. **Cero "AI-generic"**. Fuera footers con "Powered by", versiones visibles, copy genérico, emojis decorativos sin sentido, gradientes pastel sin propósito. La app debe oler a producto pensado, no a starter de Next.js.
4. **Lo invisible cuenta tanto como lo visible**. Tipografía mono (`font-mono`), divider-dot, font-bebas, hairlines, shadows tintadas — el premium feel viene 70% de microdetalles, 30% de animaciones.

---

## 1. Tabla maestra de decisiones

Por sección funcional, decisión + acción inmediata. **Surface = pantalla**, **Feature = funcionalidad dentro**.

### Login / onboarding

| Item | Decisión | Acción |
|------|----------|--------|
| Gate inicial 2 cards (Nuevo / PIN) | **ELEVAR** | Mantener estructura. Mejorar tagline (P0 UI_AUDIT). |
| Tagline "Partidos, equipos y ranking. Sin WhatsApp." | **MANTENER** | Es posicionamiento de marca — funciona. |
| Logo + skewX(-8deg) + glow | **MANTENER** | Carácter fuerte. |
| Footer "FURBITO v2.1 · Powered by Supabase" | **CORTAR** | Versión interna + powered-by = look de starter. Solo links legales. |
| Tutorial badge `tutorial` al primer ingreso | **MANTENER** | Pequeño gamification, ok. |
| Carrusel de previews bajo el gate (P1 UI_AUDIT) | **APLAZAR** | No es premium hasta tener screenshots de calidad de la propia app — circular. |

### Home (`/[cid]`)

| Item | Decisión | Acción |
|------|----------|--------|
| PlayerCard arena (yo) | **ELEVAR** | Es la portada del jugador. Convertirla en métrica protagonista con números Bebas. |
| Stats 3-col (jugadores/próximos/jugados) | **MANTENER** | Compacto, calm. Ok. |
| Shortcut MVP pendiente | **MANTENER** | Solo aparece si hay pending. Bueno. |
| Shortcut "Valorar compañeros" (siempre visible) | **ESCONDER** | Convertir en empty-state contextual del NextMatchHero ("este partido — valora a los del último"). Hoy compite con todo. |
| Shortcut "Cómo usar Furbito" (tutorial) | **ESCONDER** | Mover a primera visita únicamente (1 vez), no banner permanente. Power user no lo necesita. |
| NextMatchHero | **ELEVAR** | Hero real de la pantalla. Más respiro vertical, más Bebas, hairlines tintadas. |
| Botón "Generar equipos" + TeamGenerator inline | **ESCONDER** | Mover al detalle de partido (donde tiene sentido) y/o al admin panel. Hoy compite con NextMatch. |
| WallPreview | **MANTENER** | Reciente. Vive bien al final. |
| `?tab=...` querystring en stats 3-col | **MANTENER** | Funcional. |

**Diagnóstico Home**: hoy hay hasta **8 cards apiladas verticalmente** sin jerarquía → el feel "AI-generic" que te molesta nace aquí. Premium = 1 protagonista (PlayerCard o NextMatch), todo lo demás subordinado.

### Partidos (lista + detalle + resultado)

| Item | Decisión | Acción |
|------|----------|--------|
| Lista cronológica | **MANTENER** | Funcional. |
| Sticky headers "Próximos / Pasados" (P0 UI_AUDIT) | **APLAZAR** | Bueno pero no premium-critical. |
| Tabs Convocados / Equipos / Resultado | **MANTENER** | Patrón claro. |
| Realtime confirmaciones | **MANTENER** | Diferencial. |
| Botón compartir partido por WhatsApp | ✅ CORTADO 2026-05-18 | — |
| Generador de equipos (TeamGenerator) | **MANTENER** | Feature killer. Pulir sólo el reveal (Paso 2 = arena). |
| Modo "random" del generador | **CORTAR** | Quita el atractivo del balanceador. Mantener solo balanced. |
| Stepper resultado 3 pasos | **MANTENER** | Bien diseñado. |
| Undo 15 min | **MANTENER** | Reciente, importante. |
| MVP votación (24h auto-close) | **MANTENER** | Mejor motor social. |

### Jugadores / Perfil

| Item | Decisión | Acción |
|------|----------|--------|
| Lista grid PlayerCards | **MANTENER** | Calm-friendly. |
| Avatar emoji con tinte community | **MANTENER** | Cero coste, mucho carácter. |
| Skill bars (atk/def/tec/vel/emp) siempre visibles | **MANTENER** | Pedagógico, social. |
| PointsEvolutionChart (SVG con bandas tier) | **ELEVAR** | Es la pieza premium del perfil. Más espacio, más respiro, fade scroll en bordes. |
| BadgeShowcase + BadgeVitrina (5 slots) | **MANTENER** | Coleccionismo. |
| Lista completa de 200+ badges | **ESCONDER** | Mostrar solo desbloqueadas + 5 "más cerca de conseguir". El resto detrás de "ver colección completa". |
| Botón "🎓 Ver tutorial" en perfil propio | **CORTAR** | Mover a Ajustes. No es contenido del perfil. |
| Botón "⭐ Valorar" en perfil | **MANTENER** | Aquí sí tiene sentido. |
| Stats fila de 5 chips (scroll horizontal) | **MANTENER** | Mejorar indicador de scroll (P0 UI_AUDIT). |

### Ranking

| Item | Decisión | Acción |
|------|----------|--------|
| Tab Puntos hero con legend-rainbow | **ELEVAR** | Ya es la pieza más premium. Falta compartir-como-imagen + sticky "Tu posición". |
| Podio top 3 con plinth, aura, reflect | **MANTENER** | Brutal. Preservar. |
| Sparklines por jugador en lista 4+ | **MANTENER** | Diferencial. |
| Tab "Goles" | **MANTENER** | — |
| Tab "Asistencias" | **MANTENER** | — |
| Tab "MVPs" | **MANTENER** | — |
| Tab "PJ" (partidos jugados) | **MANTENER** | Métrica informativa, no compite con Puntos. |
| Tab "Rating" (valoración inter-jugadores) | **MANTENER** | Métrica social distinta a Puntos. |
| Compartir podio como imagen (P0 UI_AUDIT) | **ELEVAR a P0** | Crítico: munición viral directa. |
| Sticky "Tu posición" cuando estás fuera del top | **ELEVAR a P0** | Cierra el loop motivacional. |

### Ajustes

| Item | Decisión | Acción |
|------|----------|--------|
| Card Comunidad (color + PIN) | **MANTENER** | — |
| Botón "Invitar por WhatsApp" | ✅ CORTADO 2026-05-18 | — |
| Sección Admin Management | **MANTENER** | — |
| Preferencias de push | **MANTENER** | — |
| Theme toggle | **MANTENER** | — |
| Logout | **MANTENER** | — |
| "Borrar cuenta / salir de comunidad" (P1 UI_AUDIT) | **PENDIENTE** | Requisito stores; aún no implementado. |
| Sección "Acerca de" con versión | **CORTAR** | Versión interna no aporta. |

### Muro

| Item | Decisión | Acción |
|------|----------|--------|
| Posts texto + reacciones + YT embed | **MANTENER** | Reciente, sólido. |
| Posts del sistema (created/result/mvp) | **MANTENER** | Cierran el loop. |
| WallPreview en Home | **MANTENER** | — |
| Composer sticky | **MANTENER** | — |

### Otras pantallas

| Item | Decisión | Acción |
|------|----------|--------|
| `/ayuda` (pantalla dedicada de tutorial) | **ESCONDER** | Convertir en tooltips contextuales primera vez + 1 link en Ajustes. Pantalla dedicada = peso visual sin uso recurrente. |
| `/valorar` (pantalla dedicada con sliders) | **MANTENER** | Pero promocionarla solo post-partido + perfil. Quitar del shortcut Home (ver arriba). |
| Panel admin `/admin` | **MANTENER** | Solo para super-admin. No premium-critical. |
| Generador de equipos en Home (standalone) | **CORTAR** | Mueve siempre al partido. Quita la duplicación. |

### Sistema de badges (vista cross-cutting)

| Item | Decisión | Acción |
|------|----------|--------|
| 200+ badges definidos | **MANTENER (back)** | El catálogo sigue, pero la **exposición se cribra**. |
| Vista "ver todos los badges" | **ESCONDER** | Detrás de un toggle "ver todos (200)". Por defecto: solo los del jugador + ~10 "próximos". |
| Badges sin detector cableado (sec 12 gap 6) | **CORTAR** | Si no se disparan, no existen para el usuario. Borrar del catálogo o cablear. Acción ⚙️. |
| Badges duplicados semánticamente (sec 12 gap 6, P2 podar) | **ESCONDER** | Familias `partidos_5/10/...` + `veterano/habitual/...` colapsar en tiers bronce/plata/oro. Reducir ruido. |
| Niveles 9-99 sin marker | **CORTAR o ESCONDER** | Decisión: o marker cada 10 (L10, L20, ..., L90) o cortar markers post-L8 y celebrar solo el nivel. Hoy: silencio entre L8 y L99 = pobre. |

### Footer / branding

| Item | Decisión | Acción |
|------|----------|--------|
| "FURBITO v2.1 · Powered by Supabase" | **CORTAR** | Look de starter. |
| Links Privacidad / Términos / Ayuda | **MANTENER** | Requisitos stores. |
| RoleBanner (guest/player/admin) | **MANTENER** | — |

---

## 2.bis · Sprint Furbito 3.0 (2026-05-19)

Segunda pasada de depuración hacia "Furbito 3.0" — orientada a lanzamiento.

- ✅ **Muro hideado**: WallPreview fuera del Home. Ruta `/[cid]/muro` sigue accesible (no se borra DB ni componentes — reactivable cuando el muro tenga push + imágenes).
- ✅ **Shortcut "Valorar compañeros" reincorporado** en el Home como acceso directo siempre visible (cuando hay ≥2 jugadores). Decisión del usuario: el voto entre jugadores es loop de retención crítico y debe estar a 1 tap.
- ✅ **Fusión Jugadores + Ranking**: la pantalla `/[cid]/jugadores` ahora renderiza `<RankingTable />` como cuerpo (con podio top 3 + tabs métrica + ventana temporal + filtro de rol). La ruta `/[cid]/ranking` queda como redirect server-side a `/jugadores`.
- ✅ **BottomNav de 5 → 4 tabs**: Inicio · Partidos · Jugadores · Perfil. Más espacio por tab, menos fricción cognitiva.
- ✅ **Partidos pulido**: tab selector de "split bar plano" → "pills premium" con community-tint cuando activo y contadores `font-mono`. Botón "+ Nuevo" community-tinted. Empty state canónico (Bebas 3xl + Mono subtítulo + Button primary).

Decisiones de scope:
- **Delete inline de jugador (admin)** retirado del listado fusionado — la lista ahora es ranking, no es lugar para acciones destructivas. Reubicación pendiente: añadir "Eliminar jugador" como acción admin en el perfil del jugador. NO regresión funcional: admin sigue gestionando vía Supabase + panel admin.
- **Perfil intacto**: ya usa `surface-arena` con aura-halo, Bebas 4xl, reliability chip, fade edges en stats fila. No tocado para no romper lo que funciona.

---

## 2. Cambios inmediatos del sprint premium

Acciones concretas para esta semana — orden de ejecución:

1. ✅ **Eliminar WhatsApp completo** (lib + 2 botones + import). HECHO 2026-05-18.
2. **Cortar footer "Powered by Supabase" + versión visible**. Mantener solo links legales.
3. **Esconder shortcut Valorar y Tutorial del Home**. Recolocar como ya descrito.
4. **Cortar generador de equipos standalone del Home** (queda solo en partido).
5. **Cortar modo "random" del TeamGenerator**.
6. **Quitar botón "Ver tutorial" del perfil** (ya accesible desde Home como ShortcutCard cuando aún no se tiene el badge).
7. **Esconder la lista exhaustiva de 200+ badges** detrás de un toggle — se aplaza al pulido del perfil.

Tras estos cortes → la app pierde grasa. Entonces se entra al **pulido sistemático** de las 4 pantallas hero.

---

## 3. Las 4 pantallas hero (pulido a 10/10)

Estas son las pantallas que reciben el 80% del tráfico y, por tanto, definen la percepción premium del producto:

### 3.1 · Login (primera impresión)

**Por qué hero**: 100% de los usuarios pasa por aquí. Define si entran o no.

**Pulido**:
- Footer minimalista (solo legales).
- Tagline mantenido.
- Logo + glow ya bien.
- En `Footer`, font-mono más pequeño, espaciado más generoso.
- Botón "Crear comunidad" debe ser arena (1 hairline-top), no calm.
- Color picker: aumentar contraste del seleccionado.

### 3.2 · Home (`/[cid]`)

**Por qué hero**: lo primero al loguear. Define el "premium feel" en cada apertura.

**Pulido**:
- PlayerCard arena → métrica protagonista: nombre Bebas grande + 1 KPI grande (puntos totales o nivel) en font-bebas 48px+. XP bar mantener.
- Stats 3-col → mantener calm pero subir Bebas a 32px y reducir el emoji a 16px.
- NextMatchHero → más respiro vertical (`p-5` o `p-6`), hairline-top obligatorio, score-slab si hay equipos.
- WallPreview → mantener.
- **Quitar todos los shortcuts visuales redundantes** (Valorar, Tutorial, Generador) — entran cuando son contextuales, no fijos.

Resultado: pantalla con 4 elementos verticales claros (Hero PlayerCard, Stats grid, NextMatch, WallPreview). Hoy son hasta 8.

### 3.3 · Ranking (`/[cid]/ranking`)

**Por qué hero**: pieza más viral. Compartir un podio → adquisición orgánica.

**Pulido**:
- Reducir tabs a 4 (Puntos, Goles, Asistencias, MVPs).
- Añadir botón "📤 Compartir podio" arriba a la derecha (genera PNG con marca FURBITO).
- Sticky "Tu posición · #N · X pts" cuando estás fuera de los 3 top visibles.
- Mantener legend-rainbow + plinth + sparklines.

### 3.4 · Perfil de jugador (`/[cid]/jugadores/[pid]`)

**Por qué hero**: moneda emocional. La pantalla donde el jugador vuelve a mirarse cada día.

**Pulido**:
- PointsEvolutionChart → más espacio, fade en bordes scroll, leyenda más limpia.
- Skill bars → mantener.
- BadgeVitrina (5 slots) → mantener.
- Esconder la lista exhaustiva de badges detrás de un toggle "ver colección (N/200)".
- Quitar botón "🎓 Ver tutorial" del perfil propio.
- Stats fila 5 chips → fade en borde derecho (indica que hay más).

---

## 4. Cosas que NO se tocan

Para evitar gold-plating, estas piezas están bien y no necesitan inversión:

- TeamGenerator (algoritmo + UI v3).
- MVP votación + finalize.
- Realtime de confirmaciones.
- Sistema de tiers (mal/regular/bueno/excelente/leyenda).
- Sentry + observabilidad reciente.
- Push notifications.
- Score de fiabilidad.
- Undo 15 min.
- Posts automáticos del muro.
- PWA + service worker.

---

## 5. Notas para futuras revisiones

- Esta auditoría se **invalida** si después de pulir las 4 hero y cortar lo previsto, el feeling sigue siendo "AI-generic" → entonces el problema no es features, es **tipografía/spacing/motion** y hay que volver a [FURBITO_DESIGN_SYSTEM.md](FURBITO_DESIGN_SYSTEM.md) y exigir más restraint en surface calm.
- Si una feature cortada vuelve a aparecer en una review futura, **debe pasar por el filtro**: ¿elevar a 10/10 o esconder/cortar otra vez?
- Cuando se complete una acción de §2, se tacha aquí y se documenta en commit. No hay que mover items entre tablas constantemente — la tabla es contrato, los commits son historia.
