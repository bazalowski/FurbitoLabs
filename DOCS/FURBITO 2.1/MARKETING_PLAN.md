# FURBITO — Plan de Marketing

> **Objetivo**: llevar FURBITO de producto listo (PWA + app nativa) a producto con tracción real — primera cohorte de **50 comunidades activas** y **500 jugadores MAU** en los primeros 90 días post-lanzamiento.
> **Tono del plan**: agresivo, muy bajo presupuesto, community-driven. FURBITO no puede competir con Mister / Biwenger en paid; compite con ellos en ser **la mejor app para TU grupo**, no para seguir fútbol profesional.
> **Fecha**: 2026-04-23

---

## 1. Posicionamiento — la frase que lo resume

> **"FURBITO es la app que organiza tu partido del jueves, recuerda quién metió los goles y pica a los que siempre se rajan."**

**El pitch de 10 segundos** (para reels, landing, email):

> *¿Quieres que tu grupo de fútbol 7 deje de pelearse con WhatsApp? Crea una comunidad en FURBITO, comparte el PIN y gestiona partidos, equipos auto-balanceados, puntos, MVP y ranking — sin darse de alta con email.*

### 1.1 Contra quién competimos (y contra quién NO)

| App | Qué hace | ¿Competimos? |
|-----|----------|:------------:|
| **Mister / Biwenger** | Fantasy sobre LaLiga | ❌ No — es otro producto |
| **Sofascore / Fotmob** | Datos de fútbol profesional | ❌ No |
| **WhatsApp** | Coordinar partido | ✅ **Sí** — es nuestro rival real |
| **Google Sheets / Excel** | Llevar stats amateur | ✅ Sí |
| **Sporteasy** | Gestión de equipos amateur (más orientado a club) | ✅ Parcial — más formal |
| **Matchday / Fubles (ES)** | Gestión de partidos amateur | ✅ Sí — rival directo |
| **Heya / Playtomic (padel)** | Reservas de pista | ❌ Distinto vertical |

**Ventaja defensiva de FURBITO**:
- Gratis sin fricción (PIN, sin email)
- Gamificación real (badges, puntos Comunio, MVP por voto, niveles L1-L99)
- Realtime puro (ves confirmaciones en vivo)
- Pensado mobile-first, no adaptación de un panel web

**Debilidad a cubrir antes de escalar**:
- No hay app nativa todavía (iOS/Android) → plan §8 y §9.
- No hay red social externa a la comunidad (no descubrible) → primera comunidad = fricción.

---

## 2. Personas objetivo

(Las 5 personas canónicas viven en Notion; aquí el resumen de las 3 prioritarias para lanzamiento.)

### P1 · El organizador cansado — **prioridad nº1**

- 30-40 años, tiene grupo estable de 10-14 personas que juega 1-2 veces por semana.
- Usa Excel o WhatsApp para asistencia, está harto.
- Trigger: un jueves sin respuestas en el grupo, o discusión sobre quién debe cuánto.
- Canales donde vive: WhatsApp (muy activo), Instagram (lurker), YouTube (highlights de su equipo profesional).
- **Qué le vendemos**: "En 30s tu grupo está dentro, cada semana sabes quién juega sin preguntar."
- **Qué le asusta**: aprender una app nueva, que su gente no quiera entrar.
- **Mensaje ganador**: *"Sin email, sin contraseña. Compartes el PIN y ya está."*

### P2 · El capitán amateur

- 22-30, organiza a un grupo de ex-compañeros de colegio/uni.
- Quiere status ("soy el que lo monta todo"), le gusta ver stats.
- Canales: Instagram, TikTok, Reddit (r/Futbol, r/ligasamateur).
- **Qué le vendemos**: "Liga interna de tu grupo, con ranking, badges y puntos como Comunio."
- **Mensaje ganador**: *"Tu grupo ya tiene su propia liga. Solo falta que lo sepan."*

### P3 · El coach del barrio

