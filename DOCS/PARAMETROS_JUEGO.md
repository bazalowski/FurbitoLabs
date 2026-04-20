# FURBITO v2 — Como modificar los parametros del juego

> Este documento te explica como cambiar los niveles, XP, insignias y otros parametros
> sin necesidad de usar Claude Code. Solo necesitas un editor de texto (VS Code, Notepad++, etc).

---

## 1. Sistema de Niveles (src/lib/game/levels.ts)

### Que controla este archivo
- Cuantos niveles hay (actualmente 99)
- Cuanta XP necesita cada nivel
- El nombre e icono de cada rango

### Como cambiar la curva de XP

Busca esta linea en el archivo:

```typescript
const xpForLevel = (n: number): number => Math.floor(n * n * 0.77)
```

Esto es una formula matematica que dice: "para el nivel N, necesitas N x N x 0.77 puntos de XP".

**Ejemplos con la formula actual:**
- Nivel 1 = 0 XP (siempre empieza en 0)
- Nivel 10 = 77 XP
- Nivel 25 = 481 XP
- Nivel 50 = 1925 XP
- Nivel 75 = 4331 XP
- Nivel 99 = 7546 XP

**Para hacer que los niveles sean MAS FACILES**, baja el numero 0.77:
```typescript
const xpForLevel = (n: number): number => Math.floor(n * n * 0.5)
// Ahora nivel 99 = 4900 XP (mas facil)
```

**Para hacer que los niveles sean MAS DIFICILES**, sube el numero:
```typescript
const xpForLevel = (n: number): number => Math.floor(n * n * 1.2)
// Ahora nivel 99 = 11761 XP (mas dificil)
```

### Como cambiar el nivel maximo

Busca esta linea:

```typescript
const MAX_LEVEL = 99
```

Cambiala al numero que quieras:
```typescript
const MAX_LEVEL = 50  // ahora el maximo es nivel 50
```

### Como cambiar los nombres de los rangos

Busca el array `TIER_NAMES`. Cada entrada tiene:
- `max`: el nivel maximo de ese rango
- `name`: el nombre del rango
- `icon`: el emoji que se muestra

```typescript
const TIER_NAMES = [
  { max: 10, name: 'Rookie', icon: '⚽' },
  { max: 20, name: 'Amateur', icon: '🥅' },
  // ... etc
]
```

Para cambiar un nombre, simplemente edita el texto:
```typescript
{ max: 10, name: 'Principiante', icon: '🐣' },  // cambiado!
```

Para anadir un nuevo rango, anade una linea mas (respetando que max sea ascendente):
```typescript
{ max: 5, name: 'Novato', icon: '🐤' },    // nuevo rango para niveles 1-5
{ max: 10, name: 'Rookie', icon: '⚽' },    // ahora cubre 6-10
```

---

## 2. XP por partido (src/lib/game/badges.ts)

### Que controla
Cuanta XP gana un jugador por cada partido. Busca la funcion `calcXP`:

```typescript
export function calcXP(mp: MatchPlayer, isMVP: boolean): number {
  let xp = 10                          // XP base por jugar
  xp += mp.goles * 15                  // 15 XP por gol
  if (mp.goles >= 3) xp += 20          // Bonus por hat-trick
  xp += mp.asistencias * 10            // 10 XP por asistencia
  if (isMVP) xp += 20                  // Bonus por ser MVP
  xp += 5                              // Bonus por completar partido
  if (mp.porteria_cero) xp += 15       // Bonus porteria a cero
  if (mp.parada_penalti) xp += 25      // Bonus parada de penalti
  return xp
}
```

### Como modificar las recompensas

**Quieres que los goles den mas XP:**
```typescript
xp += mp.goles * 25    // antes era 15, ahora 25
```

**Quieres que el MVP reciba mas bonus:**
```typescript
if (isMVP) xp += 50    // antes era 20, ahora 50
```

**Quieres anadir XP base mas alto:**
```typescript
let xp = 20            // antes era 10, ahora 20
```

### Tabla de referencia rapida

| Concepto | Linea a buscar | Valor actual |
|----------|---------------|--------------|
| XP base por partido | `let xp = 10` | 10 |
| XP por gol | `mp.goles * 15` | 15 |
| Bonus hat-trick | `mp.goles >= 3` + `xp += 20` | 20 (si 3+ goles) |
| XP por asistencia | `mp.asistencias * 10` | 10 |
| Bonus MVP | `if (isMVP) xp += 20` | 20 |
| Bonus completar | `xp += 5` | 5 |
| Bonus porteria cero | `mp.porteria_cero` + `xp += 15` | 15 |
| Bonus parada penalti | `mp.parada_penalti` + `xp += 25` | 25 |

