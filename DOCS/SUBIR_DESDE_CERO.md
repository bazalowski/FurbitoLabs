# FURBITO v2 — Subir desde cero (paso a paso)

> Este documento asume que partes de un repositorio limpio.
> Sigue los pasos en orden. Tiempo estimado: 30-45 minutos.

---

## Checklist rapido

- [ ] Node.js 18+ instalado (`node -v`)
- [ ] Cuenta en Supabase (gratis)
- [ ] Cuenta en GitHub (gratis)
- [ ] Cuenta en Vercel (gratis)

---

## 1. SUPABASE — Crear proyecto y base de datos

### 1.1 Crear proyecto
1. Entra en https://supabase.com → Dashboard → **New Project**
2. Nombre del proyecto: `furbito`
3. Password de la base de datos: **guárdala**, la necesitarás si usas CLI
4. Región: elige la más cercana (ej: `West EU (Ireland)`)
5. Espera ~2 minutos a que el proyecto se cree

### 1.2 Ejecutar el schema SQL
1. En el sidebar de Supabase → **SQL Editor**
2. Click **New Query**
3. Copia **todo** el contenido del archivo `supabase/schema.sql`
4. Pégalo en el editor SQL
5. Click **Run** (botón azul ▶)
6. Deberías ver: "Success. No rows returned" — eso es correcto
7. Ve a **Table Editor** en el sidebar y verifica que existen las tablas:
   - `communities`, `players`, `events`, `confirmations`, `match_players`, `votes`, `pistas`

### 1.3 Copiar credenciales
1. En el sidebar → **Project Settings** (icono de engranaje abajo)
2. Click **API**
3. Anota estos dos valores (los necesitarás en el paso 3 y 5):
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (la larga)

### 1.4 Activar Realtime (opcional pero recomendado)
1. Sidebar → **Database** → **Replication**
2. En la sección de tablas, activa el toggle para:
   - `events`
   - `confirmations`
   - `match_players`
3. Esto permite actualizaciones en tiempo real cuando otro usuario confirma asistencia

---

## 2. GITHUB — Crear repositorio

### Opción A: Repositorio nuevo (recomendado)
1. Ve a https://github.com/new
2. Nombre: `furbito`
3. Visibilidad: privado o público (tu elección)
4. **NO** marques "Add README" ni ".gitignore" (ya existen en el código)
5. Click **Create repository**
6. GitHub te mostrará comandos — los usarás en el paso 4

### Opción B: Usar el repositorio existente
Si ya tienes un repo con código antiguo, puedes:
1. Borrar todos los archivos antiguos del repo
2. Subir el código nuevo (paso 4)

---

## 3. LOCAL — Configurar el proyecto

### 3.1 Instalar Node.js (si no lo tienes)
- Descarga de: https://nodejs.org (versión LTS)
- Verifica: `node -v` (debe ser 18+)

### 3.2 Clonar o copiar los archivos
Si clonaste el repo:
```bash
cd furbito
```

### 3.3 Crear .env.local
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci_TU_ANON_KEY_AQUI
```

> **Super-admin del panel `/admin`**: no se configura con PIN en env.
> Se crea como user en Supabase Auth (Dashboard → Authentication → Users)
> y su UUID se fija en `supabase/migrations/013_super_admin.sql`. El acceso
> es por email + password.

### 3.4 Instalar dependencias y probar
```bash
npm install
npm run dev
```

Abre http://localhost:3000 — deberías ver la pantalla de login de FURBITO.

### 3.5 Verificar que todo funciona
1. Tab **Crear** → nombre: "Mi Equipo", PIN: "TEST1234", elige un color
2. Click "Crear comunidad"
3. Deberías entrar al dashboard vacío
4. Ve a Supabase → **Table Editor** → `communities` — deberías ver tu comunidad

Si todo funciona, continúa al siguiente paso.

---

## 4. GIT — Subir el código a GitHub

```bash
# Desde la raíz del proyecto
git init
git add .
git commit -m "feat: FURBITO v2 — Next.js + Supabase + Vercel"

# Conectar con tu repo de GitHub
git remote add origin https://github.com/TU_USUARIO/furbito.git
git branch -M main
git push -u origin main
```

Verifica en GitHub que todos los archivos se subieron correctamente.

> **NUNCA debería aparecer `.env.local` en GitHub.** Si lo ves, algo está mal con el `.gitignore`.

---

## 5. VERCEL — Deploy automático

### 5.1 Conectar repositorio
1. Ve a https://vercel.com → **Add New** → **Project**
2. Click **Import** en tu repositorio `furbito`
3. Framework Preset: **Next.js** (se detecta solo)

### 5.2 Variables de entorno
Antes de hacer deploy, configura las variables de entorno:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key (la larga) |

### 5.3 Deploy
1. Click **Deploy**
2. Espera 1-2 minutos
3. Vercel te dará una URL: `https://furbito-xxx.vercel.app`
4. Abre esa URL — deberías ver FURBITO funcionando

