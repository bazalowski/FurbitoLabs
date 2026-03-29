# Migración a Supabase Auth — Guía paso a paso

> Fecha: 2026-03-29
> Estado: Fase A implementada (Anonymous Auth)

---

## Resumen

Se ha implementado un sistema **hybrid** que mantiene la UX actual (PIN de comunidad + código de jugador) pero crea usuarios reales de Supabase Auth por detrás.

### Lo que cambió

| Antes | Después |
|-------|---------|
| Solo Zustand localStorage | Zustand + Supabase Auth anónimo |
| Sin usuario en auth.users | Usuario anónimo creado al login |
| RLS todo público | RLS con policies reales (permisivas durante migración) |
| Sin tabla users | Tabla `public.users` vinculada a `auth.users` |

---

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `src/lib/supabase/auth.ts` | Helpers: signInAnonymously, upsertUserRecord, signOut, getCurrentUser |
| `supabase/migrations/002_users_auth.sql` | Tabla users, RLS policies, funciones helper |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/stores/session.ts` | login() ahora crea usuario anónimo + upsert en public.users |

---

## SQL a ejecutar en Supabase Dashboard

### Paso 1: Crear tabla users

Ve a **Supabase Dashboard → SQL Editor** y ejecuta el contenido de:
```
supabase/migrations/002_users_auth.sql
```

### Paso 2: Verificar que Anonymous Auth está habilitado

1. Ve a **Supabase Dashboard → Authentication → Providers**
2. Busca **"Anonymous Sign-ins"**
3. Activa el toggle si no está activado

> **IMPORTANTE**: Sin Anonymous Auth habilitado, el signInAnonymously() fallará silenciosamente y la app seguirá funcionando con solo Zustand (degradación graceful).

### Paso 3: Verificar tabla push_subscriptions

También ejecuta:
```
supabase/migrations/001_push_subscriptions.sql
```

---

## Cómo funciona el flujo

```
Usuario entra PIN de comunidad + código de jugador
         ↓
  Zustand: session.login(communityId, color, role, playerId)
         ↓
  (async, fire-and-forget)
         ↓
  supabase.auth.signInAnonymously()
         ↓
  public.users.upsert({ id: auth_user_id, community_id, player_id, role })
         ↓
  Session funciona con Zustand (inmediato)
  Auth se sincroniza por detrás (async)
```

### Degradación graceful

Si Supabase Auth falla (red, config, etc.):
- La app **sigue funcionando** exactamente igual que antes
- Zustand mantiene la sesión en localStorage
- El error se loguea en consola pero no se muestra al usuario

---

## Fases de migración

### Fase A — Anonymous Auth ✅ (implementada)
- [x] Tabla `public.users` creada
- [x] `signInAnonymously()` en login
- [x] `upsertUserRecord()` sincroniza estado
- [x] RLS policies permisivas (no rompen nada)
- [x] Helpers: `get_user_community_id()`, `get_user_role()`

### Fase B — RLS estricto (próxima)
Reemplazar las policies permisivas por policies que usen `auth.uid()`:
```sql
-- Ejemplo: solo leer jugadores de tu comunidad
CREATE POLICY "players_community_read" ON players
  FOR SELECT USING (
    community_id = public.get_user_community_id()
  );

-- Solo admin puede crear eventos
CREATE POLICY "events_admin_create" ON events
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'admin'
    AND community_id = public.get_user_community_id()
  );
```

### Fase C — Auth real (futuro)
Convertir usuarios anónimos a cuentas reales:
```typescript
// Cuando el usuario quiera "registrarse"
await supabase.auth.updateUser({
  email: 'user@example.com',
  password: 'secure-password'
})
```
Esto preserva el UUID y todos los datos vinculados.

---

## Troubleshooting

### "Anonymous Auth not enabled"
→ Supabase Dashboard → Auth → Providers → Activar Anonymous Sign-ins

### "RLS policy violation"
→ Las policies actuales son permisivas (`OR true`). Si ves errores de RLS, verifica que las migraciones se ejecutaron correctamente.

### "Session perdida al recargar"
→ Zustand persiste en localStorage. Supabase Auth tiene su propia persistencia. Ambos deberían sobrevivir recargas.

### "auth.uid() returns null"
→ El usuario no está autenticado en Supabase Auth. El login de Zustand funciona, pero el auth anónimo falló. Verificar que Anonymous Auth esté habilitado.