- 40+, entrena a un grupo estable (no club federado), fútbol 7 con pachangueros fijos.
- Necesita rotar, medir asistencia, retener gente.
- Canales: WhatsApp, Facebook, boca-oreja en el barrio.
- **Qué le vendemos**: equipos auto-balanceados, stats de asistencia, "sin fallar nadie".
- **Mensaje ganador**: *"Equipos justos en 3 segundos. Fin de las quejas."*

---

## 3. Propuesta de valor por persona (tabla resumen)

| Persona | Pain point principal | Feature killer | Métrica de éxito a los 30 días |
|---------|----------------------|----------------|--------------------------------|
| P1 Organizador | Coordinación con WhatsApp | Confirmación en 1 tap + recordatorio push | ≥ 10 partidos organizados |
| P2 Capitán | Falta de "historia" del grupo | Ranking · Badges · MVP por voto | 100% del grupo activo al menos 1 vez |
| P3 Coach | Equipos injustos | Generador balanceado + asistencia | Asistencia > 70% de media |

---

## 4. Embudo y métricas norte

```
     Descubrimiento (1000 visitas landing/semana)
              ↓  10-15%
     Crean o se unen a comunidad (100-150/sem)
              ↓  60% activa 1 partido
     1er partido jugado (60-90/sem)
              ↓  40% siguen a 30 días
     Comunidad activa 30d (24-36/sem)
              ↓  85% retención al día 90
     Comunidad activa 90d (20-30/sem)
```

**Métricas norte (North Star)**:
- **Primaria**: *Partidos jugados por comunidad en las últimas 4 semanas* (≥ 3 = healthy).
- **Secundaria**: *% de jugadores de una comunidad activos en los últimos 14 días* (≥ 60% = healthy).

**KPIs operativos** (tabla en Notion `📊 Métricas semanales`):
- Comunidades nuevas / sem
- Comunidades activas (≥1 partido en 14d)
- Jugadores activos 7d / 30d
- Asistencia media por partido
- Instalaciones PWA / iOS / Android
- Rating medio en stores
- NPS (trimestral)
- Tasa de invitación (jugadores nuevos añadidos por comunidad / mes)

---

## 5. Fases del plan

### Fase 0 · Preparación (semana –2 a 0) — ANTES del lanzamiento

- [ ] Landing `furbito.app` con CTA único: "Crea tu comunidad en 30s".
- [ ] Política de privacidad + Términos publicados (obligatorio para stores y GDPR).
- [ ] Página `/join/:cid?pin=XXXX` funcional (entrada directa por link).
- [ ] Primera tanda de 10-15 comunidades piloto (tu red, tu barrio, tu oficina).
- [ ] Dashboard de métricas funcionando (Posthog o similar).
- [ ] Asset pack para socials: logo, 3 plantillas de reel, 5 plantillas de post, OG-image.
- [ ] Crear cuentas `@furbito.app` en IG, TikTok, X, y canal de WhatsApp.
- [ ] Política de respuesta: ≤ 4h en mensajes de redes durante el primer mes.

### Fase 1 · Lanzamiento suave (semana 1-4) — "Soft launch"

**Objetivo**: pasar de 10 comunidades piloto a **30 comunidades activas**, validar flujo end-to-end con usuarios que no son tus amigos.

**Tácticas**:

1. **Narrativa "estoy construyendo esto"** (build-in-public):
   - 1 reel/día en IG mostrando feature en vivo (no polish, deliberadamente casero).
   - 1 tweet-hilo/semana en X tipo "así construí X en 1 semana".
   - 1 post largo en Reddit (r/Futbol_ES, r/EspanaYFutbol, r/desarrolloapps si aplica) — narrativa personal, no venta.
2. **Outreach manual a grupos conocidos** (1 hora/día):
   - WhatsApp directo al capitán de cada grupo de fútbol que conozcas. Mensaje: *"Oye, acabo de montar una app para nuestro grupo de fútbol. ¿Me ayudas a probarla? Tardas 30s, os genero el PIN."*
   - 20 conversaciones directas → 10 comunidades nuevas.