### Calculo rapido

Un jugador que juega 500 partidos SIN goles ni asistencias gana:
- 500 x (10 base + 5 completar) = **7500 XP** = Nivel 99

Un jugador que mete 1 gol por partido durante 100 partidos:
- 100 x (10 + 15 + 5) = **3000 XP** = ~Nivel 62

---

## 3. Insignias (src/lib/game/badges.ts)

Todo vive en **`src/lib/game/badges.ts`**. Hay dos piezas que siempre tienes que tocar a la vez:

1. **`BADGE_DEFS`** (diccionario al principio del archivo): define cómo se ve la insignia (icono, nombre, descripción, XP bonus).
2. **`detectBadges(...)`** (función al final del archivo): define *cuándo* se desbloquea (la regla).

> ⚠️ Si solo añades algo a `BADGE_DEFS` sin tocar `detectBadges`, la insignia existe pero **nunca se desbloqueará**. Si solo añades a `detectBadges` sin definirla, el `chk()` se ignora (hay un guard que lo protege) pero no se mostrará nada al jugador.

### Estado actual

- **196 insignias definidas** en total.
- **143 activas**: el motor las desbloquea automáticamente al terminar un partido.
- **53 inactivas** (definidas pero sin lógica): necesitan datos que la app aún no pasa al motor (pistas, horarios de partido, streaks/rachas de victorias, sistema de votos agregados, remontadas con marcador al descanso).

Ver al final de este documento la tabla completa de insignias inactivas y qué contexto le faltaría a cada una.

### Anatomía de una entrada en `BADGE_DEFS`

```typescript
hat_trick: { icon: '🎩', name: 'Hat Trick', desc: '3 goles en un partido', xp: 75 },
```

| Campo | Tipo | Qué hace |
|-------|------|----------|
| *clave* (`hat_trick`) | string | Identificador único. Solo letras minúsculas, números y `_`. **No lo cambies nunca** una vez publicado: rompería los perfiles de jugadores que ya la tenían desbloqueada. |
| `icon` | emoji | Se muestra en el perfil. Un solo emoji. |
| `name` | string | Nombre visible. Evita duplicados (dos insignias con el mismo `name` confunden en la UI). |
| `desc` | string | Descripción corta (1 línea). Aparece en el panel inline al pulsar la insignia. |
| `xp` | número | XP extra que se suma al jugador al desbloquearla. Usa `0` para insignias "de hito" (niveles, acumulados de XP) que no deben dar más XP. |

### Anatomía de una regla en `detectBadges`

La función recibe estos datos por partido:

| Variable | Qué contiene |
|----------|--------------|
| `player` | Estadísticas **acumuladas** del jugador *hasta antes* de este partido: `partidos`, `goles`, `asistencias`, `mvps`, `partidos_cero`, `xp`, `badges` (array de claves ya desbloqueadas). |
| `mp` | Estadísticas **de este partido concreto** (`MatchPlayer`): `goles`, `asistencias`, `porteria_cero`, `parada_penalti`, `chilena`, `olimpico`, `tacon`. |
| `isMVP` | `true` si fue el MVP del partido. |
| `matchScore` (opcional) | `{ golesA, golesB, playerTeam }` — sólo disponible si el partido se pasó con marcador. Necesario para `goleada_*`, `empate_*`, `victoria_ajustada`, `derrota_digna`, `mvp_goleada`, `muchos_goles`, `partido_epico`. |

Dentro de la función hay un helper `chk()`:

```typescript
const chk = (key: string, condition: boolean) => {
  if (!existing.has(key) && condition && BADGE_DEFS[key]) {
    newBadges.push(key)
  }
}
```

Sólo desbloquea si **(a)** el jugador aún no la tiene, **(b)** la condición es verdadera, y **(c)** la clave existe en `BADGE_DEFS`. Eso significa que puedes borrar una entrada de `BADGE_DEFS` sin miedo aunque `detectBadges` todavía tenga el `chk()` — simplemente quedará sin efecto.

### Receta 1 — Añadir una nueva insignia

