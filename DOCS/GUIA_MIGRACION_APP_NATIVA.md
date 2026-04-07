# FURBITO — Guía Completa de Migración a App Nativa
> Estrategia, tutoriales y código para llevar FURBITO a iOS App Store y Google Play
> manteniendo la web en funcionamiento (modelo Mister/Sofascore)

---

## Índice

1. [Estrategia General: Modelo Web + Nativa](#1-estrategia-general-modelo-web--nativa)
2. [Elección de Tecnología: React Native + Expo](#2-elección-de-tecnología-react-native--expo)
3. [Setup del Entorno de Desarrollo](#3-setup-del-entorno-de-desarrollo)
4. [Estructura del Nuevo Proyecto](#4-estructura-del-nuevo-proyecto)
5. [Fase 1 — Migración del Core](#5-fase-1--migración-del-core)
6. [Fase 2 — Pantallas y Navegación](#6-fase-2--pantallas-y-navegación)
7. [Fase 3 — Supabase en React Native](#7-fase-3--supabase-en-react-native)
8. [Fase 4 — Features Nativas Exclusivas](#8-fase-4--features-nativas-exclusivas)
9. [Fase 5 — Testing y Beta](#9-fase-5--testing-y-beta)
10. [Fase 6 — Publicación en App Store y Google Play](#10-fase-6--publicación-en-app-store-y-google-play)
11. [Mantenimiento Dual Web + Nativa](#11-mantenimiento-dual-web--nativa)
12. [Checklist Final](#12-checklist-final)

---

## 1. Estrategia General: Modelo Web + Nativa

### El modelo que seguir: Mister, Sofascore, Fotmob

Estas apps comparten la misma estrategia:

```
┌─────────────────────────────────────────────────┐
│                  MISMO BACKEND                   │
│              Supabase (PostgreSQL)               │
│        Real-time · Auth · Storage · Edge         │
└──────────────┬──────────────────┬───────────────┘
               │                  │
    ┌──────────▼──────┐  ┌────────▼──────────┐
    │   WEB APP       │  │   APP NATIVA      │
    │   Next.js       │  │   React Native    │
    │   furbito.app   │  │   iOS + Android   │
    │   (Vercel)      │  │   (App Stores)    │
    └─────────────────┘  └───────────────────┘
```

**Principios clave:**
- Un solo backend, dos frontends
- Los datos son compartidos: un usuario puede usar web en el PC y la app en el móvil
- La web sigue siendo el canal principal para captación (SEO, links compartidos)
- La app nativa es para engagement y retención (push, biometría, offline)
- Se iteran en paralelo: no hay "migración" que deja la web obsoleta

### Qué mantener de la web actual

| Elemento | ¿Se mantiene? | Nota |
|---------|:-------------:|------|
| Next.js web en Vercel | ✅ Sí | Sigue funcionando igual |
| Supabase backend | ✅ Sí | Compartido con la app nativa |
| Dominio furbito.app | ✅ Sí | Universal Links desde la app |
| `src/types/index.ts` | ✅ Sí | Se copia al proyecto nativo |
| `src/lib/game/*` | ✅ Sí | Lógica pura, copia directa |
| `src/stores/session.ts` | ✅ Parcial | Se adapta con AsyncStorage |
| Componentes UI | ❌ No | Se reescriben en React Native |
| Tailwind CSS | ❌ No | Se usa StyleSheet o NativeWind |
| Next.js routing | ❌ No | Se usa expo-router |

---

## 2. Elección de Tecnología: React Native + Expo

**Veredicto: React Native con Expo (Managed Workflow)**

Por qué es la opción correcta para FURBITO:

| Factor | Decisión |
|--------|----------|
| Ya sabes React/TypeScript | React Native reutiliza ese conocimiento al 100% |
| Claude Code te asiste | RN genera igual de bien que React web |
| No tienes Mac | EAS Build compila iOS en la nube sin Mac |
| Un solo dev | Una codebase para iOS y Android |
| Supabase | SDK oficial 100% compatible con RN |
| Tiempo al mercado | MVP en 3-4 meses (vs 8-12 meses nativo puro) |

### Qué es Expo Managed Workflow

```
Sin Expo:                    Con Expo (Managed):
┌─────────────────┐         ┌─────────────────┐
│ Tu código RN    │         │ Tu código RN    │
│ + configuración │   →     │                 │
│   iOS (Xcode)   │         │ Expo SDK maneja │
│ + configuración │         │ todo lo demás   │
│   Android       │         │ automáticamente │
│ + certificados  │         │                 │
│ + keystore      │         │ EAS Build →     │
│ + provisioning  │         │ builds en nube  │
└─────────────────┘         └─────────────────┘
```

---

## 3. Setup del Entorno de Desarrollo

### 3.1 Prerequisitos

```bash
# Verificar Node.js (necesitas 18+)
node --version

# Instalar Expo CLI globalmente
npm install -g expo-cli eas-cli

# Verificar instalación
expo --version
eas --version
```

### 3.2 Crear la cuenta de Expo

1. Ve a [expo.dev](https://expo.dev) y crea una cuenta gratuita
2. En terminal, haz login:

```bash
eas login
# Te pedirá: email y contraseña
```

### 3.3 Crear el proyecto

```bash
# Crear proyecto con template de tabs (recomendado para FURBITO)
npx create-expo-app furbito-native --template tabs

cd furbito-native

# Instalar dependencias base
npx expo install expo-router expo-constants expo-linking expo-status-bar
npx expo install react-native-safe-area-context react-native-screens
npx expo install @react-native-async-storage/async-storage
```

### 3.4 Configurar app.json

```json
{
  "expo": {
    "name": "FURBITO",
    "slug": "furbito",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0a0a"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.furbito.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0a0a"
      },
      "package": "com.furbito.app",
      "versionCode": 1
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#0a0a0a"
        }
      ],
      "expo-camera",
      "expo-location",
      "expo-local-authentication"
    ],
    "scheme": "furbito",
    "extra": {
      "eas": {
        "projectId": "TU_PROJECT_ID_DE_EXPO"
      }
    }
  }
}
```

### 3.5 Variables de entorno

Crea `.env` en la raíz del proyecto nativo:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

> En React Native con Expo, las variables de entorno que empiezan con `EXPO_PUBLIC_` son accesibles desde el cliente.

### 3.6 Probar que funciona

```bash
# Modo desarrollo (escaneas el QR con Expo Go en tu móvil)
npx expo start

# Para Android (con Android Studio instalado)
npx expo start --android

# Para iOS (solo en Mac)
npx expo start --ios
```

---

## 4. Estructura del Nuevo Proyecto

```
furbito-native/
├── app/                          # expo-router (equivale a src/app en Next.js)
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Pantalla de login
│   ├── (tabs)/                   # Tab navigator
│   │   ├── _layout.tsx           # Configuración de tabs
│   │   ├── index.tsx             # Home / Feed
│   │   ├── partidos.tsx          # Lista de partidos
│   │   ├── jugadores.tsx         # Lista de jugadores
│   │   ├── ranking.tsx           # Rankings
│   │   └── perfil.tsx            # Perfil del jugador
│   ├── partido/[eid].tsx         # Detalle de partido
│   ├── jugador/[pid].tsx         # Perfil de jugador
│   ├── partido/nuevo.tsx         # Crear partido
│   └── pistas.tsx                # Mapa de pistas
│
├── src/                          # Código compartido / lógica
│   ├── types/
│   │   └── index.ts              # ← COPIA DIRECTA de web
│   ├── lib/
│   │   ├── game/
│   │   │   ├── badges.ts         # ← COPIA DIRECTA de web
│   │   │   ├── levels.ts         # ← COPIA DIRECTA de web
│   │   │   ├── scoring.ts        # ← COPIA DIRECTA de web
│   │   │   └── teams.ts          # ← COPIA DIRECTA de web
│   │   ├── supabase/
│   │   │   └── client.ts         # Adaptado para React Native
│   │   └── utils.ts              # ← Mayormente igual
│   ├── hooks/                    # Adaptados de web (misma lógica)
│   │   ├── useCommunity.ts
│   │   ├── useEvents.ts
│   │   ├── usePlayers.ts
│   │   ├── usePistas.ts
│   │   └── useVotes.ts
│   ├── stores/
│   │   └── session.ts            # Zustand con AsyncStorage
│   └── components/
│       ├── ui/                   # Componentes base nativos
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Input.tsx
│       │   ├── Modal.tsx
│       │   └── Badge.tsx
│       ├── events/
│       ├── players/
│       └── ranking/
│
├── assets/                       # Imágenes, fuentes, animaciones
├── app.json                      # Configuración Expo
├── eas.json                      # Configuración de builds
└── package.json
```

---

## 5. Fase 1 — Migración del Core

### 5.1 Copiar tipos y lógica de juego (sin cambios)

Los siguientes archivos se copian LITERALMENTE desde el proyecto web:

```bash
# Desde la raíz de furbito (web), ejecuta:
cp src/types/index.ts ../furbito-native/src/types/index.ts
cp src/lib/game/badges.ts ../furbito-native/src/lib/game/badges.ts
cp src/lib/game/levels.ts ../furbito-native/src/lib/game/levels.ts
cp src/lib/game/scoring.ts ../furbito-native/src/lib/game/scoring.ts
cp src/lib/game/teams.ts ../furbito-native/src/lib/game/teams.ts
cp src/lib/utils.ts ../furbito-native/src/lib/utils.ts
```

> No se cambia ni una línea. Son funciones puras TypeScript sin dependencias de DOM ni de Next.js.

### 5.2 Configurar Supabase para React Native

Instala las dependencias:

```bash
npx expo install @supabase/supabase-js @supabase/auth-helpers-react
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill
```

Crea `src/lib/supabase/client.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,          // ← Diferencia clave con web (usa localStorage)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,      // ← En mobile no hay URL para detectar
  },
});
```

### 5.3 Adaptar el store de Zustand

Instala:

```bash
npx expo install zustand
```

Crea `src/stores/session.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Misma interfaz que en web
interface SessionState {
  communityId: string | null;
  playerId: string | null;
  role: 'guest' | 'player' | 'admin' | null;
  login: (communityId: string, playerId: string | null, role: 'guest' | 'player' | 'admin') => void;
  logout: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      communityId: null,
      playerId: null,
      role: null,
      login: (communityId, playerId, role) => set({ communityId, playerId, role }),
      logout: () => set({ communityId: null, playerId: null, role: null }),
    }),
    {
      name: 'furbito-session',
      // ← La única diferencia con web: AsyncStorage en vez de localStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 5.4 Componentes UI base en React Native

La diferencia principal: en React Native no hay `div`, `button`, `input`. Se usan `View`, `TouchableOpacity`, `TextInput`.

#### Button.tsx

```typescript
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#3b82f6'} size="small" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: { backgroundColor: '#3b82f6' },
  secondary: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  danger: { backgroundColor: '#ef4444' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#fff' },
  secondaryText: { color: '#94a3b8' },
  dangerText: { color: '#fff' },
  ghostText: { color: '#3b82f6' },
});
```

#### Card.tsx

```typescript
import { View, StyleSheet, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
}

export function Card({ children, padding = 16, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
});
```

#### Input.tsx

```typescript
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#475569"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 16,
    minHeight: 48,
  },
  inputError: { borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 12 },
});
```

### 5.5 Configurar la navegación (expo-router)

`app/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#f8fafc',
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="partido/[eid]" options={{ title: 'Partido' }} />
        <Stack.Screen name="jugador/[pid]" options={{ title: 'Jugador' }} />
      </Stack>
    </>
  );
}
```

`app/(tabs)/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#1e293b',
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#475569',
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#f8fafc',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="partidos"
        options={{
          title: 'Partidos',
          tabBarIcon: ({ color, size }) => <Ionicons name="football" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jugadores"
        options={{
          title: 'Jugadores',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## 6. Fase 2 — Pantallas y Navegación

### 6.1 Pantalla de Login

`app/index.tsx`:

```typescript
import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/src/lib/supabase/client';
import { useSession } from '@/src/stores/session';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';

export default function LoginScreen() {
  const [communityCode, setCommunityCode] = useState('');
  const [pin, setPin] = useState('');
  const [playerCode, setPlayerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useSession();

  async function handleLogin() {
    if (!communityCode || !pin) {
      setError('Introduce el código de comunidad y el PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Buscar la comunidad
      const { data: community, error: commError } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', communityCode.toLowerCase())
        .single();

      if (commError || !community) {
        setError('Comunidad no encontrada');
        return;
      }

      if (community.pin !== pin) {
        setError('PIN incorrecto');
        return;
      }

      // Determinar rol
      let role: 'guest' | 'player' | 'admin' = 'guest';
      let playerId: string | null = null;

      if (playerCode) {
        if (playerCode === community.admin_pin) {
          role = 'admin';
        } else {
          const { data: player } = await supabase
            .from('players')
            .select('id, code')
            .eq('community_id', community.id)
            .eq('code', playerCode.toUpperCase())
            .single();

          if (player) {
            role = 'player';
            playerId = player.id;
          }
        }
      }

      login(community.id, playerId, role);
      router.replace('/(tabs)');
    } catch (e) {
      setError('Error al conectar. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>⚽ FURBITO</Text>
        <Text style={styles.subtitle}>Tu liga de fútbol amateurs</Text>

        <View style={styles.form}>
          <Input
            label="Código de comunidad"
            placeholder="miequipo"
            value={communityCode}
            onChangeText={setCommunityCode}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="PIN de comunidad"
            placeholder="••••"
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />
          <Input
            label="Código de jugador (opcional)"
            placeholder="AB12"
            value={playerCode}
            onChangeText={setPlayerCode}
            autoCapitalize="characters"
            maxLength={4}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Entrar" onPress={handleLogin} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 32 },
  logo: { fontSize: 48, textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 18, textAlign: 'center', marginTop: -20 },
  form: { gap: 16 },
  error: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
});
```

### 6.2 Hook de datos adaptado (useEvents)

La lógica es idéntica a la web. Solo cambia el import del cliente:

`src/hooks/useEvents.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';  // ← Import nativo
import { useSession } from '@/src/stores/session';
import type { Event } from '@/src/types';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { communityId } = useSession();

  async function load() {
    if (!communityId) return;
    setLoading(true);

    const { data } = await supabase
      .from('events')
      .select(`
        *,
        pista:pistas(name, address),
        confirmations(player_id, status)
      `)
      .eq('community_id', communityId)
      .order('date', { ascending: true });

    setEvents(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();

    // Real-time: igual que en web
    const channel = supabase
      .channel(`events:${communityId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `community_id=eq.${communityId}`,
      }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [communityId]);

  return { events, loading, reload: load };
}
```

### 6.3 Lista de partidos con FlatList

`app/(tabs)/partidos.tsx`:

```typescript
import { FlatList, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useEvents } from '@/src/hooks/useEvents';
import { useSession } from '@/src/stores/session';
import { Card } from '@/src/components/ui/Card';

export default function PartidosScreen() {
  const { events, loading, reload } = useEvents();
  const { role } = useSession();

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor="#3b82f6" />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay partidos próximos</Text>
            </View>
          ) : null
        }
        renderItem={({ item: event }) => (
          <TouchableOpacity onPress={() => router.push(`/partido/${event.id}`)}>
            <Card style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.type}>{event.type === 'match' ? '⚽ Partido' : '🏋️ Entreno'}</Text>
                <Text style={[styles.status, event.status === 'open' && styles.statusOpen]}>
                  {event.status === 'open' ? 'Abierto' : 'Cerrado'}
                </Text>
              </View>
              <Text style={styles.date}>
                {new Date(event.date).toLocaleDateString('es-ES', {
                  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </Text>
              {event.pista && (
                <Text style={styles.location}>📍 {event.pista.name}</Text>
              )}
              <Text style={styles.confirmations}>
                {event.confirmations?.filter(c => c.status === 'yes').length ?? 0} confirmados
              </Text>
            </Card>
          </TouchableOpacity>
        )}
      />

      {role === 'admin' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/partido/nuevo')}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  list: { padding: 16, gap: 12 },
  card: { gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  status: { color: '#64748b', fontSize: 12 },
  statusOpen: { color: '#22c55e' },
  date: { color: '#94a3b8', fontSize: 14 },
  location: { color: '#64748b', fontSize: 13 },
  confirmations: { color: '#3b82f6', fontSize: 13, fontWeight: '500' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
```

---

## 7. Fase 3 — Supabase en React Native

### 7.1 Real-time (misma API)

El Supabase Realtime funciona igual en React Native. La suscripción a cambios:

```typescript
// Escuchar cambios en confirmaciones de un evento
const channel = supabase
  .channel(`confirmations:${eventId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'confirmations',
    filter: `event_id=eq.${eventId}`,
  }, (payload) => {
    // Actualizar estado local
    reload();
  })
  .subscribe();

// Limpiar al desmontar el componente
return () => supabase.removeChannel(channel);
```

### 7.2 Supabase Storage para fotos de perfil

```typescript
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/src/lib/supabase/client';

async function uploadAvatar(playerId: string) {
  // 1. Pedir permiso y abrir galería
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Necesitamos permiso para acceder a tus fotos');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],        // Cuadrada para avatar
    quality: 0.7,           // Comprimir para no abusar de Storage
  });

  if (result.canceled) return;

  const photo = result.assets[0];

  // 2. Convertir URI a blob
  const response = await fetch(photo.uri);
  const blob = await response.blob();

  // 3. Subir a Supabase Storage
  const fileName = `avatars/${playerId}.jpg`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

  if (error) throw error;

  // 4. Obtener URL pública
  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

  // 5. Actualizar el jugador en la base de datos
  await supabase
    .from('players')
    .update({ avatar_url: data.publicUrl })
    .eq('id', playerId);
}
```

### 7.3 Modo offline con AsyncStorage cache

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = 'furbito_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // 1. Intentar desde cache
  const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data as T;
    }
  }

  // 2. Verificar conexión
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    // Sin conexión: devolver cache aunque esté expirado
    if (cached) return JSON.parse(cached).data as T;
    throw new Error('Sin conexión y sin datos en cache');
  }

  // 3. Fetch desde Supabase
  const data = await fetcher();

  // 4. Guardar en cache
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
    data, timestamp: Date.now()
  }));

  return data;
}
```

---

## 8. Fase 4 — Features Nativas Exclusivas

### 8.1 Push Notifications con Expo

Esta es la feature más importante. En la PWA web no funcionaban bien en iOS.

#### Instalar:

```bash
npx expo install expo-notifications expo-device
```

#### Hook para push notifications:

`src/hooks/usePushNotifications.ts`:

```typescript
import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/src/lib/supabase/client';
import { useSession } from '@/src/stores/session';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const { playerId } = useSession();

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Usuario ha tocado la notificación
      const data = response.notification.request.content.data;
      // Navegar a la pantalla correspondiente
      if (data?.eventId) {
        // router.push(`/partido/${data.eventId}`);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  async function registerForPushNotifications() {
    if (!Device.isDevice) return; // No funciona en simuladores

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    // Canal para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FURBITO',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Obtener el token de Expo Push
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'TU_EXPO_PROJECT_ID',
    })).data;

    setExpoPushToken(token);

    // Guardar el token en Supabase para que el backend pueda enviar notificaciones
    if (playerId && token) {
      await supabase
        .from('players')
        .update({ push_token: token })
        .eq('id', playerId);
    }
  }

  return { expoPushToken, notification };
}
```

#### Supabase Edge Function para enviar notificaciones:

`supabase/functions/send-push-native/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Expo Push API es gratuita e ilimitada
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  const { tokens, title, body, data } = await req.json();

  const messages = tokens.map((token: string) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    badge: 1,
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### Trigger automático cuando se crea un partido:

Añade un Database Webhook en Supabase:

```sql
-- En Supabase SQL Editor:
-- Crear función que dispara el push cuando se crea un evento
CREATE OR REPLACE FUNCTION notify_new_event()
RETURNS TRIGGER AS $$
DECLARE
  tokens TEXT[];
  community_name TEXT;
BEGIN
  -- Obtener tokens de push de todos los jugadores de la comunidad
  SELECT array_agg(push_token)
  INTO tokens
  FROM players
  WHERE community_id = NEW.community_id
    AND push_token IS NOT NULL;

  -- Obtener nombre de la comunidad
  SELECT name INTO community_name FROM communities WHERE id = NEW.community_id;

  -- Llamar a la Edge Function
  PERFORM net.http_post(
    url := 'https://tu-proyecto.supabase.co/functions/v1/send-push-native',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer TU_SERVICE_KEY"}'::jsonb,
    body := json_build_object(
      'tokens', tokens,
      'title', '⚽ Nuevo partido en ' || community_name,
      'body', 'Hay un nuevo partido el ' || to_char(NEW.date, 'DD/MM a las HH24:MI'),
      'data', json_build_object('eventId', NEW.id)
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
CREATE TRIGGER on_event_created
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION notify_new_event();
```

### 8.2 Autenticación biométrica

```bash
npx expo install expo-local-authentication
```

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function setupBiometrics() {
  // Verificar si el dispositivo tiene biometría disponible
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) return false;

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const hasFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

  return { available: true, hasFaceId };
}

async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Entra a FURBITO',
    fallbackLabel: 'Usar PIN',
    disableDeviceFallback: false,
  });

  return result.success;
}

