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

### Como anadir una nueva insignia

1. Busca el objeto `BADGE_DEFS` al principio del archivo
2. Anade una nueva entrada:

```typescript
mi_insignia: {
  icon: '🎉',
  name: 'Mi Insignia',
  desc: 'Descripcion de lo que hay que hacer',
  xp: 50,        // XP bonus al desbloquearla
  cat: 'especial' // categoria (para organizar)
},
```

3. Busca la funcion `detectBadges` y anade la condicion:

```typescript
// Mi nueva insignia: se desbloquea con 100 goles
chk('mi_insignia', totalGoals >= 100)
```

### Como cambiar los requisitos de una insignia existente

Busca en `detectBadges` la insignia que quieras cambiar. Por ejemplo, para `hat_trick`:

```typescript
chk('hat_trick', mp.goles >= 3)  // actualmente: 3 goles en un partido
```

Cambia el numero:
```typescript
chk('hat_trick', mp.goles >= 4)  // ahora necesitas 4 goles
```

### Como cambiar el XP bonus de una insignia

Busca la insignia en `BADGE_DEFS`:

```typescript
hat_trick: { icon: '🎩', name: 'Hat-trick', desc: '3 goles en un partido', xp: 50, cat: 'goles_partido' },
```

Cambia el valor de `xp`:
```typescript
hat_trick: { icon: '🎩', name: 'Hat-trick', desc: '3 goles en un partido', xp: 100, cat: 'goles_partido' },
```

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
