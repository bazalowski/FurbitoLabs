# FURBITO — Design System canónico

> **Propósito**: fuente única de verdad del sistema de diseño de FURBITO.
> Todo cambio en UI debe respetar este documento. Si algo en el código se separa de aquí, **el código está mal** (o el documento está desactualizado — ajustar).
>
> **Audiencia**: desarrollador humano + agente (Claude, Cursor, etc.) trabajando en el repo.
> **Fecha**: 2026-04-23 · **Versión**: 1.0
> **Stack**: Next.js 14 + Tailwind + CSS custom properties (`src/app/globals.css`).

---

## 0. Principios rectores

El sistema no es "un tema dark más". Tiene carácter. Para preservarlo, respetar siempre estos 7 principios:

1. **Oscuro por defecto, light como alternativa**. El dark es la identidad; el light debe sobrevivir pero no liderar decisiones.
2. **Color de comunidad (`--comm-color`) como tinte, no como fondo**. El acento sale del comunitity color a través de sombras, bordes y halos; los fondos siguen siendo `--bg`/`--card`.
3. **Glass > Flat**. Las superficies son vidrio tintado con hairline, no rectángulos planos. El `.card` con `hairline-top` es la base.
4. **Jerarquía tipográfica por contraste Bebas ↔ Barlow**. Bebas para *displays* (números grandes, scores, títulos impactantes). Barlow para lectura.
5. **Tabular nums obligatorios en estadísticas**. Nunca perder columnas al cambiar un número.
6. **Polish es opt-in, no default**. Las utilidades `hairline-top`, `gloss-overlay`, `shine-sweep`, `aura-halo`, `legend-rainbow` se aplican conscientemente a los elementos que lo merecen. No se ponen en todo.
7. **Respect `prefers-reduced-motion`**. Todas las animaciones se neutralizan. Nunca depender exclusivamente de animación para comunicar información.

---

## 1. Tokens

**Fuente**: `src/app/globals.css` (variables CSS `:root`) y `tailwind.config.ts`.

### 1.1 Color

#### Dark (default)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--bg` | `#050d05` | Fondo de la página |
| `--bg2` | `#0a180a` | Superficies secundarias (nav, modal bg) |
| `--card` | `rgba(255,255,255,0.045)` | Fondo de cards (glass) |
| `--card2` | `rgba(255,255,255,0.07)` | Card hover / elevada |
| `--border` | `rgba(255,255,255,0.08)` | Borde estándar de card |
| `--border-a` | `rgba(168,255,62,0.22)` | Borde tintado acento |
| `--accent` | `#a8ff3e` | Acento principal (verde neón) |
| `--accent-d` | `rgba(168,255,62,0.12)` | Accent "dim" para fondos sutiles |
| `--accent-g` | `rgba(168,255,62,0.35)` | Accent "glow" para halos |
| `--text` | `#f0f0f0` | Texto principal |
| `--muted` | `rgba(240,240,240,0.55)` | Texto secundario / placeholder |
| `--red` | `#ff5c5c` | Error / destructivo |
| `--orange` | `#ff9030` | Warning / "regular" |
| `--gold` | `#ffd700` | Oro / logros / admin |
| `--comm-color` | `#a8ff3e` (default) | **Color dinámico de la comunidad** |

#### Light (sobrescritas con `:root[data-theme="light"]`)

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
| `--radius-l` | `20px` | Cards hero, modals |

Tailwind equivalente: `rounded-s` · `rounded-m` · `rounded-l`.

### 1.3 Espaciado (Tailwind)

No hay tokens custom — Tailwind default. Convenciones:

- **Gutters entre cards**: `gap-3` (12px) default · `gap-4` (16px) en hero/spacious.
- **Padding de card**: `p-4` (16px) default.
- **Padding de botón**: `px-4 py-3` (md) · `px-3 py-3` (sm) · `px-5 py-3.5` (lg).
- **Safe area bottom**: utility `.pb-nav` (ya contempla `--nav-h` + `--safe-bottom` + 20px).

### 1.4 Tipografía

#### Familias

| Familia | Font | Uso |
|---------|------|-----|
| **Bebas Neue** (`font-bebas`) | Display, cursive | Números grandes (scores, stats, XP), títulos impactantes, tabs hero |
| **Barlow** (`font-barlow`) | 300/400/500/600/700/900 | Cuerpo, UI, labels, párrafos |

#### Jerarquía canónica

