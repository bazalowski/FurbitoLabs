# FURBITO — Design System export pack

Portable snapshot del design system v2 **Athletic-Luxury** listo para pasar a Claude Design (u otra AI de wireframes) y generar el set completo para app nativa.

**Versión**: 2.0 · **Fecha**: 2026-04-24 · **Fuente canónica**: [../FURBITO 2.1/FURBITO_DESIGN_SYSTEM.md](../FURBITO%202.1/FURBITO_DESIGN_SYSTEM.md)

---

## Qué hay aquí

| Archivo | Para qué |
|---------|----------|
| [index.ts](./index.ts) | Punto de entrada — reexporta todo + metadata + principios rectores |
| [tokens.ts](./tokens.ts) | Colors (dark+light), tiers Comunio, shadows, radii, spacing, typography scale, motion, z-index, a11y |
| [components.ts](./components.ts) | Specs componentes (Button, Card, Input, Modal, Badge, Avatar, Icon, Toast, Skeleton, Header, BottomNav) + **primitivas dominio** (MetricMajor, ChipTier, ScoreSlab, DeltaChip, Inkbar, DividerDot) + **polish layer** + regla calm/arena con tabla de decisión por pantalla |
| [screens.ts](./screens.ts) | Inventario de pantallas (auth, home, partidos, ranking, perfil, admin) + modals + flows. Cada pantalla describe secciones top→bottom, superficie por sección, componentes usados, estados empty/loading/error |
| [tokens.css](./tokens.css) | CSS puro drop-in. Variables + primitivas. No depende de Tailwind ni del build del repo |
| [tokens.native.ts](./tokens.native.ts) | Adapter React Native: alpha-hex precomputados (no `color-mix`), shadow→elevation, font platform map, matriz preserve/adapt/replace |

---

## Cómo usarlo con Claude Design

Pega al agente este bloque como brief:

```
Usa el design system en DOCS/design-system-export/ como contrato.
- tokens.ts  → TODOS los valores (colores, shadows, radii, motion) vienen de aquí.
- components.ts → contratos de cada componente + regla calm/arena (§surfaceRules).
- screens.ts → inventario de pantallas. Genera un wireframe por cada Screen listado.

Requisitos para cada wireframe:
1. Clasifica la pantalla en calm / arena / mixed (ver screens.ts → surface).
2. Respeta la anatomía de cada componente (no inventes paddings/radios).
3. Respeta el polish layer: máx 1 utility en calm, máx 2 en arena.
4. Usa SOLO los emojis del vocabulario permitido (tokens.ts → emojiVocab).
5. Variaciones a entregar por pantalla: dark default, loading (skeleton),
   empty state (si aplica), error state (si aplica), responsive 375/390/428.
6. Nunca inventes hex colors, sombras ni z-index fuera de los tokens.

Salida: wireframe alta fidelidad + anotaciones de componentes usados.
```

---

## Principios rectores (resumen)

1. **Dualidad `calm` vs `arena`** — clasificar antes de diseñar. `Calm`: restraint. `Arena`: intensidad.
2. **Dark fotográfico** por defecto; light es alternativa funcional.
3. **`--comm-color` como tinta**, nunca fondo.
4. **Tres familias**: Bebas (display), Barlow (body), IBM Plex Mono (deltas/fechas/contadores).
5. **Números = ciudadanos de primera** (`tabular-nums` + `letter-spacing: -0.02em`).
6. **Polish opt-in y condicional** (máx 1 en calm, máx 2 en arena).
7. **Hairlines para estructura, glows para reward**.
8. **`prefers-reduced-motion` siempre respetado**.

---

## Migración a nativa

Ver [tokens.native.ts](./tokens.native.ts) para:
- Alpha-hex precomputados (React Native no soporta `color-mix(in srgb)`).
- Mapa de shadows → `shadowColor/Opacity/Radius` + `elevation`.
- Platform map para `font.bebas` (iOS/Android diferente).
- Matriz **preservar / adaptar / reemplazar** para cada primitiva del sistema.

El objetivo en nativa es que el **feeling** sea idéntico — no la fidelidad pixel-perfect de los efectos CSS (mix-blend-mode, backdrop-filter, ::after, color-mix).