3. **Partners locales**:
   - Pistas de fútbol 7 de tu ciudad → preguntar si pueden poner un QR en el mostrador ("gestiona tu grupo con FURBITO").
   - Tiendas de material deportivo de barrio.
4. **Feedback loop diario**:
   - Botón "¿qué cambiarías?" in-app.
   - Responder 100% en ≤ 24h.

**KPI**: 30 comunidades con ≥ 1 partido jugado al final de la semana 4.

### Fase 2 · Lanzamiento público (semana 5-8) — "Hard launch"

**Objetivo**: 100 comunidades activas. Lanzamiento coordinado en 3 canales el mismo día.

**El "day 0"**:

- **Product Hunt**: submit un martes/miércoles. Narrativa: *"I built the app I wished existed for my Sunday league."*
  - Hacer ladrido previo en X / IG el día anterior.
  - Tener ≥ 50 hunters/supporters preavisados.
- **Reddit r/futbol** (con permiso de mods): post-caso de uso.
- **TikTok / IG Reels** en ráfaga (5 pieces en 3 días):
  - "POV: tu grupo de fútbol se organiza solo" (before/after WhatsApp → FURBITO)
  - "Generador de equipos justos en 3 segundos" (demo velocidad)
  - "MVP votado por el grupo — la reacción del ganador"
  - "Cómo pasé de Excel a esto" (storytelling)
  - "Ranking tipo Comunio para tu grupo de fútbol amateur"

**Prensa local** (bajo esfuerzo, alto retorno emocional):
- Nota de prensa 1 página a medios locales deportivos / tecnología.
- 3-4 podcasts de fútbol amateur / tech pequeños → pedir 15 min como invitado.

**Referral loop in-app**:
- Al crear partido: "Compartir con el grupo" → genera link con PIN incluido.
- Al ganar un badge: "Presume de tu badge" → genera imagen para stories IG.
- Al ganar MVP: push a la comunidad → "🏆 Juan ha sido elegido MVP" (presión social saludable).

### Fase 3 · Crecimiento sostenido (semana 9-16+)

**Objetivo**: 300 comunidades activas, tasa de crecimiento orgánico ≥ 20%/mes.

**Tácticas**:

1. **Contenido evergreen**:
   - **Blog** (SEO largo plazo) con artículos tipo:
     - "Cómo organizar un partido de fútbol 7 sin volverte loco"
     - "Generador de equipos equilibrados: el método que funciona"
     - "Liga amateur: cómo montar un sistema de puntos estilo Comunio"
   - **YouTube Shorts** replicando los reels.
2. **ASO iOS + Google Play** (solo una vez lanzada la app nativa):
   - Keywords objetivo: "partido fútbol", "liga amateur", "grupo fútbol 7", "pachanga app", "generador equipos fútbol".
   - Screenshots con overlay de titular (no solo pantallazos).
3. **Creadores medianos de fútbol amateur** (IG/TikTok 10k-100k):
   - Contactar a 30, pedir 3 que prueben la app con sus seguidores.
   - Código de comunidad personalizada (ej. `PIN: SUTANO`) → seguir tracción.
4. **Partnerships institucionales** (opcional, depende de tracción):
   - Federaciones de fútbol aficionado a nivel local/regional.
   - Clubes modestos que no se pueden permitir software de gestión.
5. **Retención**:
   - Recordatorio push 24h antes del partido.
   - Recap semanal por email (opcional): "esta semana tu comunidad jugó X partidos, Y es el nuevo líder".
   - Recompensa sorpresa: badges limitados por temporada ("Campeón de verano 2026").

---

## 6. Canales — priorización y tratamiento

### 6.1 WhatsApp (canal #1 para P1 y P3)

- No es un canal de pauta — es el canal de **boca-oreja**. El objetivo es que FURBITO **se propague dentro de WhatsApp**, no que compitas con WhatsApp.
- Tácticas:
  - Cada comunidad tiene un link corto `furbito.app/join/:cid?pin=XXXX` → se pega al grupo de WA y en 30s todos dentro.
  - Imagen compartible del resultado después de cada partido (con los puntos y el MVP) — diseñada para que dé ganas de reenviarla.
  - Plantilla de mensaje sugerida: *"🏆 MVP del viernes: @Juan · Marcó 3 y asistió 1. Total 9 pts. Resto del ranking en FURBITO 👉 link"*

