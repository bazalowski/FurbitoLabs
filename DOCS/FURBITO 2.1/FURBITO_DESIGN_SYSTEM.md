# FURBITO — Design System canónico v2 (Athletic-Luxury)

> **Propósito**: fuente única de verdad del sistema de diseño de FURBITO.
> Todo cambio en UI debe respetar este documento. Si algo en el código se separa de aquí, **el código está mal** (o el documento está desactualizado — ajustar).
>
> **Audiencia**: desarrollador humano + agente (Claude, Cursor, etc.) trabajando en el repo.
> **Fecha**: 2026-04-23 · **Versión**: 2.0 — Athletic-Luxury
> **Stack**: Next.js 14 + Tailwind + CSS custom properties (`src/app/globals.css`).

---

## 0. Principios rectores (v2)

El sistema no es "un tema dark más". Tiene carácter. Para preservarlo, respetar siempre estos 8 principios:

1. **Dualidad `calm` vs `arena`** (nuevo en v2 — el más importante). El sistema distingue dos registros de superficie:
   - **`calm`** (navegación, listas, perfil base, forms, filtros, ajustes): restraint absoluto. Monocromo + acento puntual. Cero glows. Motion 180ms.
   - **`arena`** (post-match, podio, historial con rachas, badges, detalle partido finalizado, TeamGenerator resultado): intensidad máxima. Tiers a saturación, gradientes, rainbow (leyenda), halos de reveal, motion de celebración.
   El contraste entre ambos es lo que hace premium. Si todo grita, nada grita.
2. **Dark fotográfico por defecto, light como alternativa funcional**. El dark es la identidad; el light sobrevive pero no lidera decisiones.
3. **Color de comunidad (`--comm-color`) como tinta, no como fondo**. Modula sombras, bordes, halos y números protagonistas. Nunca rellena fondos grandes.
4. **Jerarquía tipográfica a 3 familias**: Bebas (display hero), Barlow (cuerpo/labels), IBM Plex Mono (datos técnicos: deltas, fechas, contadores, índices). El font-mono es el hack premium clave v2.
5. **Números son ciudadanos de primera**. Bebas + tabular-nums + `letter-spacing: -0.02em` en los grandes. Nunca perder columnas al cambiar un número.
6. **Polish es opt-in y condicional**. Máx 1 utility en calm, máx 2 en arena. Las animaciones entran al aparecer, no viven eternamente (excepto idle animations intencionales en arena como `chip-pulse` de elementos "en vivo").
7. **Hairlines para estructura, glows para reward**. Ver un glow = algo pasó. Ver muchos glows = nada pasó.
8. **Respect `prefers-reduced-motion`**. Todas las animaciones se neutralizan. Nunca depender exclusivamente de animación para comunicar información.

---

## 1. Tokens

**Fuente**: `src/app/globals.css` (variables CSS `:root`) y `tailwind.config.ts`.

### 1.1 Color

#### Dark (default)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--bg` | `#040807` | Fondo de la página (más profundo que v1) |
| `--bg2` | `#0a1210` | Superficies secundarias (nav, modal bg, cards calm) |
| `--bg3` | `#131a17` | Elevated / panels |
| `--card` | `rgba(255,255,255,0.045)` | Fondo de cards (glass) |
| `--card2` | `rgba(255,255,255,0.07)` | Card hover / elevada |
| `--border` | `rgba(255,255,255,0.08)` | Borde estándar de card |
| `--border-a` | `rgba(168,255,62,0.22)` | Borde tintado acento |
| `--accent` | `#a8ff3e` | Acento principal (electric turf, default sin comunidad) |
| `--accent-d` | `rgba(168,255,62,0.12)` | Accent "dim" para fondos sutiles |
| `--accent-g` | `rgba(168,255,62,0.35)` | Accent "glow" para halos |
| `--text` | `#f0f0f0` | Texto principal |
| `--muted` | `rgba(240,240,240,0.55)` | Texto secundario / placeholder |
| `--red` | `#ff4d4d` | Error / destructivo (subido desde `#ff5c5c` en v2) |
| `--orange` | `#ff8a1f` | Warning / "regular" (subido desde `#ff9030` en v2) |
| `--gold` | `#ffd700` | Oro / logros / admin |
| `--comm-color` | dinámico (default `#a8ff3e`) | **Color dinámico de la comunidad** |

#### Tiers Puntos Furbito (intocables)

Los 5 tiers de puntuación Comunio son parte del contrato de gamificación — no se modifican sin plan explícito:

| Tier | Color base | Rango pts | Tratamiento arena |
|------|-----------|-----------|-------------------|
| `mal` | `#ef4444` | <5 | Chip sólido rojo, sin reward |
| `regular` | `#f97316` | 5–7 | Chip sólido naranja, sin reward |
| `bueno` | `#22c55e` | 8–10 | Chip sólido verde, sin reward |
| `excelente` | `#06b6d4` | 11–19 | Gradient verde→cyan, hairline-top |
| `leyenda` | rainbow | ≥20 | `legend-rainbow` + `legend-halo` — el **único** contexto legítimo para rainbow en la app |

Codificados en `.chip-tier[data-tier="..."]` (ver §3).

#### Light (sobrescritas con `:root[data-theme="light"]`)

El light theme es **funcional, no identitario**. Optimizado para lectura diurna; las decisiones de diseño se toman sobre dark.

| Variable | Valor |
|----------|-------|
| `--bg` | `#f5f5f5` |
| `--bg2` | `#ffffff` |
| `--accent` | `#5a8f00` |
| `--text` | `#1a1a1a` |
| `--muted` | `#666666` |

#### Sombras tintadas (derivadas de `--comm-color`)

```css
--shadow-tint:        color-mix(in srgb, var(--comm-color) 12%, transparent);
--shadow-tint-strong: color-mix(in srgb, var(--comm-color) 22%, transparent);
--shadow-depth-1: 0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.35), 0 2px 8px var(--shadow-tint);
--shadow-depth-2: 0 1px 0 rgba(255,255,255,0.05) inset, 0 2px 4px rgba(0,0,0,0.4),  0 8px 24px var(--shadow-tint);
--shadow-depth-3: 0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 8px rgba(0,0,0,0.45), 0 16px 48px var(--shadow-tint-strong);
--shadow-lift:    0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 14px rgba(0,0,0,0.45),0 12px 32px var(--shadow-tint-strong);
```

> **Regla**: cuando necesites profundidad, **no inventes** un `box-shadow`. Usa una de las 4 escalas: `depth-1` (card plana), `depth-2` (card hero), `depth-3` (modal/popover), `lift` (hover).

### 1.2 Radios

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-s` | `10px` | Inputs, chips, botones pequeños |
| `--radius-m` | `14px` | **Default de cards y botones** |
| `--radius-l` | `16px` | Cards hero, modals (BAJADO desde `20px` en v2 para feel editorial) |

Tailwind equivalente: `rounded-s` · `rounded-m` · `rounded-l`.

### 1.3 Espaciado (Tailwind)

No hay tokens custom — Tailwind default. Convenciones:

- **Gutters entre cards**: `gap-3` (12px) default · `gap-4` (16px) en hero/spacious.
- **Padding de card**: `p-4` (16px) default.
- **Padding de botón**: `px-4 py-3` (md) · `px-3 py-3` (sm) · `px-5 py-3.5` (lg).
- **Safe area bottom**: utility `.pb-nav` (ya contempla `--nav-h` + `--safe-bottom` + 20px).

### 1.4 Tipografía (v2 — tres familias)

#### Familias

| Familia | Font | Uso |
|---------|------|-----|
| **Bebas Neue** (`font-bebas`) | Display, cursive | Números grandes (scores, stats, XP), títulos impactantes, nombres de equipo, podio |
| **Barlow** (`font-barlow`) | 300/400/500/600/700/900 | Cuerpo, UI, labels, párrafos |
| **IBM Plex Mono** (`font-mono`) — **NUEVO v2** | 400/500/700 mono | Datos técnicos: deltas (`↑+3`, `↓−1`), fechas, contadores (`14h 23m`), timestamps, índices (`#4`, `#5`), rachas (`×3`) |

El **font-mono es el hack premium clave v2**. Apps atléticas serias (Whoop, Strava rediseñado, Oura) lo usan para separar visualmente "dato calculado" de "texto narrativo". Sin él, la app se siente web-consumer; con él, instrumento deportivo.

#### Jerarquía canónica

| Rol | Familia | Size | Weight | Notas |
|-----|---------|------|--------|-------|
| Display hero | Bebas | 48–96px | 400 | `letter-spacing: -0.02em` en ≥40px. `tabular-nums`. Solo UNO por pantalla. |
| Subdisplay | Bebas | 22–32px | 400 | Equipos, tier label grande, stat secundaria. |
| Number chip | Bebas | 18–22px | 400 | Chip de puntos, filas de ranking. |
| Section title | Barlow | 11–13px | 700 uppercase `tracking-widest` | Headers de sección |
| Body | Barlow | 14px | 400 | Base de la app |
| Caption / muted | Barlow | 12px | 500 | color `--muted` |
| Tech data | IBM Plex Mono | 10–12px | 500 | **Deltas, fechas, contadores, índices, rachas** |

