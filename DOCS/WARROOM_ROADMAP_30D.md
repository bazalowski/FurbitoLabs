# FURBITO v2 — War Room Roadmap 30 días

> Objetivo: pasar de MVP funcional a producto listo para crecimiento.
> Prioridad: estabilidad → UX → features.

---

## SEMANA 1 — Fundamentos sólidos (días 1–7)

### Día 1–2: Infraestructura y deploy
- [ ] Resolver error `next.config.ts` → migrar a `next.config.mjs`
- [ ] Verificar build en Vercel sin errores
- [ ] Confirmar variables de entorno en Vercel (URL, anon key)
- [ ] Activar Realtime en Supabase (tablas: `events`, `confirmations`, `match_players`)

### Día 3–4: Iconos PWA y manifest
- [ ] Crear `public/icons/icon-192.png` y `icon-512.png`
- [ ] Verificar que el Service Worker (`public/sw.js`) funciona offline
- [ ] Probar instalación como PWA en Android/iOS

### Día 5–6: Pruebas de flujo completo
- [ ] Crear comunidad → añadir jugadores → crear partido → confirmar asistencia → registrar resultado
- [ ] Probar generador de equipos (modos: balanced, random, snake)
- [ ] Verificar que el sistema de badges asigna correctamente tras registrar resultado
- [ ] Probar ranking (ELO, goles, asistencias, MVPs)

### Día 7: Correcciones rápidas
- [ ] Listar bugs encontrados en las pruebas
- [ ] Corregir los críticos (bloquean flujo principal)
- [ ] Commit + push + deploy

---

## SEMANA 2 — UX y pulido (días 8–14)

### Mejoras de interfaz
- [ ] Revisar colores y contraste en modo dark/light
- [ ] Añadir estados vacíos (empty states) en listas: jugadores, partidos, ranking
- [ ] Mejorar feedback visual al confirmar asistencia (animación, toast)
- [ ] Skeleton loaders en todas las listas

### Navegación y flujos
- [ ] Revisar que la navegación entre pantallas es fluida sin recargas
- [ ] Añadir botón "volver" donde falte
- [ ] Verificar que el RoleBanner muestra correctamente guest/player/admin

### ~~Mapa de pistas~~ — descartado 2026-04-23
- Mapa eliminado en web; se aplaza a la versión nativa (ver [FURBITO 2.1/FEATURE_AUDIT.md §14](./FURBITO%202.1/FEATURE_AUDIT.md#14-pistas-sin-mapa-en-web--mapa-reservado-para-nativa)).
- En web, crear pista se hace inline desde el selector en `EventForm`.

---

## SEMANA 3 — Features de alto impacto (días 15–21)

### Sistema de notificaciones
- [ ] Push notifications cuando se crea un nuevo partido
- [ ] Notificación cuando alguien te vota
- [ ] Resumen semanal: "Esta semana jugaste X partidos"

### Perfil de jugador
- [ ] Añadir foto de avatar (upload a Supabase Storage)
- [ ] Mostrar historial de partidos del jugador
- [ ] Mostrar badges desbloqueados con descripción
- [ ] Gráfico de evolución de stats en el tiempo

### Partidos — mejoras
- [ ] Chat/comentarios en el evento
- [ ] Recordatorio automático 2h antes del partido (con Service Worker)
- [ ] Exportar lista de asistentes como imagen (para compartir en WhatsApp)

---

## SEMANA 4 — Crecimiento y retención (días 22–30)

### Invitación y onboarding
- [ ] Link de invitación: `furbito.app/{cid}?pin=XXXX` para entrar directo
- [ ] Pantalla de bienvenida mejorada para nuevos jugadores
- [ ] Tutorial de 3 pasos al entrar por primera vez

### Analytics básicos
- [ ] Dashboard admin con métricas: total partidos, jugadores activos, % asistencia media
- [ ] Gráfica de actividad semanal de la comunidad

### Preparación para escala
- [ ] Revisar RLS (Row Level Security) en Supabase
- [ ] Añadir índices en tablas si las queries son lentas
- [ ] Revisar límites del plan gratuito de Supabase y Vercel
- [ ] Documentar límites y plan de upgrade si la comunidad crece

### Feedback loop
- [ ] Añadir botón "Reportar un problema" que abre email/WhatsApp
- [ ] Encuesta rápida in-app a los 7 días de uso (NPS simplificado)

---

## Métricas de éxito al día 30

| Métrica | Objetivo |
|---------|----------|
| Comunidades activas | 3+ |
| Jugadores registrados | 30+ |
| Partidos jugados | 10+ |
| Tasa de asistencia media | > 60% |
| Crashes bloqueantes | 0 |
| PWA instalada en | 5+ dispositivos |

---

## Backlog (post día 30)

- Torneos y competiciones internas
- Modo árbitro (marcar goles en tiempo real durante el partido)
- Integración con Google Calendar / iCal
- Tabla de posiciones tipo liga
- Modo oscuro/claro manual
- Multi-idioma (ES/EN)
- App nativa (Capacitor/Expo) si la PWA no convence en iOS

---

## Comandos útiles día a día

```bash
npm run dev          # Desarrollo local
npm run build        # Verificar que el build no tiene errores
npm run type-check   # Revisar TypeScript sin compilar
npm run lint         # ESLint
git push             # Trigger de deploy automático en Vercel
```