### 6.2 Instagram (canal #1 de awareness)

- **Tono**: cercano, humor de grupo de fútbol amateur, NO aspiracional tipo Nike.
- **Cadencia**: 3 reels/sem + 2 posts/sem + 5 stories/sem.
- **Formatos que funcionan** (probados con apps similares):
  - **Demo de 8-12s** con texto grande en pantalla (feature + problema que resuelve)
  - **Before/after** (Excel de WhatsApp vs FURBITO)
  - **POV reels** ("POV: has organizado 47 pachangas y ahora descubres esto")
  - **Memes de fútbol amateur** con twist hacia FURBITO (bajo riesgo, alto engagement)

### 6.3 TikTok

- Mismo contenido que Reels, **reformateado para TikTok** (hook en los primeros 1.2s, sin logo hasta el 3er segundo).
- Posicionamiento: "el tipo que hizo una app para su grupo de fútbol" → más personal que "empresa".

### 6.4 Reddit

- r/Futbol, r/EspanaYFutbol, r/LigasAmateur, r/futbolamateur.
- **Estilo**: no marketing. Post de primera persona, valor real (guía, estudio, anécdota). El producto se menciona al final.
- Ejemplo de post: *"Llevo 5 años llevando el Excel del grupo de fútbol. Este año monté una app. Comparto lo que aprendí."* + screenshots reales.

### 6.5 Email (solo para los que ya están dentro)

- No compras listas ni haces cold.
- Usos: welcome email, recap semanal opcional, actualización de features.
- Herramienta: Resend o Brevo (free tier suficiente al principio).

### 6.6 Paid (opcional, solo con señal de PMF)

- **NO** hacer paid antes de tener **al menos 50 comunidades orgánicas activas**. Gastarás dinero optimizando un funnel que aún no converte.
- Cuando llegue el momento:
  - Meta Ads (Instagram stories) con creatives ya validados orgánicamente (los reels con mejor performance).
  - Presupuesto inicial 300-500€/mes.
  - KPI: CPI < 0.80€, CAC < 2€ por comunidad nueva.

---

## 7. Calendario de contenido — primer mes

(Es una plantilla — se traslada a `📈 MARKETING / 📅 Content Calendar` en Notion.)

### Semana 1 — "Estoy construyendo esto"

| Día | Canal | Pieza |
|-----|-------|-------|
| Lun | IG Reel | "El grupo de WhatsApp que se convirtió en app" (storytelling 15s) |
| Mar | Twitter/X hilo | "Por qué construí FURBITO — lecciones" (8 tweets) |
| Mié | IG Post | Screenshot del dashboard de admin + caption 80 palabras |
| Jue | TikTok | "POV: eres el capitán de tu grupo de fútbol" |
| Vie | IG Story poll | "¿Cómo organizáis vuestros partidos? WhatsApp / Excel / App" |
| Sáb | IG Reel | Resultado real de un partido (con permiso): "así quedó el del sábado" |

### Semana 2 — "El problema"

Foco en identificar el problema + empatizar con el organizador cansado.

- Reel "3 cosas que te han pasado en el grupo de fútbol" (humor relatable)
- Carrusel "La hoja de Excel que todos hemos tenido"
- Short "Antes / después de FURBITO"

### Semana 3 — "La solución en detalle"

Demos feature-by-feature.

- Reel "Generador de equipos en 3s"
- Reel "Puntos Comunio para tu grupo"
- Reel "Ranking + MVP votado"
- Carrusel "5 badges que tu grupo va a querer"

### Semana 4 — "Prueba social"

Showcase de comunidades reales (con permiso).

- Reel con capitán de comunidad piloto ("llevamos 6 partidos, esto es lo que ha cambiado")
- Testimonial en stories
- Metric post: "X comunidades, Y partidos, Z MVPs en el primer mes"

---

