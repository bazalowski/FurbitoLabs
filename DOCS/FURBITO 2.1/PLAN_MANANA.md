# Plan de trabajo — mañana

> Punto de partida: commit `ea8c23e` — `feat(post-match): ventana resultados como narrativa de 7 beats (Athletic-Luxury)`.
> La ventana de resultados del partido finalizado es la **referencia visual** del rediseño. Todo lo demás debe acercarse a ese lenguaje.

---

## 1. Rediseño global con lenguaje "Athletic-Luxury"

### 1.1 Qué usar como referencia
- Componente: [src/components/events/PostMatchReveal.tsx](src/components/events/PostMatchReveal.tsx)
- Hook: [src/hooks/useReveal.ts](src/hooks/useReveal.ts)
- Utilities nuevas en [src/app/globals.css](src/app/globals.css):
  - `surface-calm` / `surface-arena` — dualidad de intensidad.
  - `reveal` + `stagger-*` — entrada por beats.
  - `stat-counter`, `bebas-display`, `numeric-tabular` — tipografía/cifras.
  - Sombras `--shadow-depth-*` + bordes `--border-strong`.
- Tokens: ver [tailwind.config.ts](tailwind.config.ts) y sección de tokens en [DOCS/FURBITO 2.1/FURBITO_DESIGN_SYSTEM.md](DOCS/FURBITO%202.1/FURBITO_DESIGN_SYSTEM.md).

### 1.2 Regla maestra — dualidad `calm` vs `arena`
- **calm** → navegación, listas, formularios, ajustes, ranking tabular, detalle de jugador en modo "ficha". Poco polish, jerarquía tipográfica, respiración.
- **arena** → pantallas gamificadas: post-match (ya hecho), podio, historial con hitos, detalle de badges, perfil público de jugador, vista "tu próxima jornada". Aquí sí: reveal secuencial, cifras grandes bebas, sombras fuertes, acento de color de comunidad.

Si una pantalla duda entre las dos → empieza en `calm` y solo sube a `arena` los beats concretos que lo merecen (ej. header de perfil con rango, pero lista de partidos en calm).

### 1.3 Orden sugerido de rediseño (pantalla a pantalla)

Prioridad por impacto percibido y dependencia con el módulo ya redesignado:

1. **Detalle de partido — pestañas previas al finalizado** ([src/app/[cid]/partidos/[eid]/page.tsx](src/app/%5Bcid%5D/partidos/%5Beid%5D/page.tsx))
   - La pestaña "Resultado" ya está. Faltan: **Asistencia**, **Equipos**, **Stats** (si existe).
   - Objetivo: que el viaje pre → post del partido sienta una sola pieza. Mismas superficies, mismas sombras, mismos botones.

2. **Perfil de jugador** ([src/app/[cid]/jugadores/[pid]/page.tsx](src/app/%5Bcid%5D/jugadores/%5Bpid%5D/page.tsx))
   - Candidato claro a `arena`. Header con rango/nivel tipo "portada de revista deportiva", badges en vitrina, historial de partidos en `calm`.

3. **Ranking** ([src/components/ranking/RankingTable.tsx](src/components/ranking/RankingTable.tsx))
   - `calm` puro. Ya tocado hoy (ventana temporal + filtro rol + sticky). Ajustar solo: tipografía tabular, sticky header con la nueva sombra, fila "tú" con el tratamiento de acento de la post-match.

4. **Home / Próximo partido** ([src/app/[cid]/page.tsx](src/app/%5Bcid%5D/page.tsx) y componentes asociados)
   - Mezcla: header `arena` ("Sábado 18:30 — quedan 3 plazas"), resto `calm` (lista de confirmaciones, acciones secundarias).

5. **Lista de jugadores** ([src/app/[cid]/jugadores/page.tsx](src/app/%5Bcid%5D/jugadores/page.tsx))
   - `calm`. Cards consistentes con las del ranking. Badges mini.

6. **Ajustes / Comunidad** ([src/app/[cid]/ajustes/page.tsx](src/app/%5Bcid%5D/ajustes/page.tsx))
   - `calm` muy plano. Es el sitio menos gamificado de la app.

