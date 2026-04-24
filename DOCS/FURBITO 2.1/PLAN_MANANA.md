# Plan de trabajo — 2026-04-25

> Contexto: el muro de comunidad (V1 texto + reacciones + YouTube) quedó entregado el 24. Commit `e6293ba`. Mig 016 pendiente de aplicar en el SQL Editor antes de probar en prod.

---

## 0. Antes de tocar nada

- [ ] **Aplicar migración 016** en Supabase SQL Editor (copiar `supabase/migrations/016_wall_posts.sql`). Sin esto el muro no funciona.
- [ ] Probar el muro en un jugador real en dev (escribir post, pegar URL YT, reaccionar, borrar).
- [ ] Verificar dark/light/375px en Home `WallPreview` + `/muro`.
- [ ] Si algo se rompe en prod → arreglar **antes** de empezar la tarea del día.

---

## 1. Tarea del día — opciones sobre la mesa

Las 3 candidatas son P0 del [FEATURE_AUDIT.md](FEATURE_AUDIT.md) Top 15 (ningún P0 es "pequeño y autónomo" salvo la #11). **Elige una al arrancar — no empezar dos en paralelo.**

### 🅐 Opción A — Undo 15 min tras finalizar partido (#11 del Top 15)

**Por qué**: Elimina el miedo al botón "Finalizar". Hoy, si el admin se equivoca en un gol / MVP / alineación, **no hay vuelta atrás**. Con 15 min de undo deshace errores sin abrir edit quirúrgico.

**Alcance técnico**:
- Columna nueva `events.finalizado_at timestamptz`.
- Un nuevo CTA `<Button variant="danger-ghost">Deshacer finalización</Button>` visible en el detalle del partido **sólo si** `finalizado && (now - finalizado_at) < 15min && jugador es admin`.
- Edge Function `unfinalize-match` (análoga a `finalize-match`): valida admin + ventana + reabre el evento (`finalizado = false`, `finalizado_at = null`, ponderar: ¿revertir stats? **Sí, porque si no queda "medio finalizado"**).
- Countdown visible junto al CTA: "Undo en 12m 34s".

**Coste estimado**: medio día. Backend (mig + edge function) + UI (CTA + countdown).

**Riesgo**: si alguien ya ha publicado en el muro sobre el resultado, el undo crea incoherencia social. Mitigación: durante los 15min, congelar visualmente el resultado en Home (`NextMatchHero` lo saca del "Próximo"). Aceptable.

---

### 🅑 Opción B — Score de fiabilidad por jugador (#2 del Top 15)

**Por qué**: Métrica social nueva, **calculable sin tocar schema** (sobre `confirmations` + `match_players` existentes). Diferencial vs WhatsApp. Surface en perfil + ranking.

**Alcance técnico**:
- Helper `src/lib/game/reliability.ts`: `calcReliability(playerId, confirmations, matchPlayers)` → `{ pct, label: 'Fiable' | 'Irregular' | 'Sin datos', sampleSize }`.
  - Fórmula: `confirmados_si_y_aparecieron / confirmados_si` sobre últimos 20 partidos.
  - "Apareció" = existe `match_players` con `event_id = X AND player_id = Y`.
  - Si `sampleSize < 5` → "Sin datos" (no mostrar %).
- UI en perfil: chip nuevo junto al nivel (`src/app/[cid]/jugadores/[pid]/page.tsx`).
- UI en ranking: columna opcional (toggleable) "Fiabilidad".

**Coste estimado**: 3-4h. Sin backend, sólo cliente.

**Riesgo**: los que tienen "Irregular" pueden sentirse señalados. Mitigación: copy neutro ("Fiable 92%" sí, "Irregular 60%" cambiar a "Variable 60%" o quitar el label si <70%, mostrar sólo el %).

---

### 🅒 Opción C — Posts automáticos del sistema en el muro (gap nuevo §16 FEATURE_AUDIT)

**Por qué**: Recupera lo que hacía el viejo `ActivityFeed` (noticias automáticas: "partido creado", "MVP de Juan", "Ander sube a L10") pero ahora dentro del muro que entregamos ayer. Sin esto, los jugadores inactivos que antes escaneaban el feed en 2s ahora no tienen señal.

**Alcance técnico**:
- Columna nueva `wall_posts.kind text NOT NULL DEFAULT 'user'` con check `kind IN ('user', 'system_match_created', 'system_match_result', 'system_mvp', 'system_level_up')`.
- Payload opcional `wall_posts.payload jsonb` para datos estructurados (event_id, mvp_id, level, etc.).
- Triggers o Edge Function hooks:
  - En `finalize-match` → insertar `system_match_result`.
  - En INSERT de `events` → insertar `system_match_created`.
  - En MVP closed → `system_mvp`.
  - En level-up (calcular al finalizar partido) → `system_level_up`.
- UI: `WallPost.tsx` rendering condicional por `kind` — los system posts tienen layout distinto (sin avatar jugador, icono sistema, link directo al recurso).

**Coste estimado**: 1 día completo. Backend (mig + hooks en edge functions existentes) + UI (nueva variante de WallPost).

**Riesgo**: si se generan demasiados posts del sistema, el muro se convierte en log ruidoso y entierra los posts humanos. Mitigación: sólo 4 tipos, y el algoritmo de orden puede priorizar `kind='user'` ligeramente sobre `kind='system_*'` cuando la distancia temporal es <1h.

---

## 2. Mi recomendación (si quieres que elija)

**🅐 Undo 15 min.**

Razones:
1. Es el único P0 del Top 15 que encaja en **medio día** — el resto son ≥1 día. Quieres victorias diarias, no sprints que se arrastran.
2. Mata un miedo real del admin ("me equivoqué finalizando") sin añadir superficie nueva que rediseñar.
3. No depende de decisiones de producto — la UX es obvia (contador + botón).
4. **Desbloquea el hard launch**: hoy el botón "Finalizar" es de un solo sentido y eso frena la adopción por admins no técnicos (punto del [MARKETING_PLAN.md](MARKETING_PLAN.md) si hay fase soft-launch).

🅑 es buena pero necesita decisiones de copy y prueba con usuarios reales (el rótulo "Irregular" puede ofender).
🅒 es la natural continuación del muro pero cuesta un día entero y el muro aún no tiene suficientes datos para justificar que lo necesite ya.

---

## 3. Post-tarea (no olvidar)

- [ ] Tachar ítem implementado en el Top 15 del [FEATURE_AUDIT.md](FEATURE_AUDIT.md) (regla §21: docs vivos, no museos).
- [ ] Si tocamos backend: actualizar [BACKEND_AUDIT.md](BACKEND_AUDIT.md) con la nueva policy/función.
- [ ] Commit atómico con el scope correcto (`feat(undo):`, `feat(perfil):`, etc.).
- [ ] Push. No hay rama: se trabaja en `main` como ayer.

---

## 4. Lo que NO hacemos mañana

- No tocar el muro (V2 imágenes, push notifications, menciones) — dejarlo reposar para ver datos reales de uso antes de iterar.
- No migrar el muro a tab en BottomNav — mismo motivo. Necesita datos.
- No añadir librerías nuevas (framer-motion, react-query) — sigue siendo Next + CSS + Supabase.
- No refactorizar componentes existentes salvo que la tarea lo exija.

---

## 5. Si sobra tiempo

Mini-QoL del muro que vimos durante el build y dejamos fuera para no inflar el scope:

- [ ] **Avatar placeholder** cuando el jugador se ha borrado (hoy pinta un círculo gris vacío) — mostrar iniciales con `Avatar` component.
- [ ] **Hora absoluta en tooltip** del timestamp relativo ("hace 2h" con hover → "sáb 24 abr, 17:42").
- [ ] **Tecla Enter+⌘/Ctrl** en el composer → enviar.
- [ ] **Optimistic insert** del post al publicar (aparece inmediatamente, confirma con el real-time round-trip).