| Rol | Familia | Size | Weight | Notas |
|-----|---------|------|--------|-------|
| H1 display | Bebas | `text-4xl`-`text-6xl` | 400 | tracking-display (letter-spacing −0.01em). `text-wrap: balance` por defecto. |
| H2 section | Bebas | `text-3xl` | 400 | |
| H3 card title | Barlow | `text-base` / `text-lg` | 700 | Uppercase opcional |
| Body | Barlow | `text-sm` (14px) | 400 | Base de la app |
| Caption / muted | Barlow | `text-xs` (12px) | 500 | color `--muted` |
| Stat number (grande) | Bebas | `text-3xl`+ | 400 | **Siempre `tabular-nums`** |
| Chip / label | Barlow | `text-xs` | 600-700 | uppercase + tracking-wider |

#### Utilidades clave en `globals.css`

```css
.font-bebas { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1, 'lnum' 1; }
.tabular-nums, .stat-num, .score, .xp { font-variant-numeric: tabular-nums; }
.fw-medium { font-weight: 500; }
.fw-semi   { font-weight: 600; }
.tracking-display { letter-spacing: -0.01em; }
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

## 2. Componentes núcleo

### 2.1 Button

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

### 2.2 Card

**Archivo**: `src/components/ui/Card.tsx`.

#### Anatomía

```tsx
<div className="card hairline-top p-4 min-w-0 relative">
  {/* contenido */}