7. **Auth / Onboarding** ([src/app/page.tsx](src/app/page.tsx))
   - Revisar al final: la primera impresión importa, pero no queremos divergir antes de tener el lenguaje consolidado en el resto.

### 1.4 Reglas duras que NO se negocian al rediseñar
- Reutilizar tokens/utilities antes de crear nuevos. Si un valor no existe en [tailwind.config.ts](tailwind.config.ts) o en `:root`, se añade allí, no suelto.
- `font-bebas` solo para cifras y títulos `arena`. Nunca para texto corrido.
- Color de comunidad como **acento puntual**, no como fondo de secciones enteras (excepto hero `arena`).
- Cero emoji nuevo sin justificación; los actuales (👑🏆🎯) se mantienen porque ya son parte del vocabulario.
- Antes de tocar UI: invocar la skill `/furbito-design`.

---

## 2. Refactor de modales — hacer que "siempre se desplieguen bien"

### 2.1 Diagnóstico del bug actual

Archivo: [src/components/ui/Modal.tsx](src/components/ui/Modal.tsx)

Los síntomas que ves ("a veces algo raro, no sé explicarlo") son combinación de 4 problemas técnicos reales:

1. **No usa portal.** El modal se renderiza donde lo ponga el componente padre. Si algún ancestro tiene `transform`, `filter`, `perspective` o `will-change`, el `position: fixed` del overlay **se ata a ese ancestro en vez de al viewport** (regla CSS de stacking con contain). Resultado: modal descentrado, cortado, o tapado por un header.
2. **Scroll-lock con `document.body.style.overflow = 'hidden'`.** En iOS Safari esto **no bloquea** el rubber-band del body; además si el modal se abre con la página scrolleada, al cerrarse a veces el scroll "salta" arriba. Hay que bloquear preservando la posición de scroll.
3. **No hay focus trap ni return-focus.** Al abrir un modal el foco se queda donde estaba (debajo), Tab navega al contenido tapado, y al cerrar no vuelve al botón que lo abrió → mala accesibilidad + sensación de "algo se quedó raro".
4. **No gestiona teclado virtual móvil.** El panel `variant="window"` usa `h-[90vh]`; cuando aparece el teclado en un input dentro del modal, el viewport visual se reduce pero el panel sigue midiéndose contra el layout viewport → el footer (con el botón de guardar) queda tapado por el teclado. El usuario no sabe por qué no puede confirmar.

### 2.2 Solución propuesta — `Modal` v2

Un único componente, sin dependencias nuevas. Cambios:

1. **Portal a `document.body`** con `createPortal`. Lo desacopla de cualquier ancestro. Render bajo un nodo estable (`#modal-root` creado al montar si no existe).
2. **Scroll-lock robusto:**
   ```ts
   // al abrir
   const y = window.scrollY
   document.body.style.position = 'fixed'
   document.body.style.top = `-${y}px`
   document.body.style.width = '100%'
   // al cerrar: revertir y window.scrollTo(0, y)
   ```
   Guardar `y` en ref. Esto sí bloquea iOS Safari sin perder posición.
3. **Focus trap + return-focus:**
   - Al abrir: `const trigger = document.activeElement as HTMLElement`.
   - Mover foco al primer `[data-autofocus]` del modal, o al primer focusable, o al panel mismo con `tabIndex={-1}`.
   - Interceptar `keydown` con Tab/Shift+Tab y ciclar dentro del panel (querySelector de focusables estándar).
   - Al cerrar: `trigger?.focus()`.
4. **Viewport dinámico** para `variant="window"`:
   - Sustituir `h-[90vh]` por `h-[90dvh] sm:h-auto sm:max-h-[85dvh]` (dynamic viewport unit — reacciona al teclado).
   - Alternativa robusta: usar `window.visualViewport` y fijar `max-height: ${visualViewport.height * 0.9}px` con listener. Hacerlo sólo si `dvh` no es suficiente tras probar.
5. **Animación con `@starting-style` / fallback actual** — si el animate-slide-up actual ya funciona bien, no tocar; solo asegurar que el portal no rompe el keyframe.

### 2.3 Plan de ejecución — modales