#### Utilidades clave en `globals.css`

```css
.font-bebas { font-family: 'Bebas Neue', cursive; font-variant-numeric: tabular-nums; }
.font-barlow { font-family: 'Barlow', sans-serif; }
.font-mono  { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.tabular-nums, .stat-num, .score, .xp { font-variant-numeric: tabular-nums; }
.fw-medium { font-weight: 500; }
.fw-semi   { font-weight: 600; }
.tracking-display { letter-spacing: -0.02em; }
```

### 1.5 Z-index

**No inventes z-index**. Usa la escala:

```css
--z-base:     0;
--z-grain:    1;
--z-elevated: 10;
--z-sticky:   20;
--z-nav:      30;
--z-overlay:  40;
--z-modal:    50;
--z-toast:    60;
```

Y los `data-role` del CSS:

```html
<div data-role="sticky">...</div>
<div data-role="modal">...</div>
```

### 1.6 Motion & easing

| Variable | Valor | Cuándo usar |
|----------|-------|-------------|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot / aparición juguetona (toasts, pops) |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | **Default** para interacciones (hover, tap, transitions) |

**Duraciones guía**:
- Micro-tap / hover: **180ms**
- Toast / modal enter: **250-350ms**
- Animación decorativa (aura, shine): **800ms-3s**

**Regla**: si una animación dura más de 400ms en una interacción directa (no decorativa), está mal. Acorta.

---

## 2. Superficies: `calm` vs `arena` (regla rectora v2)

Toda zona de UI se clasifica en uno de los dos registros. Esta clasificación se hace **antes** de elegir componentes y utilities.

### 2.1 · Tabla de decisión rápida

| Pantalla/sección | Registro | Por qué |
|-----|-----|-----|
| Home (player card, stats, ActivityFeed, shortcuts) | **calm** + beats arena puntuales | Navegación. Solo NextMatchHero tiende a arena cuando hay partido próximo. |
| Layout global (Header, BottomNav, navegación) | **calm** | Chrome de navegación. |
| Perfil jugador — skill bars, stats chips | **calm** | Datos de referencia. |
| Perfil jugador — PointsEvolutionChart, BadgeVitrina, timeline con rachas | **arena** | Gamificación. |
| Detalle partido **no finalizado** (convocados, equipos generados) | **calm** | Preparación. |
| Detalle partido **finalizado** (renderResultado) | **arena** | El clímax de la app. |
| Resultado stepper — Paso 1/2 (marcador, stats) | **calm** | Formulario de entrada. |
| Resultado stepper — Paso 3 (resumen con puntos Comunio) | **arena** | Reveal de puntuación. |
| Ranking — selector temporal, tabs, filtro de rol, lista 4+ | **calm** | Filtros/lista. |
| Ranking — podio top 3, sticky "tú + delta" | **arena** | Celebración. |
| TeamGenerator — Paso 1 (selección de jugadores) | **calm** | Formulario. |
| TeamGenerator — Paso 2 (resultado equilibrado) | **arena** | Reveal teatral. |
| Ayuda/tutorial, ajustes, perfil de admin, forms | **calm** | Utilitario. |
| Modals de confirmación | **calm** | Acción puntual. |
| Modal de badge unlocked, MVP reveal | **arena** | Celebración. |

### 2.2 · Reglas por registro

| Dimensión | `calm` | `arena` |
|-----------|-----|-----|
| Fondo card | `.surface-calm` (`--bg2` sólido, border plano, shadow-depth-1) | `.surface-arena` (card glass + tinte community, shadow-depth-2, hairline-top) |
| Polish utilities | Máx **1** por elemento. Solo `hairline-top` en CTA primary. | Máx **2** por elemento. `hairline-top` + 1 de: `aura-halo` (reveal), `plinth-reflect`, `card-glow`, `micro-float`. |
| Color protagonista | Monocromo + acento puntual community (borde focus, underline activo, tinta número). | Tiers a saturación, gradientes, rainbow (leyenda real), community-color como tinta protagonista. |
| Motion | 180ms enter max. **Cero idle animation.** | Reveals 600–1200ms al entrar viewport. Idle permitido **solo** en elementos reward (`chip-pulse` de live, `aura-halo` post-reveal opcional). |
| Tipografía | Barlow prevalece. Máx **1** Bebas protagonista por pantalla. | Bebas protagonista + múltiples subdisplay Bebas permitidos. `font-mono` obligatorio para deltas/fechas/contadores. |
| Emojis | Solo en contenido (nombres de stats, resultado partido). Chrome usa iconos monocromos. | Emojis temáticos (🏆 🥇 🥈 🥉 🧤 ⚽ 🎯 🎖️ ⭐) permitidos en hero moments. |

