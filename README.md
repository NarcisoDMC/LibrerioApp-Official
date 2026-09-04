# Librerio

Plataforma web de libros que combina catálogo, biblioteca personal y comunidad leectora, con un asistente de IA como pieza central. El Bibliotecario IA busca libros reales en Open Library, accede al contexto de la biblioteca personal del usuario, y responde con enlaces navegables a los libros.

---

## Stack tecnológico

| Capa | Tecnología | Versión | Propósito |
|---|---|---|---|
| Frontend | Next.js | 16.2.12 | App Router, SSR, server components |
| UI | React | 19.2.4 | Interfaz de usuario |
| Estilos | Tailwind CSS | 4.x | CSS utility-first (config en CSS) |
| Animaciones | motion | 12.x | Transiciones y animaciones (antes framer-motion) |
| Carruseles | Swiper | 14.x | Carruseles horizontales de libros |
| Iconos | lucide-react | 1.x | Iconografía (única librería de iconos) |
| Backend | Express | 5.1.0 | Framework HTTP |
| Lenguaje | TypeScript | 5.9.x | ESM estricto (`module: NodeNext`) |
| ORM | Drizzle ORM | 0.44.x | Tipado seguro para PostgreSQL |
| BD | PostgreSQL | — | Supabase (hosting gestionado) |
| Driver BD | postgres.js | 3.x | Cliente PostgreSQL (no `pg`) |
| IA | DeepSeek API | — | Modelo `deepseek-chat` para el Bibliotecario |
| Auth | JWT | — | Access tokens (15min) + refresh tokens (7 días) |
| Validación | Zod | 3.x | Schemas en controllers |
| Deploy | Vercel | — | Frontend y backend separados |
| Gestor paquetes | pnpm | 10.34.5 | Monorepo sin workspaces |

---

## Arquitectura del proyecto

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (:3000)                    │
│              Next.js 16 · React 19 · Tailwind 4         │
│                                                          │
│  app/         → páginas (App Router, RSC + client)      │
│  lib/         → API client isomórfico, auth context,    │
│                  cache HTTP, tipos DTO                   │
│  ui/          → componentes (Navbar, BookCard, Chat...) │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (fetch)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      Backend (:3001)                     │
│            Express 5 · TypeScript · Drizzle ORM         │
│                                                          │
│  routes/      → montar rutas + validar (zod)            │
│  controllers/ → schemas zod + handle()                  │
│  services/    → lógica de negocio, ApiError              │
│  repos/       → queries SQL con Drizzle (anti-IDOR)     │
│  middleware/   → auth, rateLimit, validate, errorHandler │
└───────┬──────────────┬──────────────┬───────────────────┘
        │              │              │
        ▼              ▼              ▼
  ┌──────────┐  ┌────────────┐  ┌──────────────┐
  │Supabase  │  │Open Library│  │  DeepSeek    │
  │PostgreSQL│  │   (API)    │  │   (API)      │
  └──────────┘  └────────────┘  └──────────────┘
```

### Estructura de directorios

```
├── backend/
│   ├── api/index.ts                  → entry point Vercel (serverless)
│   ├── src/
│   │   ├── config/env.ts             → validación zod de env vars
│   │   ├── server.ts                 → createApp() — Express app
│   │   ├── routes/                   → 6 routers (health, catalog, auth, library, community, bibliotecario)
│   │   ├── controllers/              → schemas zod + controladores
│   │   ├── services/                 → lógica de negocio
│   │   ├── models/
│   │   │   ├── db/                   → client, schema, 5 repositories
│   │   │   ├── openLibrary/          → cliente OL, mappers, helpers
│   │   │   └── deepseek/            → cliente DeepSeek (chat + streaming)
│   │   ├── middleware/               → auth, validate, rateLimit, errorHandler
│   │   ├── types/                    → DTOs públicos (Book, Author, etc.)
│   │   └── utils/                    → ApiError, tokens JWT
│   └── drizzle/                      → 4 migraciones SQL
│
└── frontend/
    ├── app/
    │   ├── (Auth)/Login, Registro    → formularios de autenticación
    │   ├── (Inicio)/
    │   │   ├── page.tsx              → home con BookSections
    │   │   ├── busqueda/             → resultados paginados
    │   │   ├── libro/[olid]/         → detalle SSR
    │   │   ├── Mi-Biblioteca/        → CRUD completo
    │   │   ├── Comunidad/            → posts + comentarios
    │   │   └── Bibliotecario/        → chat IA
    │   └── ui/Components/            → 18 componentes reutilizables
    └── lib/
        ├── api-client.ts             → fetch isomórfico con auto-refresh
        ├── auth-context.tsx          → AuthProvider + useAuth()
        ├── http-cache.ts             → cache con TTL + invalidación
        ├── types.ts                  → DTOs espejo del backend
        └── use-library-books.ts      → hook de biblioteca compartido