1. Reescribir `Modal.tsx` con todo lo anterior. Mantener la API pública idéntica (`open`, `onClose`, `title`, `variant`, `footer`) para no tocar call sites.
2. Añadir una prop opcional `initialFocusRef?: RefObject<HTMLElement>` — útil para formularios donde queremos enfocar el primer input.
3. Auditar los 11 call sites del grep inicial y verificar que cada uno sigue funcionando:
   - [src/components/players/BadgeVitrina.tsx](src/components/players/BadgeVitrina.tsx)
   - [src/components/layout/BottomNav.tsx](src/components/layout/BottomNav.tsx)
   - [src/components/events/EventForm.tsx](src/components/events/EventForm.tsx) ← el más crítico: formulario con inputs, es el que más sufre el bug del teclado.
   - [src/components/notifications/NotificationPrompt.tsx](src/components/notifications/NotificationPrompt.tsx)
   - [src/app/[cid]/jugadores/page.tsx](src/app/%5Bcid%5D/jugadores/page.tsx)
   - [src/app/page.tsx](src/app/page.tsx)
   - [src/app/[cid]/ajustes/page.tsx](src/app/%5Bcid%5D/ajustes/page.tsx)
   - [src/app/[cid]/layout.tsx](src/app/%5Bcid%5D/layout.tsx)
   - [src/app/[cid]/partidos/[eid]/page.tsx](src/app/%5Bcid%5D/partidos/%5Beid%5D/page.tsx)
   - [src/app/[cid]/jugadores/[pid]/page.tsx](src/app/%5Bcid%5D/jugadores/%5Bpid%5D/page.tsx)
4. **Test manual obligatorio** (el TypeScript no detecta estos bugs):
   - [ ] Móvil real (o DevTools con throttle): abrir EventForm, tocar el input de hora, comprobar que el botón "Guardar" del footer NO queda tapado por el teclado.
   - [ ] Abrir un modal con la página scrolleada a mitad → cerrar → el scroll sigue donde estaba.
   - [ ] Abrir modal, pulsar Tab varias veces → foco cicla sólo dentro del modal.
   - [ ] Cerrar con Escape → el foco vuelve al botón que lo abrió.
   - [ ] Abrir modal dentro de un componente con `transform` (si existe alguno; si no, forzar uno temporalmente para probar) → sigue centrado en viewport.
   - [ ] Safari iOS: no hay rubber-band del fondo mientras el modal está abierto.

### 2.4 Estética post-refactor
Una vez funcione bien, aplicarle el lenguaje Athletic-Luxury:
- `surface-calm` para modales de formulario/ajustes.
- Header del modal con `bebas-display` y sombra fuerte si el modal es `arena` (p. ej. detalle de badge ganado).
- Eliminar `✕` textual → sustituir por un icono con mejor hit-area (ya tiene `w-11 h-11`, bien).

---

## 3. Checklist mañana

- [ ] Rama nueva: `git checkout -b redesign/modal-y-app`
- [ ] Modal v2 (portal + scroll-lock + focus trap + dvh) — **antes** de seguir rediseñando pantallas, porque cualquier pantalla que use modales se beneficia.
- [ ] Test manual de los 5 puntos de §2.3.4.
- [ ] Commit: `fix(ui): modal v2 — portal, focus trap, scroll-lock iOS, viewport dinámico`
- [ ] Empezar rediseño pantalla a pantalla en el orden de §1.3.
- [ ] Invocar `/furbito-design` antes de cada pantalla.
- [ ] Un commit por pantalla (scopes pequeños, reversibles).

---

## 4. Lo que NO hacemos mañana
- Tocar backend / policies / Edge Functions. Backend cerrado en S1–S7 ([DOCS/FURBITO 2.1/BACKEND_AUDIT.md](DOCS/FURBITO%202.1/BACKEND_AUDIT.md)).
- Añadir features nuevas. Sólo rediseño visual + fix modal.
- Introducir librería de animación (Framer Motion, etc.). `useReveal` + CSS puro es suficiente y ya está funcionando.
- Cambiar la API de `Modal` — los 11 call sites se quedan como están.