**Regla práctica**: si dudas si algo es calm o arena → es calm. Arena se gana.

### 2.3 · Un "reward" por sección

En superficies arena, solo **uno** de los siguientes elementos puede ser protagonista de reward visual por scroll/sección:
- MVP reveal con aura + confetti SVG
- Score slab con comm-color tinta gigante
- Podio 1º con aura breathing post-reveal
- Tier Leyenda rainbow

Si dos compiten en viewport → uno se degrada a secundario. El usuario aprende dónde mirar.

---

## 3. Componentes núcleo

### 3.1 Button

**Archivo**: `src/components/ui/Button.tsx`.

**Variantes**: `primary` · `secondary` · `danger` · `ghost`.

**Sizes**: `sm` · `md` (default) · `lg`.

#### Reglas

- Min-height ≥ 48px en todas las variantes (requisito touch).
- `primary` y `danger` llevan `.gloss-overlay` + `.shine-sweep` + `.btn-tone` data-tone.
- `secondary` y `ghost` llevan `.btn-tone[data-tone="glass"]` (sombra sutil).
- `uppercase tracking-wider` por defecto.
- Al hover, `translateY(-1px)` + `box-shadow` intensificado (global CSS).
- Al active, `scale-[0.97]`.

#### Cuándo usar cada variante

| Variante | Uso |
|----------|-----|
| `primary` | Acción principal de la pantalla/card (una sola por contexto) |
| `secondary` | Acción secundaria (Cancelar, Volver, filtros) |
| `danger` | Acción destructiva (borrar, salir, revocar) |
| `ghost` | Link-like dentro de cards, cerrar modal |

#### Antipatrón

- ❌ Dos botones `primary` en la misma card (rompe jerarquía).
- ❌ `primary` con texto no-imperativo ("Información" — ese es ghost/secondary).
- ❌ Añadir clases ad-hoc como `bg-red-500` en vez de usar `danger`.

### 3.2 Card

**Archivo**: `src/components/ui/Card.tsx`.

#### Anatomía (v2 — dos variantes por superficie)

```tsx
// CALM (default para listas, forms, navegación)
<div className="surface-calm p-4">
  {/* contenido */}
</div>

// ARENA (post-match, podio, hero del partido finalizado)
<div className="surface-arena p-4">
  {/* contenido */}
</div>
```

- `.surface-calm` → `var(--bg2)` sólido + border plano + `--shadow-depth-1`. Sin hairline por defecto.
- `.surface-arena` → card glass + border tintado community + `--shadow-depth-2` + `hairline-top` incluido.
- `.card` (legacy — equivale aproximadamente a `.surface-arena` sin tintado community). Mantener para compatibilidad; preferir `.surface-calm`/`.surface-arena` en código nuevo.
- Con `onClick` en arena → añade `.card-glow` + `cursor-pointer` + `active:scale-[0.98]`.
- `highlighted` → overrides con `border-color: var(--border-a)` y `shadow-tint-strong`.

#### Variantes de layout

- **`.card-hero`** (CSS): versión con `--radius-l` + `--shadow-depth-2`. Usar solo en 1 card por pantalla (la "protagonista").

#### Antipatrón

- ❌ `<div className="bg-white/5 rounded-xl border p-4">` — reinventa la rueda. Usa `.surface-calm`/`.surface-arena`.
- ❌ Usar `.surface-arena` en una sección calm → rompe la dualidad.
- ❌ Card dentro de card (anidamiento innecesario). Si necesitas jerarquía interna, usa secciones con divider.

### 3.3 Input

**Archivo**: `src/components/ui/Input.tsx`.

- `font-size: 16px !important` en `globals.css` para **prevenir zoom iOS**.
- Focus con `outline: 2px solid var(--comm-color)` + `outline-offset: 2px`.
- Placeholder con `color: var(--muted)`.

### 3.4 Modal

**Archivo**: `src/components/ui/Modal.tsx`.

**Variantes**:

- `variant="window"` — modal centrado, ocupa la pantalla en mobile (usado en altas editables: VitrinaEditor, "Añadir jugador", TeamGenerator).
- `variant="bottom-sheet"` — bottom sheet para acciones contextuales (Valorar, confirmaciones).

**Regla**: si el modal contiene un formulario editable → `variant="window"`. Si contiene una confirmación corta → bottom-sheet.

### 3.5 Badge, Avatar, Icon, Toast, Skeleton, ThemeToggle

