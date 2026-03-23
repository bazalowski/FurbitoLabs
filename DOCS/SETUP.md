# FURBITO v2 — Guía de Setup Completa

## Requisitos previos
- Node.js 18+ instalado
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en [GitHub](https://github.com) (gratis)

---

## PASO 1 — Supabase: crear proyecto y schema

### 1.1 Crear el proyecto
1. Ve a [supabase.com](https://supabase.com) → **New Project**
2. Elige nombre: `furbito`
3. Elige una contraseña de base de datos (guárdala)
4. Región: la más cercana a tus usuarios (ej: `West EU`)

### 1.2 Ejecutar el schema SQL
1. En tu proyecto Supabase → **SQL Editor** → **New Query**
2. Copia y pega el contenido de `supabase/schema.sql`
3. Haz clic en **Run** (▶)
4. Verifica que se crearon las tablas en **Table Editor**

### 1.3 Obtener las credenciales
1. Ve a **Project Settings** → **API**
2. Copia:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon (public) key** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.4 (Opcional) Activar Realtime
1. Ve a **Database** → **Replication**
2. Activa las tablas: `events`, `confirmations`, `match_players`

---

## PASO 2 — GitHub: subir el código

```bash
# Clona o descarga el proyecto
cd furbito

# Inicializa git si no está inicializado
git init
git add .
git commit -m "feat: FURBITO v2 - Next.js + Supabase"

# Crea un repositorio en GitHub y sube
git remote add origin https://github.com/TU_USUARIO/furbito.git
git branch -M main
git push -u origin main
```

---

## PASO 3 — Variables de entorno locales

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_PIN=TU_PIN_SECRETO
```

> ⚠️ **NUNCA** subas `.env.local` a GitHub. Está en `.gitignore`.

---

## PASO 4 — Probar localmente

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## PASO 5 — Vercel: deploy automático

### 5.1 Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. **Import** tu repositorio de GitHub `furbito`
3. Framework: **Next.js** (se detecta automáticamente)

### 5.2 Configurar variables de entorno en Vercel
En el paso de configuración (o en **Settings → Environment Variables**):

| Variable                       | Valor                                      |
|--------------------------------|--------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | `https://tu-proyecto.supabase.co`          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Tu anon key de Supabase                   |
| `ADMIN_PIN`                    | Tu PIN maestro de administrador            |

### 5.3 Deploy
Haz clic en **Deploy**. Vercel:
1. Clona el repo
2. Ejecuta `npm install` y `npm run build`
3. Despliega en producción con URL pública

### 5.4 Deploys automáticos
Cada vez que hagas `git push` a `main`, Vercel re-desplegará automáticamente.

---

## PASO 6 — Crear la primera comunidad

1. Abre tu URL de Vercel (ej: `https://furbito.vercel.app`)
2. Tab **Crear** → pon nombre y PIN
3. Crea la comunidad
4. Entra con el PIN → empieza a añadir jugadores

---

## Panel de Administrador

Para acceder al panel admin global:
1. En la pantalla de login, pon el PIN que configuraste en `ADMIN_PIN`
2. Accederás al panel donde puedes ver y gestionar todas las comunidades

---

## Comandos útiles

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run type-check   # Verificar TypeScript
npm run lint         # ESLint
```

---

## Troubleshooting

### Error: "Cannot find module"
```bash
npm install
```

### Error de Supabase: "Invalid API key"
- Verifica que `.env.local` tiene las credenciales correctas
- Reinicia el servidor de desarrollo después de cambiar `.env.local`

### La app no redirige al login
- Verifica que el `communityId` en la URL existe en Supabase
- Borra el localStorage del navegador y vuelve a entrar

### Leaflet no carga el mapa
- El mapa solo funciona en el cliente, no en SSR. Ya está configurado con `'use client'`.