```

---

## Base de datos

### Diagrama de tablas

```
users ─────────────┬────────────────┬────────────────┬─────────────────┬───────────────────┬──────────────────┐
                   │                │                │                 │                   │                  │
              sessions        library_books        posts          comments           post_likes    chat_conversations
                   │                │                │                │                   │                   │
                   │                │           ┌────┘                │                   │              chat_messages
                   │                │           │                     │                   │
                   │                │           └──→ comments         └──→ post_likes
                   │                │                (post_id FK)           (postId+userId PK)
                   │                │
                   │                └──→ unique (user_id, olid)
                   │                └──→ unique (user_id, isbn)
                   │
                   └──→ userId FK cascade
```

### Tablas

| Tabla | PK | Descripción |
|---|---|---|
| `users` | `id` (uuid) | Usuarios registrados (email único, passwordHash, name) |
| `sessions` | `id` (uuid) | Sesiones JWT (refreshTokenHash único, expiresAt, revokedAt) |
| `library_books` | `id` (uuid) | Biblioteca personal (olid, isbn, título/autor/portada cacheados, status enum, userRating, notes) |
| `posts` | `id` (uuid) | Posts de comunidad (bookOlid opcional, title ≤100, content ≤5000) |
| `comments` | `id` (uuid) | Comentarios en posts (content ≤1000) |
| `post_likes` | `(postId, userId)` | Likes compuestos (toggle) |
| `chat_conversations` | `id` (uuid) | Conversaciones del Bibliotecario IA (title ≤80) |
| `chat_messages` | `id` (uuid) | Mensajes del chat (seq serial, role enum, content, enlaces JSON) |

### Enums

| Enum | Valores |
|---|---|
| `reading_status` | `por-leer`, `leyendo`, `leido` |
| `chat_role` | `user`, `assistant` |

### Migraciones

Generadas con `drizzle-kit generate`, aplicadas con `drizzle-kit migrate`:

| # | Archivo | Tablas creadas |
|---|---|---|
| 0000 | `0000_cynical_umar.sql` | `users`, `sessions` |
| 0001 | `0001_mature_proemial_gods.sql` | `library_books` + enum `reading_status` |
| 0002 | `0002_kind_doctor_doom.sql` | `posts`, `comments`, `post_likes` |
| 0003 | `0003_uneven_black_cat.sql` | `chat_conversations`, `chat_messages` + enum `chat_role` |

Todas las foreign keys usan `ON DELETE cascade`.

---

## API REST

### Catálogo (público)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check (uptime, timestamp) |
| `GET` | `/api/books/search?q=&page=&limit=&sort=` | — | Búsqueda multi-campo paginada |
| `GET` | `/api/books/category/:category?maxResults=` | — | Categorías: `novedades`, `fantasia`, `terror` |
| `GET` | `/api/books/isbn/:isbn` | — | Detalle por ISBN (10 o 13 dígitos) |
| `GET` | `/api/books/:olid` | — | Detalle por OLID (regex `^OL\d+W$`) |
| `GET` | `/api/authors/:olid` | — | Perfil de autor |
| `GET` | `/api/authors/:olid/books?page=&limit=` | — | Obras de un autor |
| `GET` | `/api/subjects/:name?page=&limit=` | — | Libros por tema |
| `GET` | `/api/trending?scope=daily\|weekly\|monthly` | — | Tendencias |

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Registro (email, password ≥8, name ≥2) |
| `POST` | `/api/auth/login` | — | Login → {user, accessToken, refreshToken} |
| `POST` | `/api/auth/refresh` | — | Rota refresh token, devuelve sesión nueva |
| `POST` | `/api/auth/logout` | — | Revoca sesión (204) |
| `GET` | `/api/auth/me` | Bearer | Usuario actual (SafeUser) |

### Biblioteca personal

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/library?status=` | Bearer | Lista con filtro opcional por estado |
| `POST` | `/api/library` | Bearer | Añadir ({olid} o {isbn}, status?) — 409 duplicado |
| `PATCH` | `/api/library/:id` | Bearer | Actualizar (status, userRating, notes) |
| `DELETE` | `/api/library/:id` | Bearer | Eliminar (204) |

