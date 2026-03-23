# FURBITO v2 — Guia completa del codigo (para principiantes)

> Este documento explica **todo** el codigo de FURBITO como si nunca hubieras programado.
> Cada seccion te dice: que hace, donde esta, y por que existe.

---

## Indice

1. [Que es FURBITO](#1-que-es-furbito)
2. [Las tecnologias que usamos (y que hacen)](#2-las-tecnologias-que-usamos)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Como funciona una pagina web en Next.js](#4-como-funciona-una-pagina-web-en-nextjs)
5. [La base de datos (Supabase)](#5-la-base-de-datos-supabase)
6. [Pagina por pagina: que hace cada una](#6-pagina-por-pagina)
7. [Componentes: las piezas reutilizables](#7-componentes)
8. [Hooks: como se obtienen los datos](#8-hooks)
9. [La logica del juego (gamificacion)](#9-logica-del-juego)
10. [El estado de la sesion (quien soy yo)](#10-sesion-y-roles)
11. [Los estilos (como se ve bonito)](#11-estilos)
12. [Flujos completos paso a paso](#12-flujos-completos)
13. [Glosario de terminos](#13-glosario)

---

## 1. Que es FURBITO

FURBITO es una **app web** (funciona en el navegador del movil) para organizar partidos de futbol con amigos. Permite:

- **Crear comunidades** (tu grupo de amigos)
- **Organizar partidos** (fecha, hora, lugar)
- **Confirmar asistencia** (voy / quiza / no voy)
- **Generar equipos** automaticamente (equilibrados por nivel)
- **Registrar resultados** (goles, asistencias, MVP)
- **Ganar insignias y XP** (sistema de logros tipo videojuego)
- **Rankings** (quien es el mejor en cada categoria)
- **Mapa de pistas** (donde jugamos)
- **Valorar jugadores** (estrellas en 5 habilidades)

---

## 2. Las tecnologias que usamos

Imagina que construyes una casa. Cada tecnologia es una herramienta diferente:

| Tecnologia | Que es | Analogia |
|------------|--------|----------|
| **Next.js 14** | Framework para hacer paginas web con React | Los planos de la casa |
| **React** | Libreria para construir interfaces | Los ladrillos y ventanas |
| **TypeScript** | JavaScript con "tipos" (dice que tipo de dato es cada cosa) | Etiquetas en las cajas: "esto es un numero", "esto es texto" |
| **Supabase** | Base de datos online (guarda toda la info) | El almacen donde guardamos todo |
| **Tailwind CSS** | Sistema de estilos con clases cortas | La pintura y decoracion |
| **Zustand** | Almacen de estado en el navegador | Tu memoria de quien eres mientras usas la app |
| **Leaflet** | Libreria de mapas interactivos | Google Maps pero gratis y personalizable |
| **Vercel** | Plataforma que pone la app online | La inmobiliaria que alquila el terreno |

### Que es un "Framework"?
Un framework es un conjunto de herramientas y reglas predefinidas que te facilitan construir algo. Next.js te da:
- **Routing automatico**: creas un archivo en una carpeta y ya tienes una pagina web
- **Renderizado en servidor**: la pagina se prepara en el servidor antes de enviartela (mas rapido)
- **Optimizaciones**: imagenes, fuentes, y codigo se optimizan automaticamente

### Que es "TypeScript"?
Es JavaScript (el lenguaje de las webs) pero con **tipos**. Ejemplo:
```typescript
// JavaScript normal - no sabes que es "name"
let name = "Pedro"

// TypeScript - dice explicitamente que es un texto (string)
let name: string = "Pedro"
```
Esto evita errores. Si intentas poner un numero donde va un texto, TypeScript te avisa ANTES de que falle.

---

## 3. Estructura de carpetas

```
furbito/
├── src/                    ← TODO el codigo esta aqui
│   ├── app/                ← Las PAGINAS (lo que el usuario ve)
│   ├── components/         ← PIEZAS reutilizables (botones, tarjetas...)
│   ├── hooks/              ← FUNCIONES para traer datos de Supabase
│   ├── lib/                ← LOGICA pura (calculos, utilidades)
│   ├── stores/             ← MEMORIA de la sesion (quien soy yo)
│   └── types/              ← DEFINICIONES de tipos (que forma tienen los datos)
│
├── supabase/
│   └── schema.sql          ← El "plano" de la base de datos
│
├── public/                 ← Archivos publicos (iconos, service worker)
├── DOCS/                   ← Documentacion (como este archivo)
├── next.config.mjs         ← Configuracion de Next.js
├── tailwind.config.ts      ← Configuracion de colores y estilos
├── package.json            ← Lista de dependencias (que librerias usamos)
└── tsconfig.json           ← Configuracion de TypeScript
```

### La regla de oro: `src/app/` = las paginas

En Next.js 14, **cada carpeta dentro de `src/app/` es una URL**. Ejemplo:

| Carpeta | URL en el navegador |
|---------|-------------------|
| `src/app/page.tsx` | `furbito.app/` (pagina principal) |
| `src/app/admin/page.tsx` | `furbito.app/admin` |
| `src/app/[cid]/page.tsx` | `furbito.app/abc123` (cid = ID de comunidad) |
| `src/app/[cid]/partidos/page.tsx` | `furbito.app/abc123/partidos` |
| `src/app/[cid]/partidos/[eid]/page.tsx` | `furbito.app/abc123/partidos/xyz789` |

Los corchetes `[cid]` significan **parametro dinamico**. Es decir, esa parte de la URL cambia segun la comunidad. `cid` = community ID, `eid` = event ID, `pid` = player ID.

---

## 4. Como funciona una pagina web en Next.js

Cada archivo `page.tsx` es una **pagina**. Cada `layout.tsx` es un **marco** que envuelve a las paginas.

```
layout.tsx (raiz) ← HTML base, fuentes, PWA
  └── page.tsx (login) ← Pagina de inicio

layout.tsx (raiz)
  └── [cid]/layout.tsx ← Marco de comunidad (nav, banner, color)
        └── [cid]/page.tsx ← Dashboard
        └── [cid]/partidos/page.tsx ← Lista de partidos
        └── [cid]/jugadores/page.tsx ← Lista de jugadores
        └── ...etc
```

### Que significa `'use client'`?

En Next.js hay dos tipos de componentes:
- **Server Component** (por defecto): se ejecuta en el servidor. No puede usar `useState`, `useEffect`, ni eventos del navegador.
- **Client Component** (`'use client'`): se ejecuta en el navegador del usuario. Puede usar interactividad.

Casi todas nuestras paginas usan `'use client'` porque necesitan interactividad (clicks, formularios, datos en tiempo real).

---

## 5. La base de datos (Supabase)

Supabase es como una **hoja de Excel online** pero mucho mas potente. Tiene "tablas" donde guardamos datos.

### Las 7 tablas

```
COMMUNITIES (comunidades)
┌─────────┬──────────┬─────┬────────┬────────────┐
│ id      │ name     │ pin │ color  │ created_at │
├─────────┼──────────┼─────┼────────┼────────────┤
│ abc123  │ Los Cracks│1234│ green  │ 2024-01-15 │
│ def456  │ FC Barrio │5678│ blue   │ 2024-02-01 │
└─────────┴──────────┴─────┴────────┴────────────┘

PLAYERS (jugadores)
┌─────────┬────────┬──────┬──────┬──────┬────┬─────────┬────────┐
│ id      │ name   │ code │ xp   │ goals│ ...│ badges  │ comm_id│
├─────────┼────────┼──────┼──────┼──────┼────┼─────────┼────────┤
│ p001    │ Pedro  │ AX3K │ 450  │ 23   │ ...│[hat_trick]│ abc123│
└─────────┴────────┴──────┴──────┴──────┴────┴─────────┴────────┘

EVENTS (partidos/eventos)
┌─────────┬────────────┬────────┬───────────┬──────┬─────────┐
│ id      │ title      │ date   │ time      │score │ comm_id │
├─────────┼────────────┼────────┼───────────┼──────┼─────────┤
│ e001    │ Viernes Cup│ 2024-03│ 20:00     │ 3-2  │ abc123  │
└─────────┴────────────┴────────┴───────────┴──────┴─────────┘

CONFIRMATIONS (asistencia)
┌──────────┬───────────┬──────────┬─────────┐
│ id       │ event_id  │player_id │ status  │
├──────────┼───────────┼──────────┼─────────┤
│ c001     │ e001      │ p001     │ yes     │
│ c002     │ e001      │ p002     │ maybe   │
│ c003     │ e001      │ p003     │ no      │
└──────────┴───────────┴──────────┴─────────┘

MATCH_PLAYERS (stats individuales por partido)
┌──────────┬──────────┬──────────┬──────┬────────┬────┬─────┐
│ id       │ event_id │player_id │goals │assists │team│ xp  │
├──────────┼──────────┼──────────┼──────┼────────┼────┼─────┤
│ mp001    │ e001     │ p001     │ 2    │ 1      │ A  │ 55  │
└──────────┴──────────┴──────────┴──────┴────────┴────┴─────┘

VOTES (valoraciones entre jugadores)
┌──────────┬──────────┬──────────┬───────┬─────┐
│ id       │ voter_id │ voted_id │ skill │score│
├──────────┼──────────┼──────────┼───────┼─────┤
│ v001     │ p001     │ p002     │ataque │ 4   │
└──────────┴──────────┴──────────┴───────┴─────┘

PISTAS (canchas/ubicaciones)
┌──────────┬─────────────┬──────────┬──────┬─────┐
│ id       │ name        │ address  │ lat  │ lng │
├──────────┼─────────────┼──────────┼──────┼─────┤
│ pi001    │ Campo Norte │ Calle... │40.41 │-3.70│
└──────────┴─────────────┴──────────┴──────┴─────┘
```

### Como se conectan las tablas

```
COMMUNITIES ──┬──> PLAYERS (cada jugador pertenece a una comunidad)
              ├──> EVENTS (cada partido pertenece a una comunidad)
              ├──> PISTAS (cada cancha pertenece a una comunidad)
              └──> VOTES (las valoraciones son dentro de una comunidad)

EVENTS ──┬──> CONFIRMATIONS (cada confirmacion es para un evento)
         └──> MATCH_PLAYERS (las stats de cada jugador en ese partido)
```

### Que es "Realtime"?

Supabase puede enviar actualizaciones **al instante** cuando alguien cambia datos. Ejemplo:
- Pedro confirma asistencia al partido
- Automaticamente, todos los que tienen el partido abierto ven el cambio
- No necesitan recargar la pagina

Esto se configura en los hooks (`useEvents.ts`, `usePlayers.ts`).

---

## 6. Pagina por pagina

### 6.1. Pagina de Login (`src/app/page.tsx`)

**URL:** `furbito.app/`
**Que hace:** Es la puerta de entrada. Tiene 2 pestanas:

**Pestana "Unirse":**
1. El usuario pone el PIN de una comunidad (ej: "1234")
2. Opcionalmente pone su codigo de jugador (ej: "AX3K")
3. Si el PIN es correcto → entra como invitado
4. Si el PIN + codigo son correctos → entra como jugador
5. Si pone el ADMIN_PIN maestro → entra como admin global

**Pestana "Crear":**
1. Pone nombre de la comunidad, PIN, y elige un color
2. Se crea la comunidad en Supabase
3. Entra como admin de esa comunidad

**Archivo clave:** `src/stores/session.ts` — guarda quien eres en el navegador.

---

### 6.2. Dashboard de Comunidad (`src/app/[cid]/page.tsx`)

**URL:** `furbito.app/abc123`
**Que hace:** Pagina principal una vez dentro de la comunidad.

Muestra:
- **Stats rapidos**: cuantos jugadores, partidos proximos, partidos jugados
- **Proximo partido**: banner con el evento mas cercano y barra de confirmaciones
- **Proximos eventos**: lista de los 3 siguientes
- **Resultados recientes**: ultimos 3 partidos con resultado

---

### 6.3. Partidos (`src/app/[cid]/partidos/`)

**Lista** (`partidos/page.tsx`): Muestra todos los partidos en 2 pestanas (Proximos / Historial)

**Crear** (`partidos/nuevo/page.tsx`): Formulario para crear un nuevo partido (solo admin/jugador)

**Detalle** (`partidos/[eid]/page.tsx`): Informacion completa del partido:
- Fecha, hora, lugar, notas
- Barra de confirmaciones (cuantos van)
- Botones para confirmar (voy/quiza/no voy)
- Lista de confirmados, indecisos, ausentes
- Resultado si ya se jugo

**Resultado** (`partidos/[eid]/resultado/page.tsx`): Pantalla de 3 pasos para registrar el resultado despues del partido:

```
PASO 1: EQUIPOS          PASO 2: RESULTADO        PASO 3: STATS
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Equipo A  Equipo B│  │   Equipo A      │    │ Pedro           │
│ Pedro     Juan    │  │     3            │    │ Goles: [+][-] 2 │
│ Maria     Luis    │  │     vs           │    │ Asist: [+][-] 1 │
│                   │  │     2            │    │ Chilena? [x]    │
│ [Generar Auto] ←──── │   Equipo B      │    │ MVP? [x]        │
│ [Drag & Drop]     │  │  MVP: [Pedro ▼]  │   │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

Al guardar:
1. Actualiza el evento con el resultado
2. Crea registros `match_players` para cada jugador
3. Calcula XP ganado
4. Detecta badges desbloqueados
5. Actualiza stats acumulados del jugador

---

### 6.4. Jugadores (`src/app/[cid]/jugadores/`)

**Lista** (`jugadores/page.tsx`): Todos los jugadores ordenados por XP. Permite:
- Ver tarjeta de cada jugador
- Anadir jugadores (admin)
- Generar equipos (boton flotante)

**Perfil** (`jugadores/[pid]/page.tsx`): Perfil completo:
- Avatar, nombre, posicion, nivel, barra de XP
- Vitrina (3 mejores insignias)
- Stats: partidos, goles, asistencias, MVPs, porterias a cero
- Codigo de jugador (solo admin ve esto)
- Rating medio y desglose por habilidad
- Boton para valorar (estrellas 1-5 en cada skill)
- Lista completa de insignias

---

### 6.5. Ranking (`src/app/[cid]/ranking/page.tsx`)

6 clasificaciones diferentes (pestanas):
- **XP**: Quien tiene mas experiencia
- **Goles**: Maximo goleador
- **Asistencias**: Mas asistencias
- **MVPs**: Mas veces MVP
- **Partidos**: Mas partidos jugados
- **Rating**: Mejor valoracion de companeros

Medallas para los 3 primeros.

---

### 6.6. Pistas (`src/app/[cid]/pistas/page.tsx`)

- **Mapa interactivo** (Leaflet) con marcadores en cada cancha
- **Lista** de canchas con nombre y direccion
- **Anadir cancha**: nombre, direccion, coordenadas (con boton de geolocalizacion)

---

### 6.7. Ajustes (`src/app/[cid]/ajustes/page.tsx`)

- Info de la comunidad (nombre, PIN, color)
- Info de la sesion (rol, ID de jugador)
- Cambiar de comunidad
- Cerrar sesion

---

### 6.8. Admin (`src/app/admin/page.tsx`)

Solo accesible con el ADMIN_PIN maestro. Permite:
- Ver TODAS las comunidades del sistema
- Eliminar comunidades
- Entrar en cualquier comunidad como admin

---

## 7. Componentes

Los componentes son **piezas reutilizables** de interfaz. Piensa en ellos como piezas de LEGO:

### Componentes UI (genericos)

| Componente | Archivo | Que hace |
|-----------|---------|----------|
| **Button** | `ui/Button.tsx` | Boton con 4 estilos: primary (verde), secondary (gris), danger (rojo), ghost (transparente) |
| **Card** | `ui/Card.tsx` | Tarjeta con borde y fondo. Contenedor visual. |
| **Input** | `ui/Input.tsx` | Campo de texto, area de texto, y selector. Con label y errores. |
| **Modal** | `ui/Modal.tsx` | Ventana emergente (sale desde abajo en movil). |
| **Toast** | `ui/Toast.tsx` | Notificacion temporal que aparece arriba (ej: "Partido creado!") |
| **Skeleton** | `ui/Skeleton.tsx` | Placeholder animado mientras cargan datos (rectangulo gris que brilla). |
| **Badge** | `ui/Badge.tsx` | Chip de insignia (icono + nombre del logro). |

### Componentes de Layout

| Componente | Que hace |
|-----------|----------|
| **BottomNav** | Barra de navegacion inferior con 5 pestanas (como Instagram). Fija en la parte de abajo. |
| **Header** | Cabecera con logo y acciones. |
| **RoleBanner** | Cinta que dice tu rol: "Admin", "Jugador: Pedro", "Invitado". |

### Componentes de dominio

| Componente | Que hace |
|-----------|----------|
| **EventCard** | Tarjeta resumen de un partido (titulo, fecha, barra de confirmacion, resultado). |
| **EventForm** | Formulario para crear/editar un partido. |
| **PlayerCard** | Tarjeta de jugador (avatar, nivel, stats basicos). |
| **TeamGenerator** | Generador de equipos con 4 modos (equilibrado, aleatorio, snake, capitanes). |
| **RankingTable** | Tabla de clasificacion con 6 criterios y medallas. |
| **PistaMap** | Mapa interactivo con marcadores de canchas. |

### Como funciona un componente (ejemplo simplificado)

```tsx
// Button.tsx - Un boton reutilizable

'use client' // Esto dice: "ejecutame en el navegador"

// Las "props" son los parametros que le pasas al componente
interface ButtonProps {
  children: React.ReactNode  // El texto dentro del boton
  variant?: 'primary' | 'danger'  // El estilo (verde o rojo)
  onClick?: () => void  // Que hacer al hacer click
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={variant === 'primary' ? 'bg-green-500' : 'bg-red-500'}
    >
      {children}
    </button>
  )
}

// USO en otra pagina:
// <Button variant="primary" onClick={() => alert('Hola!')}>
//   Crear Partido
// </Button>
```

---

## 8. Hooks: como se obtienen los datos

Un **hook** es una funcion especial de React que empieza con `use`. Los hooks de FURBITO traen datos de Supabase.

### Patron comun

Todos nuestros hooks siguen el mismo patron:

```tsx
function useAlgo(id: string) {
  const [data, setData] = useState(null)      // Los datos
  const [loading, setLoading] = useState(true) // Esta cargando?

  useEffect(() => {
    // Al montar el componente: pedir datos a Supabase
    supabase.from('tabla').select('*').eq('id', id)
      .then(result => {
        setData(result.data)
        setLoading(false)
      })
  }, [id]) // Se re-ejecuta si el id cambia

  return { data, loading }
}
```

### Hooks disponibles

| Hook | Que trae | Realtime? |
|------|---------|-----------|
| `useCommunity(cid)` | Datos de una comunidad | No |
| `useAllCommunities()` | Todas las comunidades | No |
| `useEvents(cid)` | Todos los eventos de una comunidad | Si |
| `useEvent(eid)` | Un evento con todos sus datos | No |
| `usePlayers(cid)` | Todos los jugadores (por XP) | Si |
| `usePlayer(pid)` | Un jugador completo | No |
| `usePistas(cid)` | Todas las pistas | No |
| `useVotes(cid)` | Todas las valoraciones | No |

### Que significa "Realtime"?

Los hooks con Realtime escuchan cambios en Supabase. Ejemplo en `useEvents.ts`:

```tsx
// Subscribirse a cambios en la tabla "events"
supabase
  .channel('events-realtime')
  .on('postgres_changes', { event: '*', table: 'events' }, () => {
    // Cuando algo cambia en la tabla → recargar datos
    reload()
  })
  .subscribe()
```

Esto significa: si alguien crea un partido desde otro movil, tu lista se actualiza automaticamente.

---

## 9. Logica del juego (gamificacion)

La gamificacion esta en `src/lib/game/`. Son **funciones puras** (sin efectos, sin Supabase, solo calculos).

### 9.1. Niveles (`levels.ts`)

8 niveles basados en XP:

| Nivel | Nombre | Icono | XP minimo |
|-------|--------|-------|-----------|
| 1 | Rookie | 🥉 | 0 |
| 2 | Amateur | 🥈 | 100 |
| 3 | Semi-Pro | 🥇 | 300 |
| 4 | Pro | ⭐ | 600 |
| 5 | Estrella | 🌟 | 1000 |
| 6 | Elite | 💎 | 2000 |
| 7 | Master | 🏆 | 5000 |
| 8 | Leyenda | 🏛️ | 10000 |

Funciones:
- `getLevel(xp)` → devuelve el nivel actual
- `xpPercent(xp)` → porcentaje de progreso hacia el siguiente nivel (para la barra)

### 9.2. Insignias/Badges (`badges.ts`)

200+ insignias organizadas en categorias:

| Categoria | Ejemplos |
|-----------|----------|
| **Goles (partido)** | Doblete (2), Hat trick (3), Poker (4), Manita (5) |
| **Goles (acumulados)** | 10, 25, 50, 100, 200, 500 goles |
| **Asistencias** | 2-3 por partido, 10-200 acumuladas |
| **Especiales** | Chilena, Olimpico, Tacon, Penalti parado |
| **Partidos** | 1, 5, 10, 25, 50, 100, 250, 500, 1000 |
| **MVP** | 1, 5, 10, 25, 50, 100 MVPs |
| **Combos** | Hat trick + MVP, Partido perfecto |
| **Meta** | 50, 100, 150 badges totales |
| **Portero** | 3, 10 porterias a cero, parada doble |
| **Racha** | 2, 5, 10 victorias seguidas |
| **Social** | Primera valoracion, rating perfecto |
| **Tiempo** | Madrugador, Nocturno, Weekender |

Cada badge tiene: icono (emoji), nombre, descripcion, XP que otorga.

**Como se detectan:**
Cuando registras un resultado, la funcion `detectBadges()` revisa:
```
jugador tiene 3 goles este partido? → badge "hat_trick"
jugador tiene 100 goles totales? → badge "goles_100"
jugador fue MVP + hat trick? → badge "mvp_hat_trick"
```

### 9.3. Puntuacion (`scoring.ts`)

Cada jugador tiene un **score** compuesto:
- **40%** ratio goles/partido
- **30%** ratio asistencias/partido
- **30%** ratio MVPs
- **50%** rating de valoraciones de otros jugadores

Este score se usa para **generar equipos equilibrados**.

### 9.4. Generacion de equipos (`teams.ts`)

4 modos:

| Modo | Como funciona |
|------|--------------|
| **Equilibrado** | Reparte alternando por puntuacion + 30 rondas de optimizacion para minimizar diferencia |
| **Aleatorio** | Mezcla completamente al azar (Fisher-Yates shuffle) |
| **Snake Draft** | Rondas alternas: A-B-B-A-A-B-B-A (como draft de NBA) |
| **Capitanes** | Los 2 mejores son capitanes, luego eligen alternando |

Cada resultado incluye un indicador de balance (verde = equilibrado, rojo = desigual).

---

## 10. Sesion y roles

### El store de sesion (`stores/session.ts`)

Usa **Zustand** (un almacen de estado) para recordar:
- `communityId`: en que comunidad estoy
- `communityColor`: el color de mi comunidad
- `playerId`: mi ID de jugador (si me identifique)
- `role`: mi rol (guest, player, admin)

Se guarda en **localStorage** del navegador → si cierras y abres, sigues logueado.

### Los 3 roles

| Rol | Como entras | Que puedes hacer |
|-----|-------------|-----------------|
| **guest** | Solo con el PIN | Ver todo, pero no modificar nada |
| **player** | PIN + tu codigo de jugador | Confirmar asistencia, votar, ver tu perfil |
| **admin** | PIN + codigo del admin de la comunidad, o ADMIN_PIN maestro | Todo: crear/editar/borrar eventos, jugadores, comunidades |

### Flujo de autenticacion

```
1. Usuario abre furbito.app
2. Introduce PIN "1234"
3. App busca en Supabase: SELECT * FROM communities WHERE pin = '1234'
4. Si existe → guarda communityId en Zustand
5. Si tambien puso codigo de jugador:
   → Busca: SELECT * FROM players WHERE code = 'AX3K' AND community_id = '...'
   → Si existe → guarda playerId, role = 'player'
6. Redirige a /{communityId}
```

---

## 11. Estilos

### Tailwind CSS

En vez de escribir CSS tradicional:
```css
/* CSS tradicional */
.boton {
  background-color: green;
  padding: 8px 16px;
  border-radius: 8px;
}
```

Usamos clases de Tailwind directamente en el HTML:
```html
<!-- Tailwind -->
<button class="bg-green-500 px-4 py-2 rounded-lg">
```

Cada clase hace UNA cosa:
- `bg-green-500` = fondo verde
- `px-4` = padding horizontal 16px
- `py-2` = padding vertical 8px
- `rounded-lg` = bordes redondeados
- `text-white` = texto blanco
- `flex` = display flex
- `gap-2` = espacio entre elementos 8px

### Variables CSS (el tema visual)

En `globals.css` definimos variables que controlan todo el look:

```css
:root {
  --bg: #0a0a0a;        /* Fondo principal (casi negro) */
  --surface: #1a1a1a;   /* Fondo de tarjetas */
  --text: #ffffff;       /* Texto principal (blanco) */
  --accent: #a8ff3e;     /* Color de acento (verde neon) */
  --border: #2a2a2a;     /* Bordes */
}
```

El color de la comunidad se aplica dinamicamente:
```tsx
// En [cid]/layout.tsx
document.documentElement.style.setProperty('--comm-color', community.color)
```

---

## 12. Flujos completos paso a paso

### Flujo 1: Crear una comunidad y un partido

```
1. Abres furbito.app
2. Pestaña "Crear" → nombre: "Los Cracks", PIN: "1234", color: verde
3. Click "Crear" → Supabase INSERT INTO communities VALUES (...)
4. Automaticamente entras como admin → redirect a /abc123
5. Dashboard vacio → click "Crear partido"
6. Rellenas: titulo, fecha, hora, lugar
7. Click "Crear" → Supabase INSERT INTO events VALUES (...)
8. El partido aparece en la lista
```

### Flujo 2: Confirmar asistencia

```
1. Un jugador abre furbito.app
2. Pone PIN "1234" + su codigo "AX3K"
3. Entra como jugador → ve el dashboard con el proximo partido
4. Click en el partido → detalle
5. Click "Voy" (✅)
6. → Supabase INSERT INTO confirmations (event_id, player_id, status) VALUES (..., ..., 'yes')
7. La barra de confirmaciones se actualiza EN TIEMPO REAL para todos
```

### Flujo 3: Registrar resultado de un partido

```
1. Admin abre el detalle del partido → click "Registrar resultado"
2. PASO 1 - Equipos:
   - Click "Generar equipos" → elige modo (equilibrado, aleatorio, snake, capitanes)
   - Selecciona jugadores → genera → Equipo A y Equipo B
   - O arrastra jugadores manualmente
3. PASO 2 - Resultado:
   - Pone marcador: 3 - 2
   - Selecciona MVP del partido
4. PASO 3 - Stats:
   - Para cada jugador: goles (+/-), asistencias (+/-), logros especiales
5. Click "Guardar":
   a. UPDATE events SET score_a=3, score_b=2, mvp_id=...
   b. Para cada jugador:
      - INSERT INTO match_players (goals, assists, team, xp_earned, ...)
      - calcXP() → cuanto XP gano este jugador
      - detectBadges() → que badges nuevos desbloqueo
      - UPDATE players SET xp += xp_earned, goals += goals, badges = badges + nuevos
6. Todos ven el resultado actualizado instantaneamente
```

### Flujo 4: Generar equipos equilibrados

```
1. Click "Generar equipos" (desde jugadores o resultado de partido)
2. Seleccionar jugadores que van a jugar
3. Elegir modo "Equilibrado"
4. El algoritmo:
   a. Calcula el "score" de cada jugador (stats + rating de votos)
   b. Ordena por score descendente
   c. Asigna alternando: A-B-B-A-A-B-B-A...
   d. 30 rondas de optimizacion:
      - Intenta intercambiar 2 jugadores entre equipos
      - Si la diferencia mejora → mantiene el cambio
      - Si no → revierte
5. Resultado: Equipo A (145 pts) vs Equipo B (143 pts) → "Muy equilibrado" (verde)
```

---

## 13. Glosario de terminos

| Termino | Significado |
|---------|------------|
| **Component** | Pieza de interfaz reutilizable (boton, tarjeta, etc.) |
| **Hook** | Funcion especial de React (empieza con `use`) para manejar estado o datos |
| **Props** | Los parametros que le pasas a un componente |
| **State** | Datos que pueden cambiar y hacen que la interfaz se actualice |
| **useEffect** | Hook que ejecuta codigo cuando el componente se monta o cuando cambian sus dependencias |
| **useState** | Hook que crea una variable de estado (cambia → se re-renderiza) |
| **API** | Interfaz de programacion. Supabase expone una API para acceder a la base de datos |
| **Query** | Consulta a la base de datos (SELECT, INSERT, UPDATE, DELETE) |
| **Realtime** | Actualizaciones instantaneas sin recargar la pagina |
| **SSR** | Server-Side Rendering: la pagina se genera en el servidor |
| **PWA** | Progressive Web App: web que se instala como app nativa |
| **RLS** | Row Level Security: reglas que controlan quien ve que datos en Supabase |
| **Zustand** | Libreria de gestion de estado (como un almacen global) |
| **Tailwind** | Framework CSS con clases utilitarias cortas |
| **TypeScript** | JavaScript con tipos (mas seguro, menos errores) |
| **Layout** | Componente que envuelve a las paginas (marco comun) |
| **Middleware** | Codigo que se ejecuta antes de cargar cada pagina |
| **Build** | Proceso de compilar el codigo para produccion |
| **Deploy** | Subir el codigo compilado a un servidor (Vercel) |
| **Commit** | Guardar cambios en git (como un "checkpoint") |
| **Branch** | Rama de git (copia independiente del codigo para trabajar sin afectar al principal) |

---

## Donde encontrar mas informacion

- `DOCS/SETUP.md` — Como montar el proyecto desde cero
- `DOCS/ARCHITECTURE.md` — Arquitectura tecnica detallada
- `DOCS/SUBIR_DESDE_CERO.md` — Guia paso a paso para subir a produccion
- `DOCS/WARROOM_ROADMAP_30D.md` — Roadmap de 30 dias
- `supabase/schema.sql` — El schema completo de la base de datos (con comentarios)