Ver `src/components/ui/*` para implementación. Reglas transversales:

- **Badge**: tipografía Barlow uppercase tracking-wider, color `--comm-color` por defecto.
- **Avatar**: emoji ocupa el 60-70% del círculo; fondo tintado `--comm-color-d` (12% mix).
- **Icon**: usar el wrapper `<Icon>` — no emojis puros ni SVGs sueltos, para garantizar tamaño consistente.
- **Toast**: arriba en desktop, posición `--safe-top + 12px`. Ver propuesta de auditoría para mover abajo en mobile.
- **Skeleton**: siempre misma dimensión que el contenido real. Animación `shimmer 1.5s`.

---

## 4. Primitivas v2 (`globals.css`)

Las primitivas son clases de bajo nivel que resuelven patrones repetidos. Todo código nuevo debe componer primitivas antes de crear clases o estilos inline.

### 4.1 · Superficies

| Clase | Qué hace | Dónde |
|-------|----------|-------|
| `.surface-calm` | `bg2` sólido + border plano + shadow-depth-1 + radius-m | Cards calm: listas, forms, stats home, filtros |
| `.surface-arena` | card glass + border tintado `--comm-color` + shadow-depth-2 + `hairline-top` incluido | Cards arena: MVP reveal, equipos del partido, filas del historial con rachas |

### 4.2 · Métricas (patrón stack número + label)

| Clase | Qué hace | Dónde |
|-------|----------|-------|
| `.metric-major` | Stack: número Bebas 48–72px + label Barlow 10px `tracking-widest` | LA cifra protagonista de la pantalla (score del partido, total puntos jugador) |
| `.metric-minor` | Stack compacto: número Bebas 22px + label 10px | Stats secundarias del home, tiles numéricos |

### 4.3 · Datos gamificados

| Clase | Qué hace | Dónde |
|-------|----------|-------|
| `.chip-tier[data-tier="mal\|regular\|bueno\|excelente\|leyenda"]` | Chip centralizado para valor de puntos Furbito, con tier codificado por data-attr | Chip del ranking, fila del historial, panel de equipo post-match. **Sustituye** los 4 estilos inline distintos de `tier.gradient/color/glow` que existían v1. |
| `.score-slab` | Contenedor del score gigante del partido: Bebas 72–96px + separador "—" + grain interno sutil + comm-color como tinta | Marcador del partido finalizado, hero del resumen post-match |
| `.delta-chip[data-direction="up\|down\|flat"]` | Chip mono (IBM Plex Mono) con delta: `↑+3` verde, `↓−1` rojo, `=` muted | Ranking con delta vs ventana anterior, histórico de posiciones |
| `.inkbar[data-tone="community\|tier-mal\|..."]` | Barra vertical 2–3px tintada a la izquierda de una card/fila | Fila del historial (indica resultado/tier), card del equipo ganador. **Sustituye** los 4 `border-left: 3px solid X` improvisados. |

### 4.4 · Typography helpers

| Clase | Qué hace | Dónde |
|-------|----------|-------|
| `.font-mono` | IBM Plex Mono tabular + `letter-spacing: -0.02em` | Deltas, fechas, contadores de tiempo, índices, rachas |
| `.divider-dot` | Punto separador " · " tintado `--muted`, con espaciado calibrado | Entre metadatos pequeños (fecha · pista · duración). Sustituye el " · " textual repetido 40+ veces en el código. |

### 4.5 · Motion triggers

| Clase | Qué hace | Dónde |
|-------|----------|-------|
| `.is-reveal` | Una vez visible en viewport, dispara reveal 600–1200ms (via IntersectionObserver) y la quita. | Beats del post-match (score slab, MVP reveal, podio del partido) |
| `.is-reveal-pop` | Igual pero con `springIn` en vez de fade | Badges unlocked, número del podio 1º |

**Implementación**: un hook `useReveal` (a crear en `src/hooks/useReveal.ts`) añade `.is-revealed` cuando el elemento entra en viewport por primera vez, cancelando después cualquier animación idle.

---

## 5. Polish layer (v1 ampliada, reglas de uso condicional)

Estas utilidades siguen vivas. **La diferencia v2 es que su uso está condicionado por el registro `calm`/`arena`** y por el momento (idle vs reveal).