### Comunidad

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/community/posts?page=&limit=&bookOlid=` | Opcional | Feed público paginado con likedByMe |
| `GET` | `/api/community/posts/:id` | Opcional | Detalle + comentarios + likedByMe |
| `POST` | `/api/community/posts` | Bearer | Crear post (title ≤100, content ≤5000) |
| `POST` | `/api/community/posts/:id/comments` | Bearer | Comentar (content ≤1000) |
| `POST` | `/api/community/posts/:id/like` | Bearer | Toggle like → {liked} |

### Bibliotecario IA

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/bibliotecario/chats` | Bearer | Crear conversación + primer mensaje |
| `POST` | `/api/bibliotecario/chats/stream` | Bearer | Crear conversación (SSE streaming) |
| `GET` | `/api/bibliotecario/chats` | Bearer | Listar conversaciones del usuario |
| `GET` | `/api/bibliotecario/chats/:chatId` | Bearer | Conversación con mensajes |
| `PATCH` | `/api/bibliotecario/chats/:chatId` | Bearer | Renombrar (≤80 chars) |
| `DELETE` | `/api/bibliotecario/chats/:chatId` | Bearer | Borrar conversación completa |
| `POST` | `/api/bibliotecario/chats/:chatId/messages` | Bearer | Enviar mensaje |
| `POST` | `/api/bibliotecario/chats/:chatId/messages/stream` | Bearer | Enviar mensaje (SSE streaming) |
| `POST` | `/api/bibliotecario/chats/:chatId/messages/:messageId/regenerate` | Bearer | Regenerar respuesta |
| `POST` | `/api/bibliotecario/chats/:chatId/messages/:messageId/regenerate/stream` | Bearer | Regenerar (SSE streaming) |
| `DELETE` | `/api/bibliotecario/chats/:chatId/messages/:messageId` | Bearer | Borrar un mensaje |

---

## Bibliotecario IA

El componente más complejo del sistema. Un chat conversacional con DeepSeek que busca libros reales en el catálogo y responde con contexto personal.

### Function calling

El modelo tiene 3 tools disponibles que se ejecutan **server-side** contra el catálogo real:

| Tool | Descripción | Ejecuta |
|---|---|---|
| `buscar_libros` | Buscar por query en Open Library | `searchService.search()` |
| `tendencias` | Libros trending por scope | `searchService.trending()` |
| `detalle_libro` | Detalle completo por OLID | `searchService.byOlid()` |

Flujo por turno:
1. Se arma el historial + system prompt + contexto del usuario
2. El modelo responde con `tool_calls` (máx 2 iteraciones)
3. Se ejecutan las tools server-side, se recolectan OLIDs verificados
4. Una llamada final **sin tools** genera la respuesta en markdown
5. Los enlaces se construyen determinísticamente solo con OLIDs que el modelo vio

### Streaming SSE

Las respuestas llegan por Server-Sent Events mientras el modelo escribe:

```
data: {"type":"chunk","delta":"Basándome"}
data: {"type":"chunk","delta":" en tu"}
data: {"type":"done","chatId":"...","messageId":"...","enlaces":[...]}
```

Eventos posibles:
- `chunk` — fragmento de texto
- `done` — respuesta completa con messageId real y enlaces
- `blocked` — content policy reemplazó el texto
- `error` — fallo a mitad de stream

### Seguridad