Ejemplo: "Máquina de asistir" — 4 asistencias en un partido sin marcar gol, +60 XP.

**Paso 1** — añade la definición en `BADGE_DEFS` (busca una sección lógica, p.ej. "Asistencias especiales"):

```typescript
asist_puro: { icon: '🧵', name: 'Máquina de asistir', desc: '4 asistencias sin marcar', xp: 60 },
```

**Paso 2** — añade la condición en `detectBadges`, cerca del resto de reglas de asistencias:

```typescript
chk('asist_puro', a >= 4 && g === 0)
```

Listo. En el próximo partido que cumpla la condición se desbloqueará.

### Receta 2 — Cambiar requisito de una insignia existente

Ejemplo: subir `hat_trick` a 4 goles (y renombrarla).

**Paso 1** — actualiza `BADGE_DEFS`:

```typescript
hat_trick: { icon: '🎩', name: 'Póker relámpago', desc: '4 goles en un partido', xp: 100 },
```

**Paso 2** — actualiza la condición en `detectBadges`:

```typescript
chk('hat_trick', g >= 4)   // antes: g >= 3
```

> ⚠️ Importante: **no cambies la clave** (`hat_trick`). Si la cambias a `poker_relampago`, los jugadores que ya tenían la antigua la perderán (porque su perfil guarda la clave vieja). Cambia `name`, `desc`, `icon`, `xp` o la condición — pero no la clave.

### Receta 3 — Cambiar el XP bonus

Ejemplo: bajar `partidos_1000` de 3000 a 2000 XP.

En `BADGE_DEFS` cambia:

```typescript
partidos_1000: { icon: '🏛️', name: 'Inmortal', desc: '1000 partidos jugados', xp: 2000 },
```

Los jugadores que **ya** tenían la insignia no reciben el ajuste (su XP se calculó en su momento). Solo afecta a futuros desbloqueos.

### Receta 4 — Eliminar una insignia

**Opción A — eliminación total** (recomendado si nunca se otorgó):

1. Borra la entrada del `BADGE_DEFS`.
2. Borra el `chk('clave', ...)` correspondiente en `detectBadges`.

**Opción B — desactivar manteniendo histórico** (si algunos jugadores ya la tienen):

- Borra solo el `chk()` en `detectBadges`. Los jugadores que ya la tenían la conservan, pero ningún nuevo jugador la desbloqueará. Como la entrada sigue en `BADGE_DEFS`, aparece correctamente en sus perfiles.
- Si además quieres que desaparezca de la UI para los jugadores que nunca la tuvieron, borra la entrada de `BADGE_DEFS`. Los perfiles que la tenían mostrarán `null` para esa clave (el `BadgeChip` la oculta silenciosamente).

### Receta 5 — Añadir una categoría a la vista "Showcase"

Las categorías del desplegable "🏅 INSIGNIAS" se configuran en **`src/components/ui/Badge.tsx`**, dentro de `buildCategories()`:

```typescript
{ label: 'Goles', prefixes: ['primer_gol', 'hat_trick', 'goles_', ...] },
```

Cada entrada tiene un `label` (título visible) y `prefixes` (patrones de claves). Una clave entra en la categoría si coincide exactamente con algún prefix o empieza por él. Las que no encajan en ninguna van a **"Otros"** automáticamente.

Para que tu nueva insignia `asist_puro` aparezca bajo "Asistencias", no tienes que tocar nada: ya coincide con el prefix `asist_`.

### Checklist rápido antes de guardar

- [ ] La clave es única y no existía antes.
- [ ] El `name` no colisiona con otra insignia ya existente.
- [ ] Añadiste tanto la entrada en `BADGE_DEFS` como el `chk()` en `detectBadges` (si es activa).
- [ ] Si usas `matchScore`, el `chk()` está dentro del bloque `if (matchScore) { ... }`.
- [ ] Si tu condición usa datos acumulados (`player.goles`, `player.mvps`, etc.), usas campos del objeto `player`, **no** `mp`.
- [ ] Si tu condición usa datos del partido de hoy, usas `mp.goles`, `a`, `g`, `isMVP`, etc.

### Insignias inactivas (requieren datos que la app aún no pasa)

Las siguientes 53 están definidas pero **sin lógica de desbloqueo**. Si quieres activarlas, habría que pasar el dato correspondiente a `detectBadges` y añadir el `chk()`:

| Grupo | Claves | Qué dato falta |
|-------|--------|----------------|
| **Rachas de victorias** | `racha_2`, `racha_3`, `racha_5`, `racha_7`, `racha_10`, `racha_15`, `racha_20` | Nº de partidos ganados consecutivos (streak) — requiere consultar partidos anteriores del jugador. |
| **Victorias acumuladas** | `primera_victoria`, `victorias_10`, `victorias_25`, `victorias_50`, `victorias_100`, `sin_perder_5`, `sin_perder_10` | Contador de victorias/invictos en `Player` (no existe todavía). |
| **Remontadas** | `remontada`, `mvp_remontada` | Marcador al descanso + marcador final. |
| **Pistas** | `pistas_5`, `pistas_10`, `jugar_3_pistas`, `jugar_5_pistas`, `pista_nueva`, `pista_10`, `pista_15`, `pista_20`, `pista_favorita_10`, `pista_favorita_25`, `pista_favorita_50` | ID de pista del partido + histórico de pistas jugadas/añadidas por jugador. |
| **Horario del partido** | `madrugador`, `nocturno`, `fin_de_semana`, `lunes_guerrero`, `navidad`, `nochevieja`, `ano_nuevo`, `mediodia`, `finde_10`, `entre_semana_20` | Fecha/hora exacta del partido (`Date`) pasada al motor. |
| **Votos / rating social** | `primer_voto`, `votado_10`, `votado_25`, `votado_50`, `rating_5`, `rating_4_5`, `votos_dados_10`, `votos_dados_50`, `votos_dados_100` | Snapshot del estado de votos del jugador (dados y recibidos, rating medio). |
| **Streaks de gol/asist** | `gol_todos_partidos_5`, `gol_todos_partidos_10`, `asist_racha_3` | Historial de los últimos N partidos del jugador. |
| **Portero streaks / acumulados** | `parada_5`, `parada_10`, `portero_invicto_3` | Contador total de paradas; porterías a cero consecutivas. |
| **Meta** | `all_categories` | Set de categorías que tiene el jugador (requiere conocer el mapping clave → categoría en runtime). |

Puedes mantenerlas definidas para mostrarlas en el catálogo como "bloqueadas" (lo que ve el jugador ahora mismo), o borrarlas si quieres un catálogo 100% accionable.

---

## 4. Colores de comunidad (src/lib/utils.ts)

Busca:
```typescript
export const COMMUNITY_COLORS = ['#a8ff3e','#ff5c5c','#5cadff','#ffd700','#ff6bff','#00ffc8','#ff9030','#c084fc']
```

Para anadir mas colores, anade al array:
```typescript
export const COMMUNITY_COLORS = ['#a8ff3e','#ff5c5c','#5cadff','#ffd700','#ff6bff','#00ffc8','#ff9030','#c084fc','#00ff00','#ff00ff']
```

---

## 5. Limites de la app

| Parametro | Donde esta | Valor actual |
|-----------|-----------|--------------|
| Max caracteres nombre comunidad | src/app/page.tsx | maxLength={40} |
| Max caracteres PIN | src/app/page.tsx | maxLength={10} |
| Min caracteres PIN | src/app/page.tsx | newPin.length < 4 |
| Max caracteres codigo jugador | generado automaticamente | 4 chars |
| Max jugadores en evento | src/types/index.ts | campo max_jugadores |

---

## 6. Despues de hacer cambios

1. **Guarda el archivo** (Ctrl+S)
2. Si tienes `npm run dev` corriendo, la pagina se recarga sola
3. Si no, ejecuta: `npm run dev`
4. Prueba los cambios en http://localhost:3000
5. Si todo funciona, haz commit y push:

```bash
git add .
git commit -m "ajuste: cambiar parametros de XP/niveles"
git push
```

Vercel desplegara automaticamente en 1-2 minutos.

---

## 7. Si algo se rompe

1. **No borres nada**, simplemente deshaz los cambios:
```bash
git checkout -- src/lib/game/levels.ts    # restaurar archivo original
```

2. Si no sabes que archivo rompiste:
```bash
git diff    # ver que cambios hiciste
git checkout .    # restaurar TODO a la ultima version guardada
```

3. Si nada funciona, puedes siempre volver al ultimo commit:
```bash
git reset --hard HEAD    # vuelve al ultimo commit (PIERDES cambios no guardados)
```