// Al hacer login con PIN por primera vez, ofrecer activar biometría
async function offerBiometricLogin(sessionData: object) {
  const biometric = await setupBiometrics();
  if (!biometric?.available) return;

  // Guardar los datos de sesión para restaurarlos con biometría
  await AsyncStorage.setItem('biometric_session', JSON.stringify(sessionData));
  await AsyncStorage.setItem('biometric_enabled', 'true');
}

// Al abrir la app, intentar login automático con biometría
async function tryBiometricLogin() {
  const enabled = await AsyncStorage.getItem('biometric_enabled');
  if (enabled !== 'true') return null;

  const authenticated = await authenticateWithBiometrics();
  if (!authenticated) return null;

  const session = await AsyncStorage.getItem('biometric_session');
  return session ? JSON.parse(session) : null;
}
```

### 8.3 Haptic Feedback

```bash
npx expo install expo-haptics
```

```typescript
import * as Haptics from 'expo-haptics';

// En componentes, añadir feedback táctil:

// Al confirmar asistencia
async function confirmAttendance(status: 'yes' | 'no' | 'maybe') {
  await Haptics.notificationAsync(
    status === 'yes'
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Warning
  );
  // ... resto de la lógica
}

// Al desbloquear un badge
async function onBadgeUnlocked() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  // Mostrar animación de badge
}