### 5.4 (Opcional) Dominio personalizado
1. En Vercel → **Settings** → **Domains**
2. Añade tu dominio y sigue las instrucciones de DNS

### 5.5 Deploys automáticos
A partir de ahora, cada `git push` a `main` desplegará automáticamente.
Cada PR generará un **Preview Deploy** con URL temporal.

---

## 6. POST-DEPLOY — Primeros pasos

### 6.1 Crear tu primera comunidad
1. Abre la URL de producción
2. Tab **Crear** → nombre + PIN + color
3. Comparte el PIN con tus amigos

### 6.2 Añadir jugadores
1. Entra con el PIN de la comunidad
2. Ve a **Jugadores** → **+ Añadir**
3. Cada jugador recibe un código de 4 caracteres (ej: `AX3K`)
4. Comparte el código con cada jugador para que puedan identificarse

### 6.3 Crear tu primer evento
1. Ve a **Partidos** → **+ Nuevo partido**
2. Rellena título, fecha, hora, lugar
3. Los jugadores confirman asistencia con ✅/🤔/❌

### 6.4 Acceder al panel admin
1. Ve directamente a `/admin/login` en tu URL de producción
2. Introduce el email + password del user super-admin (creado en
   Supabase Dashboard → Authentication → Users)
3. Accederás al panel donde puedes gestionar todas las comunidades

---

## Estructura de archivos del proyecto

```
furbito/
├── .env.example           # Template de variables de entorno
├── .gitignore             # Archivos a ignorar en git
├── next.config.mjs        # Configuración de Next.js
├── package.json           # Dependencias y scripts
├── postcss.config.js      # PostCSS (para Tailwind)
├── tailwind.config.ts     # Colores, fuentes, breakpoints
├── tsconfig.json          # Configuración TypeScript
├── vercel.json            # Configuración de Vercel
│
├── public/                # Assets estáticos
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker
│   └── icons/             # Iconos PWA (192x192, 512x512)
│
├── src/
│   ├── app/               # Páginas (App Router)
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Login/crear comunidad
│   │   ├── globals.css    # Estilos globales + CSS vars
│   │   ├── admin/         # Panel admin global
│   │   └── [cid]/         # Rutas de comunidad
│   │       ├── layout.tsx       # Layout con nav + banner
│   │       ├── page.tsx         # Dashboard
│   │       ├── partidos/        # Eventos
│   │       ├── jugadores/       # Jugadores
│   │       ├── ranking/         # Rankings
│   │       ├── pistas/          # Mapa de pistas
│   │       └── ajustes/         # Configuración
│   │
│   ├── components/        # Componentes React
│   │   ├── ui/            # Atómicos (Button, Card, Modal...)
│   │   ├── layout/        # Layout (Header, BottomNav...)
│   │   ├── events/        # Eventos (EventCard, EventForm...)
│   │   ├── players/       # Jugadores (PlayerCard, TeamGen...)
│   │   ├── ranking/       # Ranking (RankingTable)
│   │   └── pistas/        # Pistas (PistaMap)
│   │
│   ├── hooks/             # Custom hooks (useEvents, usePlayers...)
│   ├── lib/               # Lógica de negocio
│   │   ├── supabase/      # Clientes (client + server)
│   │   ├── game/          # Badges, levels, scoring, teams
│   │   └── utils.ts       # Helpers
│   │
│   ├── stores/            # Zustand (sesión)
│   └── types/             # TypeScript interfaces
│
├── supabase/
│   └── schema.sql         # DDL completo de la base de datos
│
└── DOCS/
    ├── SETUP.md           # Guía de setup
    ├── ARCHITECTURE.md    # Arquitectura técnica
    ├── SUBIR_DESDE_CERO.md # Este documento
    ├── WARROOM_ROADMAP_30D.md # Roadmap de 30 días
    └── GUIA_CODIGO.md     # Guía completa del código (para principiantes)
```

---

## Comandos de referencia

```bash
npm run dev          # Desarrollo local (http://localhost:3000)
npm run build        # Build de producción
npm run start        # Servir build local
npm run lint         # Linter
npm run type-check   # Verificar tipos TypeScript
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `npm install` falla | Verifica Node.js 18+ (`node -v`) |
| "Invalid API key" en Supabase | Revisa `.env.local`, reinicia `npm run dev` |
| Mapa no carga | Normal si no hay pistas aún. Leaflet requiere `'use client'` |
| Login no funciona | Verifica que ejecutaste `schema.sql` en Supabase |
| Build falla en Vercel | Revisa que las env vars están configuradas en Vercel |
| Datos no se actualizan en tiempo real | Activa Realtime en Supabase (paso 1.4) |
| `.env.local` aparece en GitHub | Revisa `.gitignore`, haz `git rm --cached .env.local` |

---

## Iconos PWA

Necesitas crear 2 iconos y ponerlos en `public/icons/`:
- `icon-192.png` (192x192 px)
- `icon-512.png` (512x512 px)

Puedes usar cualquier generador de iconos PWA online, o crear un icono con un emoji de fútbol ⚽.
