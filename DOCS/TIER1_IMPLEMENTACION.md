# TIER 1 — Plan de Implementación

> Autenticación Real (Supabase Auth) + Push Notifications
> Fecha: 2026-03-29

---

## 1. PUSH NOTIFICATIONS (MVP — Fase 1)

### Objetivo
Notificar a los jugadores de eventos clave para aumentar retención:
- Nuevo partido creado
- Recordatorio 24h antes del partido
- Partido finalizado (resultado + MVP)
- Insignia desbloqueada

### Enfoque técnico
**Web Push API** con VAPID keys + Service Worker existente (`public/sw.js`).

### Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser     │────▸│ Service Worker│────▸│ Push Service │
│  (client)    │◂────│  (sw.js)     │◂────│ (FCM/Mozilla)│
└─────────────┘     └──────────────┘     └──────────────┘
       │                                         ▲
       │ subscribe                                │ send push
       ▼                                         │
┌─────────────┐                          ┌──────────────┐
│  Supabase    │─────────────────────────▸│ Edge Function│
│  DB          │  trigger / webhook       │ (send-push)  │
└─────────────┘                          └──────────────┘
```

### Base de datos

```sql
-- Nueva tabla para suscripciones push
CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  key_auth TEXT NOT NULL,
  key_p256dh TEXT NOT NULL,
  preferences JSONB DEFAULT '{
    "event_created": true,
    "event_reminder": true,
    "match_finished": true,
    "badge_earned": true
  }',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (por ahora público, migrar con Auth)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
```

### Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `src/lib/notifications/push-manager.ts` | Suscripción Web Push, gestión VAPID, registro endpoint |
| `src/lib/notifications/notification-service.ts` | Mostrar notificaciones locales, gestión permisos |
| `src/hooks/usePushNotifications.ts` | Hook para inicializar push en layout de comunidad |
| `src/components/notifications/NotificationPrompt.tsx` | Prompt educativo para pedir permiso |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `public/sw.js` | Añadir listeners: `push`, `notificationclick`, `notificationclose` |
| `src/app/[cid]/layout.tsx` | Montar `usePushNotifications` hook |
| `src/app/[cid]/ajustes/page.tsx` | UI para preferencias de notificaciones |
| `.env.local` | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` |

### Flujo de suscripción

```
1. Usuario entra a comunidad identificado como jugador
2. NotificationPrompt aparece (una vez, localStorage)
3. Usuario acepta → browser genera PushSubscription
4. Cliente envía subscription a Supabase (push_subscriptions)
5. Cuando ocurre un evento → Edge Function envía push
6. Service Worker recibe push → muestra notificación nativa
7. Click en notificación → navega a la página del evento
```

### VAPID Keys

```bash
# Generar con web-push CLI
npx web-push generate-vapid-keys
# Output:
# Public Key: BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ=
# Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 2. AUTENTICACIÓN REAL (Supabase Auth)

### Objetivo
Reemplazar el sistema de PINs en texto plano por Supabase Auth real con RLS.

### Enfoque: Hybrid PIN + Auth
Mantener la UX actual (PIN de comunidad + código de jugador) pero crear usuario Supabase Auth por detrás.

### Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                    FLUJO ACTUAL                       │
│  PIN comunidad → buscar community → código jugador   │
│  → setear Zustand store → navegar                    │
└──────────────────────────────────────────────────────┘
                        ↓ migra a ↓
┌──────────────────────────────────────────────────────┐
│                    FLUJO NUEVO                        │
│  PIN comunidad → buscar community → código jugador   │
│  → supabase.auth.signUp/signIn (anonymous o custom)  │
│  → user_metadata: { communityId, playerId, role }    │
│  → RLS valida automáticamente                        │
└──────────────────────────────────────────────────────┘
```

### Estrategia de migración (3 fases)

**Fase A — Anonymous Auth + metadata (mínimo cambio UX)**
```typescript
// Después de validar PIN + código, crear usuario anónimo
const { data } = await supabase.auth.signInAnonymously()
await supabase.auth.updateUser({
  data: { communityId, playerId, role }
})
```
- No requiere email/teléfono
- Mantiene UX idéntica
- Habilita RLS con `auth.uid()`