// Al subir de nivel
async function onLevelUp() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
}

// En botones (impacto ligero al presionar)
<TouchableOpacity
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handlePress();
  }}
>
```

### 8.4 Compartir resultados nativamente

```bash
npx expo install expo-sharing expo-view-shot
```

```typescript
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useRef } from 'react';
import { View } from 'react-native';

function ResultCard({ event }) {
  const cardRef = useRef(null);

  async function shareResult() {
    // Capturar la Card como imagen
    const uri = await captureRef(cardRef, {
      format: 'png',
      quality: 0.9,
    });

    // Compartir con el sistema nativo (WhatsApp, Telegram, etc.)
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: `Resultado: ${event.score_a} - ${event.score_b}`,
    });
  }

  return (
    <View>
      {/* La card que se convertirá en imagen */}
      <View ref={cardRef} style={styles.resultCard}>
        {/* ... contenido de la tarjeta */}
      </View>

      <Button label="Compartir resultado" onPress={shareResult} />
    </View>
  );
}
```

### 8.5 Deep Links para invitaciones

En `app.json` ya configuramos el scheme `furbito`. Ahora:

`src/lib/deeplinks.ts`:

```typescript
import * as Linking from 'expo-linking';

// Crear link de invitación a una comunidad
export function createInviteLink(communityId: string, pin: string): string {
  // Universal Link (si la app está instalada, abre la app; si no, abre la web)
  return `https://furbito.app/join/${communityId}?pin=${pin}`;
}