| Clase | Efecto | Uso permitido (v2) |
|-------|--------|---------------------|
| `.hairline-top` | Filo metálico superior 1px | CALM: solo CTA primary. ARENA: cards hero, filas reward. |
| `.gloss-overlay` | Gloss interior tipo vidrio | Solo buttons primary/danger (ya aplicado por `<Button>`). |
| `.shine-sweep` | Barrido diagonal en hover | **Solo CTA de cierre/finalizar** (p.ej. botón "Finalizar partido"). NO en todos los primary. |
| `.aura-halo` | Halo radial breathing tintado | ARENA ONLY. Reveal 3s al entrar, luego estático. NO idle permanente salvo en "#1 invicto ≥3 ventanas". |
| `.micro-float` | Flotación 3.2s (−4px) | Solo medalla 1º del podio **si** es nuevo líder esta ventana. |
| `.card-glow` | Border+shadow tintado en hover | Cards interactivas arena (`onClick`). |
| `.btn-tone[data-tone="accent\|danger\|glass"]` | Sombra tintada por variante | Botones (ya aplicado en `<Button>`). |
| `.nav-icon-wrap[data-active="true"]` | Halo detrás del icono activo | BottomNav (chrome de navegación calm). |
| `.header-underline` | Gradient underline tintado | Header (único sitio). |
| `.chip-pulse` | Pulse suave | Chips "en vivo" (confirmados en tiempo real, MVP pendiente de votación). |
| `.plinth-reflect` | Reflejo tipo mirror overlay | Plinth del podio arena. |
| `.stat-tile` | Preset stat tile con halo radial superior | Tarjetas stats del home (puede ser calm con este único polish). |
| `.legend-rainbow` | Gradient arcoíris animado | **Solo** chip de valor con tier=leyenda real (≥20 pts). **NO** como decoración de chrome (tabs, borders). |
| `.legend-halo` | Halo arcoíris respirante | Solo chip o fila con tier=leyenda real. |

### Antipatrones

- ❌ **Apilar >2 utilities polish** en un elemento. Ni siquiera en arena.
- ❌ `.legend-rainbow` en un tab, border, chrome → solo en chip-tier[data-tier=leyenda].
- ❌ `.aura-halo` idle permanente en avatar sin motivo (top 1 no-invicto, badge cualquiera, etc.) → wallpaper.
- ❌ `.shine-sweep` en botones secundarios/confirmar → casino vibe.
- ❌ Usar wow visual (shine, aura, rainbow) en superficie calm → rompe la dualidad.
- ❌ Copiar el CSS de una clase en otra nueva. Si algo se repite 3 veces → extraer primitiva.

---

## 6. Patrones de surface

### 4.1 Superficie primaria (Home, Perfil, Ranking)

```
bg: var(--bg)
cards: .card hairline-top
CTAs principales: <Button variant="primary" />
CTAs secundarios: <Button variant="secondary" />
gap entre elementos: 12px default, 16px en hero
```

### 4.2 Modal

```
background-overlay: rgba(0,0,0,0.75) + backdrop-filter: blur(4px)
content bg: var(--bg2)
border: 1px solid var(--border)
box-shadow: var(--shadow-depth-3)
radius: var(--radius-l)
safe-area: considerar notch (top) y home indicator (bottom)
```

### 4.3 Tabs

Dos tipos:
- **Tabs scrollables horizontales** (Ranking, subtabs de partido): fila scrollable con `snap-x` opcional, active con underline tintado + font-weight 700.
- **Tabs hero** (tab "Puntos" del ranking): wrapper con `.legend-rainbow` animado como borde (padding 1.5px sobre fondo `rgba(5,13,5,.92)`), icono pulsante.

### 4.4 Empty state

Estructura canónica:

```
[ilustración SVG monocroma o emoji grande]
title (Bebas, text-2xl)
subtítulo (Barlow, text-sm, var(--muted))
CTA principal (<Button variant="primary">)
CTA secundario opcional (<Button variant="ghost">)
```

Siempre al menos un CTA. Nunca solo texto.

### 4.5 Listas

- Cada fila es una `Card` mínima o una `<li>` con hairline divider.
- **Spacing vertical** entre filas: `space-y-2` default.
- **Loading**: 3-5 skeletons del tamaño exacto de la row.
- **Empty**: estructura §4.4.

---

## 7. Iconografía

- **Emojis nativos** del sistema: ok para iconos con carga emocional (⚽ 🎖️ 🏆 🔥 🎯 🥅).
- **Iconos SVG** (wrapper `<Icon>`): ok para UI neutra (flechas, menú, ajustes). Un solo set consistente.
- **Tamaño canónico**: 16px (inline body), 20px (en botones `sm`/`md`), 24px (botones `lg` / headers), 32px+ (hero).
- **Color**: `currentColor` para herencia. Para iconos tintados, `color: var(--comm-color)`.

### Antipatrón