</div>
```

- `.card` → glass background + border + shadow + inner hairline (via `::before`).
- `.hairline-top` → filo luminoso arriba (via `::after`).
- Con `onClick` → añade `.card-glow` + `cursor-pointer` + `active:scale-[0.98]`.
- `highlighted` → overrides con `border-color: var(--border-a)` y `shadow-tint-strong`.

#### Variantes de layout

Además del `Card` estándar, se usa:

- **`.card-hero`** (CSS): versión con `--radius-l` + `--shadow-depth-2`. Usar solo en 1 card por pantalla (la "protagonista").

#### Antipatrón

- ❌ `<div className="bg-white/5 rounded-xl border p-4">` — reinventa la rueda. Usa `.card`.
- ❌ Card dentro de card (anidamiento innecesario). Si necesitas jerarquía interna, usa secciones con divider.

### 2.3 Input

**Archivo**: `src/components/ui/Input.tsx`.

- `font-size: 16px !important` en `globals.css` para **prevenir zoom iOS**.
- Focus con `outline: 2px solid var(--comm-color)` + `outline-offset: 2px`.
- Placeholder con `color: var(--muted)`.

### 2.4 Modal

**Archivo**: `src/components/ui/Modal.tsx`.

**Variantes**:

- `variant="window"` — modal centrado, ocupa la pantalla en mobile (usado en altas editables: VitrinaEditor, "Añadir jugador", TeamGenerator).
- `variant="bottom-sheet"` — bottom sheet para acciones contextuales (Valorar, confirmaciones).

**Regla**: si el modal contiene un formulario editable → `variant="window"`. Si contiene una confirmación corta → bottom-sheet.

### 2.5 Badge, Avatar, Icon, Toast, Skeleton, ThemeToggle

Ver `src/components/ui/*` para implementación. Reglas transversales:

- **Badge**: tipografía Barlow uppercase tracking-wider, color `--comm-color` por defecto.
- **Avatar**: emoji ocupa el 60-70% del círculo; fondo tintado `--comm-color-d` (12% mix).
- **Icon**: usar el wrapper `<Icon>` — no emojis puros ni SVGs sueltos, para garantizar tamaño consistente.
- **Toast**: arriba en desktop, posición `--safe-top + 12px`. Ver propuesta de auditoría para mover abajo en mobile.
- **Skeleton**: siempre misma dimensión que el contenido real. Animación `shimmer 1.5s`.

---

## 3. Utilidades CSS "polish layer"

Estas son las utilidades que dan a FURBITO su carácter premium. **Son opt-in**: se aplican conscientemente.

| Clase | Efecto | Dónde tiene sentido |
|-------|--------|---------------------|
| `.hairline-top` | Filo metálico superior 1px (via `::after`) | Buttons primary/danger, cards heroicas, chips premium |
| `.gloss-overlay` | Gloss interior tipo vidrio | Buttons primary/danger |
| `.shine-sweep` | Barrido diagonal en hover (hover-only) | Buttons primary/danger, cards destacadas |
| `.aura-halo` | Halo radial breathing tintado | Podio 1º puesto, badges legendarios |
| `.micro-float` | Flotación 3.2s (−4px) | Medallas del podio, elementos featured |
| `.card-glow` | Border + shadow tintado en hover | Cards interactivas (`onClick`) |
| `.btn-tone[data-tone="accent\|danger\|glass"]` | Sombra tintada por variante | Botones (ya aplicado en `<Button>`) |
| `.nav-icon-wrap[data-active="true"]` | Halo detrás del icono activo | BottomNav |
| `.header-underline` | Gradient underline tintado | Header |
| `.chip-pulse` | Pulse suave | Chips "en vivo" (confirmados, MVPs pendientes) |
| `.plinth-reflect` | Reflejo tipo mirror overlay | Plinth del podio |
| `.stat-tile` | Preset stat tile con halo radial | Tarjetas stats del home |
| `.legend-rainbow` | Gradient arcoíris animado | Valor del 1º cuando tier = Leyenda |
| `.legend-halo` | Halo arcoíris respirante | Chip o texto con valor ≥20 puntos |

### Antipatrón

- ❌ **Apilar todas** en un mismo elemento. `.hairline-top .gloss-overlay .shine-sweep .aura-halo .micro-float .card-glow` = mareo.
- ❌ Usar `.legend-rainbow` fuera del contexto de tier "Leyenda" (rompe el significado semántico).
- ❌ Copiar el CSS de una clase en otra nueva. Si algo se repite 3 veces → creamos una nueva utility.

---

## 4. Patrones de surface

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

## 5. Iconografía

- **Emojis nativos** del sistema: ok para iconos con carga emocional (⚽ 🎖️ 🏆 🔥 🎯 🥅).
- **Iconos SVG** (wrapper `<Icon>`): ok para UI neutra (flechas, menú, ajustes). Un solo set consistente.
- **Tamaño canónico**: 16px (inline body), 20px (en botones `sm`/`md`), 24px (botones `lg` / headers), 32px+ (hero).
- **Color**: `currentColor` para herencia. Para iconos tintados, `color: var(--comm-color)`.

### Antipatrón

- ❌ Mezclar estilos de iconos (outline + filled + flat) en la misma pantalla.
- ❌ Emojis custom-mapeados por CSS content — usar Unicode directo.

---

## 6. Accesibilidad (a11y)

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

## 7. Light theme — reglas especiales

Cuando `data-theme="light"`:

- Inversión de valores en `:root[data-theme="light"]`.
- El grain overlay cambia a `mix-blend-mode: multiply` con opacidad `0.05`.
- Los `.hairline-top::after` y `.plinth-reflect::before` usan gradients con white 0.7-0.9 (más intensos, para seguir siendo visibles sobre fondo claro).
- El accent cambia a `#5a8f00` (verde oliva en vez de neón) — evita el neón sobre blanco.

**Regla**: si añades un nuevo color/shadow, prueba en ambos temas antes de mergear.

---

## 8. Responsive & PWA

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

## 9. Performance

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

## 10. Cómo añadir algo nuevo al design system

Paso a paso cuando necesites un patrón nuevo:

1. **¿Ya existe algo que lo cubre?** Releer §2 (componentes) y §3 (utilities). 80% de las veces sí.
2. **¿Se puede resolver componiendo utilidades existentes?** Preferido a crear una nueva clase.
3. **¿Es un patrón que aparecerá ≥ 3 veces?** Si sí, crear una utility en `globals.css` o un componente en `src/components/ui/`. Si no, inline style está bien.
4. **¿Respeta los principios §0?** Si no, no se añade (o se reconsideran los principios, pero conscientemente).
5. **Probar en dark + light + reduced-motion + 375px.**
6. **Documentar aquí** (actualizar la sección relevante).

---

## 11. Anti-patrones globales (lo que NO hacer)

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

## 12. Checklist para code review UI

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

## 13. Migración a React Native — qué se preserva

Preview rápido (detalle en `GUIA_MIGRACION_APP_NATIVA.md` y `UI_AUDIT_PANTALLAS.md` §16):

| Preservable 1:1 | Adaptar | Sustituir/omitir |
|-----------------|---------|------------------|
| Tokens de color, radios, spacing, tipografía | `.card` → View con StyleSheet + border/shadow | `.shine-sweep`, `.card-glow` (hover) |
| Jerarquía tipográfica (Bebas/Barlow) | `.gloss-overlay` → LinearGradient | `backdrop-filter` (parcial con expo-blur) |
| Estados semánticos (verde/ámbar/rojo/gold) | `.aura-halo` → Animated opacity+scale loop | `mix-blend-mode` (no existe en RN) |
| Lógica de juego, tipos, scoring | `.legend-rainbow` → reanimated + LinearGradient animado | `::before/::after` (reemplazar con Views) |

El objetivo es que el **feeling** sea el mismo. No la fidelidad pixel-perfect de los efectos.

---

## 14. Archivos clave

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