// Manejar deep link al abrir la app
export function handleDeepLink(url: string) {
  const { path, queryParams } = Linking.parse(url);

  if (path?.startsWith('join/')) {
    const communityId = path.replace('join/', '');
    const pin = queryParams?.pin as string;
    // Pre-rellenar el formulario de login
    return { communityId, pin };
  }

  return null;
}
```

---

## 9. Fase 5 — Testing y Beta

### 9.1 Testing con Expo Go (sin build)

Durante el desarrollo, puedes probar en tu dispositivo real sin hacer builds:

```bash
# Instalar "Expo Go" en tu móvil desde App Store / Google Play
# Luego:
npx expo start

# Escanea el QR con tu móvil
# La app se carga instantáneamente en tu dispositivo real
```

> Limitación: Expo Go no soporta módulos nativos custom (push notifications, biometría). Para probar esos, necesitas un development build.

### 9.2 Development Build (para probar features nativas)

```bash
# Configurar EAS
eas build:configure

# Build de desarrollo para Android (más rápido que iOS)
eas build --profile development --platform android

# Build de desarrollo para iOS
eas build --profile development --platform ios
```

`eas.json` (se genera automáticamente, pero puedes personalizarlo):

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {}
  }
}
```

### 9.3 Beta con TestFlight (iOS)