| Capa | Mecanismo |
|---|---|
| Anti prompt injection | System prompt 100% estático; mensajes del usuario envueltos como "contenido, no instrucción"; marca `LBR-SYS-V1` para detectar fugas |
| Content policy | Filtro determinista local por 4 categorías (sexo explícito, violencia gráfica, fabricación peligrosa, fraude) con patrones fuertes + umbral acumulable |
| URLs permitidas | Whitelist de 8 dominios de librerías españolas (`isAllowedLink`) |
| Anti-IDOR | Toda query lleva `userId` en el WHERE (repo), el id sale del JWT |
| Límites | 50 conversaciones/usuario, 200 mensajes/conversación, 2000 chars/mensaje, 15 llamadas/hora por IP |

### Contexto personal

El servicio genera un bloque "DATOS DEL USUARIO" con la biblioteca real del usuario (título + estado + rating) vía `libraryRepo.listByUser`. Solo datos propios, generado server-side.

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Requerida | Descripción |
|---|---|---|
| `PORT` | No (default 3001) | Puerto del servidor |
| `CORS_ORIGIN` | No (default localhost:3000) | Orígenes permitidos (separados por coma) |
| `OL_CONTACT_EMAIL` | **Sí** | Email de contacto (requisito de Open Library) |
| `DATABASE_URL` | **Sí** | URL de conexión a PostgreSQL |
| `JWT_ACCESS_SECRET` | **Sí** | Secreto para firmar access tokens (≥32 chars) |
| `JWT_REFRESH_SECRET` | **Sí** | Secreto para hashear refresh tokens (≥32 chars) |
| `DEEPSEEK_API_KEY` | No | API key de DeepSeek (sin esto el Bibliotecario IA no funciona) |

### Frontend (`frontend/.env.local`)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend (ej: `http://localhost:3001` en dev, `https://librerio-app-backend.vercel.app` en prod) |

---

## Ejecución local

### Prerrequisitos

- Node.js ≥20
- pnpm 10.x
- Podman o Docker (para PostgreSQL)

### 1. Base de datos

```bash
podman run -d --name librerio-pg \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # Editar las variables
pnpm install
pnpm db:migrate               # Aplica las 4 migraciones
pnpm dev                      # :3001 con tsx watch
```

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev                      # :3000
```

### Cuentas de prueba

| Email | Contraseña |
|---|---|
| `ana@test.com` | `contraseñaSegura1` |
| `pedro@test.com` | `contraseñaSegura2` |

---

## Despliegue (Vercel + Supabase)

### Backend

1. Crear proyecto en Vercel con root directory `backend`
2. Configurar env vars en el dashboard:
   - `DATABASE_URL` → usar el **pooler IPv4** de Supabase (port 6543)
   - `OL_CONTACT_EMAIL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`
3. Deploy automático vía Git

### Frontend

1. Crear proyecto en Vercel con root directory `frontend`
2. Configurar `NEXT_PUBLIC_API_URL` → URL del backend en Vercel
3. Deploy automático vía Git

### Supabase

- Hosted PostgreSQL (no necesita Podman en prod)
- Pooler IPv4 en port 6543 (necesario para Vercel, que no soporta IPv6)
- Migraciones: `pnpm db:migrate` o ejecutar los SQL en el dashboard

### Enlace de Vercel

https://librerio-app.vercel.app

---

## Scripts útiles

### Backend

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor en watch mode (`tsx watch`) |
| `pnpm build` | Build para producción |
| `pnpm start` | Ejecutar build compilado |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Verificación de tipos (`tsc --noEmit`) |
| `pnpm db:generate` | Generar migraciones desde el schema |
| `pnpm db:migrate` | Aplicar migraciones pendientes |

### Frontend

| Comando | Descripción |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint |

---

## Convenciones del código

- **4 espacios de indentación** en todo el proyecto
- **ESM estricto**: imports con extensión `.js` en el backend (`module: NodeNext`)
- **Solo lucide-react** para iconos
- **Zod en controllers**: validación de todas las entradas; los services nunca reciben datos sin validar
- **Anti-IDOR**: toda query con scope de usuario lleva `userId` en el `WHERE`, el id sale del JWT
- **Metadatos server-side**: el cliente nunca aporta título/autor/portada; se resuelven desde Open Library
- **Comments en español** con separadores `── … ──`