- ❌ Mezclar estilos de iconos (outline + filled + flat) en la misma pantalla.
- ❌ Emojis custom-mapeados por CSS content — usar Unicode directo.

---

## 8. Accesibilidad (a11y)

### Requisitos no negociables

1. **Contraste**: texto sobre fondo ≥ **4.5:1** (WCAG AA). `--muted` contra `--bg` = 4.8:1 ✅.
2. **Target mínimo**: 44x44px (ya forzado en `button, [role="button"]` con `min-height: 44px`).
3. **Focus visible**: `outline: 2px solid var(--comm-color); outline-offset: 2px` — ya en `globals.css`. No removerlo.
4. **Color + icono/texto**: estados semánticos nunca solo por color.
5. **Reduced motion**: ya respetado en `globals.css`. Añadir cualquier nueva animación a la lista `prefers-reduced-motion: reduce { ... }`.
6. **Aria labels**: todo botón con solo icono requiere `aria-label`.
7. **Alt text**: imágenes informativas requieren `alt`. Decorativas, `alt=""`.

### Teclado

- Tab order respeta el orden visual (no `tabIndex > 0`).
- Esc cierra modals.
- Enter activa el botón focuseado.

---

## 9. Light theme — reglas especiales

Cuando `data-theme="light"`:

- Inversión de valores en `:root[data-theme="light"]`.
- El grain overlay cambia a `mix-blend-mode: multiply` con opacidad `0.05`.
- Los `.hairline-top::after` y `.plinth-reflect::before` usan gradients con white 0.7-0.9 (más intensos, para seguir siendo visibles sobre fondo claro).
- El accent cambia a `#5a8f00` (verde oliva en vez de neón) — evita el neón sobre blanco.

**Regla**: si añades un nuevo color/shadow, prueba en ambos temas antes de mergear.

---

## 10. Responsive & PWA

### Breakpoints

Tailwind default. FURBITO es **mobile-first**. Regla:
- Diseñar a 375px (iPhone SE).
- Probar a 390px (iPhone 15 base).
- Probar a 428px (iPhone Plus/Pro Max).
- Web desktop (≥ 640px): contenedor `max-w-app` (`500px`) centrado.

### Safe area

- `padding-top`: gestionado por `env(safe-area-inset-top)` en el Header.
- `padding-bottom`: utility `.pb-nav` en páginas con BottomNav.
- Modals: siempre calcular safe area al top y al bottom.

### Keyboard

- Inputs tienen `font-size: 16px` para no zoomar.
- Modals con input cerca del bottom: pueden ocultar con teclado → **duplicar CTA** arriba y abajo (ya aplicado en VitrinaEditor).

---

## 11. Performance

### Reglas

- No usar `filter: blur()` en elementos con muchos hijos (sacrificar blur antes que fluidez).
- `will-change` solo en elementos animados activamente (ya aplicado en `.animate-*`, `.aura-halo`, `.micro-float`).
- No animar propiedades caras (`width`, `height`, `top`, `left`) — usar `transform` y `opacity`.
- `backdrop-filter` solo en modals/toast puntuales, no en toda la lista.

### Imágenes

- Avatars son emojis (no imágenes). Cero coste.
- Si se añaden fotos de perfil (nativa) → WebP + tamaños adaptativos + lazy loading.
- SVGs inline (brand) — los que ya están en `public/brand`.

---

## 12. Cómo añadir algo nuevo al design system

Paso a paso cuando necesites un patrón nuevo:

1. **¿Ya existe algo que lo cubre?** Releer §2 (componentes) y §3 (utilities). 80% de las veces sí.
2. **¿Se puede resolver componiendo utilidades existentes?** Preferido a crear una nueva clase.
3. **¿Es un patrón que aparecerá ≥ 3 veces?** Si sí, crear una utility en `globals.css` o un componente en `src/components/ui/`. Si no, inline style está bien.
4. **¿Respeta los principios §0?** Si no, no se añade (o se reconsideran los principios, pero conscientemente).
5. **Probar en dark + light + reduced-motion + 375px.**
6. **Documentar aquí** (actualizar la sección relevante).

---

## 13. Anti-patrones globales (lo que NO hacer)