```bash
# Build de producción para iOS
eas build --profile production --platform ios

# Subir automáticamente a App Store Connect
eas submit --platform ios
```

Luego en App Store Connect:
1. Ve a "TestFlight"
2. Añade testers internos (hasta 25 personas con dispositivos registrados)
3. Luego testers externos (hasta 10.000 personas, requiere revisión de Apple)

### 9.4 Beta con Google Play Internal Testing (Android)

```bash
# Build de producción para Android
eas build --profile production --platform android

# Subir a Google Play
eas submit --platform android
```

En Google Play Console:
1. Ve a "Testing" → "Internal testing"
2. Añade hasta 100 testers por email
3. Se activa en minutos (sin revisión de Google)

### 9.5 OTA Updates (sin pasar por stores)

Una ventaja de Expo: puedes actualizar el código JavaScript sin necesidad de publicar una nueva versión en las stores.

```bash
# Publicar una actualización OTA
eas update --branch production --message "Fix en la pantalla de partidos"
```

Los usuarios recibirán la actualización la próxima vez que abran la app.

> **Límite**: Solo funciona para cambios en JavaScript. Cambios en código nativo (nuevo plugin, cambio en app.json) requieren un nuevo build completo.

---

## 10. Fase 6 — Publicación en App Store y Google Play