## 8. Plan específico para el lanzamiento de la app nativa

La app nativa llega **después** del soft launch (idealmente en semana 8-12). Es una palanca de marketing por sí misma.

### 8.1 Momento del lanzamiento nativo

Aprovechar el lanzamiento para **rehacer awareness**:

- Campaña "FURBITO ya está en tu móvil" → 1 semana de blasting coordinado.
- Feature principal a destacar: **push notifications**. Es lo que la PWA no hacía bien y resuelve un dolor real (avisar al grupo).
- Secondary: biometría (entras más rápido), haptics (feedback al ganar MVP), compartir imagen de resultado (viralidad).

### 8.2 ASO (App Store Optimization)

**Apple App Store**:

- **Nombre**: `FURBITO: liga de tu grupo de fútbol`
- **Subtítulo**: `Partidos, equipos, MVP y puntos`
- **Keywords** (100 chars): `fútbol,partido,grupo,pachanga,liga amateur,equipos,mvp,gestor,fútbol 7,futbol`
- **Descripción** (primeros 300 chars — lo que se ve sin expandir):
  > *La app que organiza tu partido del jueves. Crea tu comunidad en 30s, comparte el PIN con tu grupo y listo: confirmas asistencia en un tap, genera equipos justos, vota al MVP y construye el ranking de tu liga amateur. Sin email, sin contraseñas.*
- **Screenshots** (los 5 primeros pesan):
  1. Home con partido próximo y confirmaciones en vivo.
  2. Ranking con podio + tab Puntos.
  3. Detalle de partido con MVP y puntos por jugador.
  4. Perfil con skill bars y evolución.
  5. Generador de equipos (animación de balanceo).

**Google Play**:

- Mismo nombre. Descripción corta (80 chars): *"Organiza tu grupo de fútbol: partidos, equipos justos, puntos y MVP votado"*
- Feature graphic con tagline grande.

### 8.3 Lanzamiento en Product Hunt

- Día: martes a las 00:01 PST (9:01 CET).
- Tagline: *"The app your Sunday league group has been waiting for."*
- Media: 1 GIF corto con la feature killer + 5 screenshots.
- Maker comment: narrativa personal ("I was tired of WhatsApp chaos so I built this…").
- Pre-hunters: 30 amigos avisados la tarde anterior.

---

## 9. Presupuesto

Todo el plan está diseñado para **bajo presupuesto** durante los primeros 90 días.

| Línea | EUR/mes (fase 1-2) | EUR/mes (fase 3+) |
|-------|-------------------:|------------------:|
| Supabase Pro (cuando supere free tier) | 0-25 | 25 |
| Vercel Pro | 0-20 | 20 |
| Dominio | 1 | 1 |
| Apple Developer | 99/año → 8/mes | 8 |
| Google Play Console | 25 único | 0 |
| Resend / Brevo | 0 | 10 |
| Posthog cloud | 0 (free tier) | 0-30 |
| Canva Pro (plantillas) | 12 | 12 |
| Paid ads (opcional) | 0 | 300-500 |
| Herramientas de edición | 0-15 | 15 |
| **Total** | **50-80 €/mes** | **400-620 €/mes** |

---

## 10. Riesgos del plan y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| No consigues las primeras 10 comunidades piloto | Media | Alto | Dedicar las primeras 2 semanas *solo* a outreach manual |
| App nativa se retrasa a v3 | Alta | Medio | Comunicar PWA como producto válido durante el interino; CTAs "instalar PWA" en IG |
| Product Hunt flopea | Media | Bajo | PH no es la única tracción; boca-oreja es el canal real |
| Alguien copia el producto | Baja | Medio | Ventaja = comunidad y velocidad de iteración, no moat técnico |
| Cloneas un bot dañino / spam en comunidades | Media | Alto | Moderación admin + flag de "comunidad sospechosa" + rate limiting |
| Apple rechaza la app | Media | Alto | Revisar guidelines antes de submit; tener política de privacidad y flujo de borrado de cuenta listo |
| Burnout del solo-founder | Alta | Alto | Cadencia semanal fija (§11); día off los domingos sin excepción |