1. ❌ Colores custom fuera de tokens (`bg-blue-500`, `text-[#ff6666]`). Si no está en §1.1, no se usa.
2. ❌ Box-shadows inventados ad-hoc. Usa las 4 escalas.
3. ❌ `z-index: 9999`. Usa la escala §1.5.
4. ❌ `font-family: system-ui`. Somos Bebas + Barlow, punto.
5. ❌ Botones sin `min-height: 44px` (rompe touch).
6. ❌ Inputs sin `font-size: 16px` (zoom iOS).
7. ❌ Animaciones con duración > 400ms en interacciones directas.
8. ❌ Dos `primary` buttons en la misma vista (salvo paginación duplicada legítima).
9. ❌ Confiar en color sin icono/texto para estados críticos.
10. ❌ Usar `.legend-rainbow` fuera del contexto "tier Leyenda".
11. ❌ Polish layer apilado sin propósito en un solo elemento.
12. ❌ Emojis fuera del conjunto ⚽ 🎖️ 🏆 🥅 🔥 🎯 ✨ 🎓 🪄 🥇 🥈 🥉 🧤 🤝 🎲 🏟️ 📍 (mantener vocabulario contenido).

---

## 14. Checklist para code review UI

Antes de mergear un PR que toque UI:

- [ ] Colores: 100% tokens, ningún hex hardcoded (excepto tiers legendarios definidos en `legend-rainbow`)
- [ ] Sombras: una de las 4 escalas
- [ ] Radios: token `s`/`m`/`l`
- [ ] Tipografía: Bebas para números grandes, Barlow para texto; `tabular-nums` en stats
- [ ] Cards: usan `.card` (o `<Card>`), no re-definen
- [ ] Botones: `<Button>` con variant correcto, no `<button>` suelto
- [ ] Touch targets ≥ 44px
- [ ] Focus visible funciona con teclado
- [ ] Reduced motion no rompe la vista
- [ ] Light theme no rompe la vista
- [ ] Mobile 375px no rompe la vista
- [ ] Empty state con CTA (si aplica)
- [ ] Loading con skeleton (si aplica)
- [ ] Destructivos con confirmación + haptic/toast "Deshacer"

---

## 15. Migración a React Native — qué se preserva

Preview rápido (detalle en `GUIA_MIGRACION_APP_NATIVA.md` y `UI_AUDIT_PANTALLAS.md` §16):

| Preservable 1:1 | Adaptar | Sustituir/omitir |
|-----------------|---------|------------------|
| Tokens de color, radios, spacing, tipografía | `.card` → View con StyleSheet + border/shadow | `.shine-sweep`, `.card-glow` (hover) |
| Jerarquía tipográfica (Bebas/Barlow) | `.gloss-overlay` → LinearGradient | `backdrop-filter` (parcial con expo-blur) |
| Estados semánticos (verde/ámbar/rojo/gold) | `.aura-halo` → Animated opacity+scale loop | `mix-blend-mode` (no existe en RN) |
| Lógica de juego, tipos, scoring | `.legend-rainbow` → reanimated + LinearGradient animado | `::before/::after` (reemplazar con Views) |

El objetivo es que el **feeling** sea el mismo. No la fidelidad pixel-perfect de los efectos.

---

## 16. Archivos clave

| Archivo | Rol |
|---------|-----|
| [src/app/globals.css](../src/app/globals.css) | Variables, utilities polish, reset |
| [tailwind.config.ts](../tailwind.config.ts) | Colores semánticos y tokens de Tailwind |
| [src/components/ui/Button.tsx](../src/components/ui/Button.tsx) | Botón canónico |
| [src/components/ui/Card.tsx](../src/components/ui/Card.tsx) | Card canónica |
| [src/components/ui/Modal.tsx](../src/components/ui/Modal.tsx) | Modal + bottom sheet |
| [src/components/ui/Input.tsx](../src/components/ui/Input.tsx) | Input con estilo sistema |
| [src/components/layout/Header.tsx](../src/components/layout/Header.tsx) | Header con `header-underline` |
| [src/components/layout/BottomNav.tsx](../src/components/layout/BottomNav.tsx) | Nav con `nav-icon-wrap` |
| [src/components/ranking/RankingTable.tsx](../src/components/ranking/RankingTable.tsx) | Ranking premium (hero tab Puntos, sparklines, plinth reflects) |
| [src/components/players/PointsEvolutionChart.tsx](../src/components/players/PointsEvolutionChart.tsx) | SVG chart con bandas de tier y lollipops |

---

> **Para agentes (Claude, Cursor)**: trabajar en este codebase implica tratar este documento como **contrato**. Si el usuario pide una mejora UI, antes de escribir código:
> 1. Identificar la sección aplicable aquí.
> 2. Reutilizar componentes/utilities existentes.
> 3. Si algo no encaja, proponer primero el cambio del sistema — no improvisar ad-hoc en el feature.
>
> La skill `furbito-design` (en [.claude/skills/furbito-design/](../.claude/skills/furbito-design/)) opera como guardián de estas reglas.