### 10.1 Cuentas de developer (hacer antes de empezar)

| Cuenta | Coste | Tiempo de activación | URL |
|--------|-------|---------------------|-----|
| Apple Developer Program | 99 USD/año | 24-48h | developer.apple.com |
| Google Play Console | 25 USD (único) | Inmediato | play.google.com/console |

> **IMPORTANTE**: Crear las cuentas con antelación. Apple puede tardar 24-48h en aprobar la cuenta.

### 10.2 Assets necesarios para los stores

#### App Store (iOS)
| Asset | Tamaño | Notas |
|-------|--------|-------|
| Icono de app | 1024x1024px | Sin esquinas redondeadas (iOS las añade) |
| Screenshots iPhone 6.7" | 1290x2796px | Al menos 3 (máx 10) |
| Screenshots iPhone 6.5" | 1242x2688px | Al menos 3 |
| Screenshots iPad 12.9" | 2048x2732px | Solo si soportas iPad |
| Descripción | Hasta 4.000 chars | En español si es tu mercado principal |
| Keywords | Hasta 100 chars | Separados por coma: fútbol,liga,equipo... |

#### Google Play (Android)
| Asset | Tamaño | Notas |
|-------|--------|-------|
| Icono de alta resolución | 512x512px | PNG con transparencia |
| Feature Graphic | 1024x500px | Banner que aparece en la ficha |
| Screenshots teléfono | Mín 320px, máx 3840px | Al menos 2 (máx 8) |
| Screenshots tablet | Opcional pero recomendado | |
| Descripción corta | 80 chars | Lo primero que ven los usuarios |
| Descripción larga | Hasta 4.000 chars | |

