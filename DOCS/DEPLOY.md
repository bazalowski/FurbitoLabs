# FURBITO — Como subir cambios a produccion (Vercel)

> Cada vez que hagas un cambio en el codigo y quieras que se vea online,
> sigue estos pasos. Tiempo: 2 minutos.

---

## El flujo es siempre el mismo

```
Tu haces cambios en el codigo
        |
        v
   git add .          (preparar los cambios)
        |
        v
   git commit -m "..."  (guardar los cambios con un mensaje)
        |
        v
   git push            (subir a GitHub)
        |
        v
   Vercel detecta el push automaticamente
        |
        v
   Vercel hace build + deploy (1-2 min)
        |
        v
   Tu app esta actualizada en produccion!
```

---

## Paso a paso (copia y pega en la terminal)

### 1. Ver que archivos cambiaron

```bash
git status
```

Veras algo como:
```
modified:   src/app/page.tsx
new file:   src/components/MiComponente.tsx
```

### 2. Preparar los cambios (staging)

```bash
git add .
```

Esto prepara TODOS los archivos cambiados. Si solo quieres subir algunos:
```bash
git add src/app/page.tsx src/components/MiComponente.tsx
```

### 3. Guardar los cambios (commit)

```bash
git commit -m "descripcion corta de lo que cambiaste"
```

Ejemplos de buenos mensajes:
- `git commit -m "fix: corregir error al crear comunidad"`
- `git commit -m "feat: añadir modo oscuro"`
- `git commit -m "style: mejorar diseño del ranking"`

### 4. Subir a GitHub (push)

```bash
git push
```

Si es la primera vez o te pide configurar upstream:
```bash
git push -u origin main
```

### 5. Esperar el deploy automatico

1. Ve a [vercel.com](https://vercel.com) → tu proyecto
2. Veras "Building..." durante 1-2 minutos
3. Cuando diga "Ready", tu app esta actualizada

---

## Resumen rapido (3 comandos)

```bash
git add .
git commit -m "tu mensaje aqui"
git push
```

Eso es todo. Vercel hace el resto.

---

## Verificar que el deploy funciono

### Opcion A: En Vercel
1. Ve a vercel.com → tu proyecto → "Deployments"
2. El mas reciente deberia decir "Ready" con check verde

### Opcion B: En la terminal
Si tienes la CLI de Vercel instalada:
```bash
npx vercel --prod
```

### Opcion C: Simplemente abre tu URL
Abre `https://tu-proyecto.vercel.app` y verifica que los cambios estan.

---

## Que hacer si el deploy falla

### Error: "Build failed"
El codigo tiene un error. Ejecuta esto localmente para ver que fallo:
```bash
npm run build
```

Corrige el error, y luego repite los 3 comandos (add, commit, push).

### Error: "Environment variables missing"
Falta configurar variables en Vercel:
1. Ve a Vercel → tu proyecto → Settings → Environment Variables
2. Asegurate de tener:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_PIN`

### El deploy se ve bien pero la app no funciona
- Verifica que las env vars en Vercel son correctas
- Verifica que el schema SQL esta ejecutado en Supabase
- Abre la consola del navegador (F12) para ver errores

---

## Variables de entorno en Vercel

IMPORTANTE: Las variables de `.env.local` son solo para desarrollo local.
Para produccion, debes configurarlas en Vercel:

1. Ve a vercel.com → tu proyecto
2. Settings → Environment Variables
3. Añade cada variable:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gkmcvvtiwifxltivhkla.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key de Supabase |
| `NEXT_PUBLIC_ADMIN_PIN` | Tu PIN de admin |

4. Click "Save"
5. Ve a Deployments → click "Redeploy" en el ultimo deploy

---

## Tips

- **NUNCA** subas `.env.local` a GitHub (esta en `.gitignore`)
- Haz commits pequenos y frecuentes (mejor 5 commits pequenos que 1 gigante)
- Escribe mensajes descriptivos en los commits
- Si algo sale mal, puedes volver atras con `git revert HEAD`
- Cada Pull Request en GitHub genera un "Preview Deploy" en Vercel con URL temporal