---

## 11. Cadencia operativa (lo que haces cada día/semana/mes)

### Diario (30-60 min)

- Responder todos los mensajes en ≤ 4h (IG, WA, email, in-app).
- 1 pieza de contenido publicada (puede ser una story, no siempre un reel).
- Revisar métricas del día (Posthog / dashboard).
- 15 min de outreach directo (WhatsApp a 5-10 personas/día durante soft launch).

### Semanal (Lunes, 90 min)

- Rellenar `📊 Métricas semanales` en Notion.
- Revisar campañas live → pausar las que no van, doblar las que sí.
- Plan de contenido de la semana (5-7 piezas, publicadas via scheduler).
- Leer todo el feedback entrante sin filtrar.
- 1 mejora de producto basada en feedback (aunque sea pequeña).

### Mensual (Primer lunes del mes, 3h)

- Retrospectiva: qué funcionó, qué no, qué se intentó.
- Ajustar personas y copy según lo aprendido.
- Revisar roadmap: mover features según impacto real observado.
- Publicar update pública (IG carrusel "FURBITO en mayo: X comunidades, Y mejoras").

### Trimestral

- NPS entre todos los admins de comunidades (encuesta in-app de 1 pregunta + opcional texto).
- Decisión estratégica: ¿vamos a por paid? ¿vamos a por internacional? ¿vamos a por monetización?

---

## 12. Monetización — NO es prioridad los primeros 90 días

Mencionarlo aquí para que quede explícito: **el plan no monetiza en T+90**. La prioridad absoluta es tracción y retención.

Hipótesis a validar más adelante (Q3-Q4):

- **FURBITO Pro** para admins: 2-3€/mes por comunidad con extras (más partidos/mes, torneos, estadísticas avanzadas, avatar personalizado, sin límite de jugadores).
- **Patrocinios locales**: pistas de fútbol 7 o tiendas pagan por aparecer como "pista recomendada" de una comunidad.
- **Marketplace de material deportivo** (largo plazo).

No gastar energía en esto antes de tener 200+ comunidades activas.

---

## 13. Checklist go/no-go del lanzamiento público (fase 2)

Antes de activar el Product Hunt + Reddit + blast, verificar:

- [ ] 30 comunidades activas con ≥ 2 partidos jugados cada una.
- [ ] Tasa de retención D30 ≥ 40%.
- [ ] ≤ 3 bugs abiertos S0/S1.
- [ ] Landing con política de privacidad + términos live.
- [ ] 10+ testimonios en stories / screenshot permiso explícito.
- [ ] Script de 5 reels preparados para blasting semana del lanzamiento.
- [ ] 30 pre-hunters de Product Hunt confirmados.
- [ ] App nativa al menos en TestFlight / Internal Testing (si ya entramos en fase 3).

---

## 14. Checklist go/no-go para launch de app nativa

- [ ] Paridad de pantallas en `📱 NATIVE APP / 🎨 Paridad`: todas en estado `Parity ✅`.
- [ ] Push notifications funcionando end-to-end con usuarios reales (mínimo 10 ejecuciones verificadas).
- [ ] Crashes bloqueantes = 0 en los últimos 7 días de beta.
- [ ] Política de privacidad publicada en `furbito.app/privacidad`.
- [ ] Flujo de borrado de cuenta (requisito Apple).
- [ ] Icono + screenshots + descripción + keywords para ambos stores.
- [ ] Universal links `.well-known/*` en la web — funcionan desde links compartidos por WA.

---

> **Documentos relacionados**:
> - [NOTION_RECONFIG.md](./NOTION_RECONFIG.md) — estructura de Notion donde vive la ejecución de este plan
> - [UI_AUDIT_PANTALLAS.md](./UI_AUDIT_PANTALLAS.md) — auditoría UI con mejoras que afectan a conversión/retención
> - [GUIA_MIGRACION_APP_NATIVA.md](./GUIA_MIGRACION_APP_NATIVA.md) — guía técnica del lanzamiento nativo