### 10.3 Build de producción y publicación

```bash
# Paso 1: Build de producción para ambas plataformas
eas build --profile production --platform all

# Esto puede tardar 15-30 minutos en los servidores de Expo
# Cuando termine, recibirás links para descargar los archivos

# Paso 2: Publicar en stores (automático con EAS Submit)
eas submit --platform ios --latest
eas submit --platform android --latest
```

### 10.4 Configurar App Store Connect (iOS)

1. Ve a [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Crea una nueva app: "+" → "New App"
3. Rellena:
   - **Name**: FURBITO
   - **Bundle ID**: com.furbito.app
   - **SKU**: furbito-v1
   - **Primary Language**: Español
4. Sube los screenshots
5. Completa la descripción, keywords, URL de soporte
4. En "Privacy" → declara qué datos recoges (nombre, foto, ubicación si la usas)
5. En "Age Rating" → completa el cuestionario (probablemente 4+)
6. Enviar a revisión: "Add to Review" → "Submit for Review"

**Tiempo de revisión**: Habitualmente 24-48 horas. Puede rechazarse si:
- Falta información de privacidad
- Hay bugs evidentes
- Las screenshots no coinciden con la app real
- La descripción es engañosa

### 10.5 Configurar Google Play Console (Android)

1. Ve a [play.google.com/console](https://play.google.com/console)
2. Crea nueva app: "Create app"
3. Sube el AAB (Android App Bundle) que generó EAS
4. Completa el "Store listing": descripción, screenshots, icono, feature graphic
5. Completa las políticas: privacidad, seguridad de datos, contenido
6. Publica en "Production" o empieza con "Internal testing"

**Tiempo de revisión**: Horas a 1 día para la primera publicación. Las siguientes actualizaciones son casi instantáneas si no hay cambios de permisos.

### 10.6 Política de privacidad (OBLIGATORIA)

Apple y Google requieren una URL de política de privacidad. Crea una página en tu web:

```
https://furbito.app/privacidad
```

Debe incluir:
- Qué datos recoges (nombre, foto, ubicación, notificaciones)
- Cómo los usas (gestión de partidos y comunidades)
- Con quién los compartes (Supabase como procesador de datos)
- Cómo el usuario puede eliminar sus datos
- Contacto para ejercer derechos GDPR

---

## 11. Mantenimiento Dual Web + Nativa

### 11.1 Organización del código compartido

Para mantener sincronizados los dos proyectos, crea un monorepo o usa un paquete compartido:

**Opción A: Monorepo con Turborepo (recomendado a largo plazo)**

```
furbito-monorepo/
├── apps/
│   ├── web/          # Next.js (actual)
│   └── native/       # React Native (nuevo)
├── packages/
│   └── shared/       # Código compartido
│       ├── types/
│       ├── game/     # badges, levels, scoring, teams
│       └── utils/
├── turbo.json
└── package.json
```

**Opción B: Copiar archivos manualmente (más simple para empezar)**

Mantén un script que sincroniza los archivos compartidos:

```bash
#!/bin/bash
# sync-shared.sh — ejecutar cuando cambies lógica de juego

SHARED_FILES=(
  "src/types/index.ts"
  "src/lib/game/badges.ts"
  "src/lib/game/levels.ts"
  "src/lib/game/scoring.ts"
  "src/lib/game/teams.ts"
  "src/lib/utils.ts"
)

for file in "${SHARED_FILES[@]}"; do
  cp "FurbitoLabs/$file" "furbito-native/$file"
  echo "Sincronizado: $file"
done
```

### 11.2 Flujo de trabajo diario

```
Cambio en lógica de juego (badges, scoring...):
  → Edita en web (FurbitoLabs/src/lib/game/)
  → Ejecuta sync-shared.sh
  → El cambio está en ambas apps

Cambio en UI web:
  → Edita solo en FurbitoLabs/src/components/
  → No afecta a la app nativa

Cambio en UI nativa:
  → Edita solo en furbito-native/src/components/
  → No afecta a la web

Cambio en backend (Supabase):
  → Aplica la migración SQL en Supabase
  → Actualiza los tipos en AMBOS proyectos
  → Actualiza los hooks en AMBOS proyectos
```

### 11.3 Versioning

Usa semantic versioning y sincroniza las versiones con la web:

| Versión | Cuándo |
|---------|--------|
| Patch (1.0.x) | Bugfixes, sin nuevas features |
| Minor (1.x.0) | Nueva feature, compatible con el backend actual |
| Major (x.0.0) | Breaking change en el backend (nueva migración de BD) |

### 11.4 Universal Links: web y app integradas

Cuando un usuario comparte un enlace de FURBITO, si tiene la app instalada, debe abrirse la app; si no, la web.

**Configuración iOS (Apple App Site Association):**

Crea `public/.well-known/apple-app-site-association` en el proyecto web:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TU_TEAM_ID.com.furbito.app",
        "paths": [
          "/join/*",
          "/*/partidos/*",
          "/*/jugadores/*"
        ]
      }
    ]
  }
}
```

**Configuración Android (assetlinks.json):**

Crea `public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.furbito.app",
      "sha256_cert_fingerprints": ["TU_SHA256_FINGERPRINT"]
    }
  }
]
```

---

## 12. Checklist Final

### Pre-desarrollo
- [ ] Cuenta de Expo creada ([expo.dev](https://expo.dev))
- [ ] Apple Developer Program activado ($99/año)
- [ ] Google Play Console activado ($25)
- [ ] Proyecto creado con `create-expo-app`
- [ ] Variables de entorno configuradas
- [ ] `app.json` con bundle ID correcto

### Core migrado
- [ ] `types/index.ts` copiado
- [ ] `lib/game/*` copiado (badges, levels, scoring, teams)
- [ ] Supabase client configurado con AsyncStorage
- [ ] Zustand store con AsyncStorage
- [ ] Componentes UI base: Button, Card, Input, Modal

### Navegación
- [ ] Tab navigator con 5 tabs
- [ ] Login screen funcional
- [ ] Pantalla de partidos con FlatList
- [ ] Pantalla de jugadores
- [ ] Pantalla de ranking
- [ ] Perfil de jugador

### Features nativas
- [ ] Push notifications (Expo + Supabase trigger)
- [ ] Fotos de perfil (expo-image-picker + Supabase Storage)
- [ ] Haptic feedback en acciones clave
- [ ] Biometría (expo-local-authentication)
- [ ] Compartir resultados (expo-sharing)
- [ ] Deep links configurados
- [ ] Modo offline básico (AsyncStorage cache)

### Testing
- [ ] Probado en dispositivo Android real
- [ ] Probado en dispositivo iOS real (o simulador)
- [ ] Beta enviada a TestFlight
- [ ] Beta enviada a Google Play Internal Testing
- [ ] Feedback recibido y bugs corregidos

### Publicación
- [ ] Icono definitivo (1024x1024 para iOS, 512x512 para Android)
- [ ] Screenshots tomados en dispositivos reales
- [ ] Descripción escrita en español
- [ ] Keywords de ASO definidos
- [ ] Política de privacidad publicada en furbito.app/privacidad
- [ ] Build de producción generado con EAS
- [ ] Subido a App Store Connect
- [ ] Subido a Google Play Console
- [ ] Revisión de Apple aprobada
- [ ] App publicada en ambas stores

---

## Referencias y recursos

| Recurso | URL |
|---------|-----|
| Expo Docs | docs.expo.dev |
| expo-router Docs | expo.github.io/router |
| EAS Build | docs.expo.dev/build |
| Supabase + React Native | supabase.com/docs/guides/getting-started/quickstarts/react-native |
| React Native StyleSheet | reactnative.dev/docs/stylesheet |
| App Store Review Guidelines | developer.apple.com/app-store/review/guidelines |
| Google Play Policies | play.google.com/about/developer-content-policy |
| Expo Notifications | docs.expo.dev/push-notifications/overview |
| NativeWind (Tailwind para RN) | www.nativewind.dev |

---

> **Documentos relacionados:**
> - [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitectura de la web actual
> - [PASO_3_APP_NATIVA.md](./PASO_3_APP_NATIVA.md) — Análisis de opciones tecnológicas
> - [WARROOM_ROADMAP_30D.md](./WARROOM_ROADMAP_30D.md) — Roadmap de la web