**Fase B — RLS policies reales**
```sql
-- Ejemplo: solo leer datos de tu comunidad
CREATE POLICY "community_read" ON players
  FOR SELECT USING (
    community_id = (auth.jwt() ->> 'communityId')::text
  );

-- Solo admin puede crear eventos
CREATE POLICY "admin_create_events" ON events
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
```

**Fase C — Migración a email/social (opcional, futuro)**
- Convertir usuarios anónimos a cuentas reales
- `supabase.auth.updateUser({ email: '...' })`
- Magic links, Google, Apple

### Base de datos

```sql
-- Tabla users vinculada a auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id TEXT REFERENCES communities(id),
  player_id TEXT REFERENCES players(id),
  role TEXT CHECK (role IN ('guest', 'player', 'admin')) DEFAULT 'guest',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Usuario puede leer/actualizar su propio registro
CREATE POLICY "users_self" ON public.users
  FOR ALL USING (id = auth.uid());
```

### Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `src/lib/supabase/auth.ts` | Helpers: signInAnonymous, updateRole, getSession |
| `src/hooks/useAuth.ts` | Hook de autenticación (reemplaza useSession gradualmente) |
| `DOCS/MIGRACION_AUTH.md` | Guía de migración SQL paso a paso |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/stores/session.ts` | Integrar con supabase.auth (dual mode durante migración) |
| `src/app/page.tsx` | Añadir signInAnonymously tras validar PIN |
| `src/app/[cid]/layout.tsx` | Auth guard usa supabase.auth.getUser() |
| `src/lib/supabase/client.ts` | Configurar auth persistence |

### Impacto en archivos existentes

22 archivos usan `useSession()`. La migración es gradual:
1. Fase A: `useSession` internamente llama a Supabase Auth
2. Fase B: RLS policies activas, client-side checks se mantienen como UX
3. Fase C: Eliminar checks client-side redundantes

---

## 3. ORDEN DE EJECUCIÓN

```
PUSH NOTIFICATIONS (Sprint actual)
├── 1. Generar VAPID keys
├── 2. Crear tabla push_subscriptions
├── 3. Actualizar sw.js (push + notificationclick)
├── 4. Crear push-manager.ts + notification-service.ts
├── 5. Hook usePushNotifications + integrar en layout
├── 6. UI preferencias en ajustes
└── 7. Test + build

SUPABASE AUTH (Sprint siguiente)
├── 1. Crear tabla users + SQL migration
├── 2. Implementar auth.ts helpers (anonymous auth)
├── 3. Refactorizar login page (hybrid)
├── 4. Actualizar session store (dual mode)
├── 5. Auth guard en layout
├── 6. RLS policies reales
└── 7. Test + build
```

---

## 4. RIESGOS Y MITIGACIÓN

| Riesgo | Mitigación |
|--------|-----------|
| Push no funciona en iOS Safari <16.4 | Degradación graceful, no bloquear UI |
| Auth anónimo pierde sesión | localStorage backup + reconexión |
| RLS rompe queries existentes | Implementar policies incrementalmente, testear cada una |
| VAPID keys expuestas | Public key en .env, private key solo en Edge Functions |
| Usuarios existentes sin auth | Crear usuario anónimo al primer login post-migración |

---

## 5. DEFINICIÓN DE HECHO

### Push Notifications ✅ cuando:
- [ ] VAPID keys generadas y configuradas
- [ ] Tabla push_subscriptions creada en Supabase
- [ ] sw.js maneja eventos push y notificationclick
- [ ] Jugador puede aceptar/rechazar notificaciones
- [ ] Preferencias editables en ajustes
- [ ] Notificación funciona al crear un evento (demo)
- [ ] `npx next build` pasa sin errores

### Supabase Auth ✅ cuando:
- [ ] Tabla users creada y vinculada a auth.users
- [ ] Login crea usuario anónimo en Supabase Auth
- [ ] Session store sincronizado con auth state
- [ ] Al menos 1 RLS policy real activa (community isolation)
- [ ] Guest/Player/Admin siguen funcionando correctamente
- [ ] `npx next build` pasa sin errores
