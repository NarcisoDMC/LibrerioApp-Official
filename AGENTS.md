# AGENTS.md — LibrerioApp-Official

Guía de contexto para agentes de IA y desarrollo continuo de **Librerio**, una
plataforma libre de libros: buscar recomendaciones, autores y géneros, gestionar
una biblioteca personal y compartir lecturas en comunidad.

> Reglas específicas del frontend (indentación, iconos de lucide, docs de Next)
> viven en [`frontend/AGENTS.md`](frontend/AGENTS.md) y también aplican.

---

## 1. Arquitectura

Dos aplicaciones en un solo monorepo (sin workspaces compartidos):

```
├── backend/   → API REST en Express (TypeScript, ESM) + Drizzle + Postgres
└── frontend/  → SPA/SSR en Next.js 16 (App Router) que consume esa API
```

- **Backend** :3001 — Node + Express 5 + TypeScript estricto (ESM, imports con `.js`)
- **Frontend** :3000 — Next.js 16.2.12, React 19, Tailwind 4, `motion`, `swiper`, iconos de `lucide-react`
- **Base de datos** — PostgreSQL dev en Podman (`librerio-pg`), migraciones con Drizzle Kit
- **Catálogo** — proxy a la **Open Library API** (búsquedas, ediciones, autores, temas); el backend resuelve y normaliza los metadatos *server-side*
- **Git** — solo rama `main`; historial corto con commits descriptivos en español

---

## 2. Backend (`backend/`)

### 2.1 Stack y estructura

```
src/
├── config/env.ts        → zod env (PORT, CORS_ORIGIN, OL_CONTACT_EMAIL, DATABASE_URL, JWT_*, DEEPSEEK_API_KEY)
├── server.ts            → createApp(): helmet, cors, json(100kb), rutas, notFound, errorHandler
├── models/
│   ├── db/              → client.ts (drizzle), schema.ts, repositories/*.repo.ts
│   └── openLibrary/     → olClient, ol-types, mappers (book/author/subject), helpers
├── services/            → lógica de negocio (auth, search, library, community)
├── controllers/         → schemas zod + controladores Express
├── routes/              → routers (auth, catalog, community, health, library)
├── middleware/          → auth, errorHandler, notFound, rateLimit, requestLogger, validate
├── types/               → DTOs públicos (Book, BookDetail, Author, SearchResult…)
└── utils/               → api-error.ts, tokens.ts
```

`api/index.ts` + `vercel.json` = entrada serverless para desplegar en Vercel.

### 2.2 Patrones obligatorios

- **Capas**: `routes` (solo montar + validar) → `controllers` (zod + `handle()`) → `services` (negocio, arroja `ApiError`) → `repositories` (SQL con Drizzle)
- **Validación zod** en `controllers/*.ts` (schemas exportados) + middleware `validate.ts` (`validateBody/Params/Query` → `getValid(res, "validBody")`). El controlador NUNCA accede a `req.body` directo
- **Errores**: `ApiError(status, message, details?)`; `errorHandler` responde `{ error, details? }`. Nunca filtres datos sensibles
- **Anti-IDOR**: toda query con scope de usuario lleva `userId` en el `WHERE` (repo), el id sale del token firmado (`requireAuth`), nunca del body → los ids ajenos responden **404**
- **Metadatos de libros**: el cliente nunca aporta título/autor/portada; se resuelven server-side con `searchService.search({ q: "key:/works/{olid}" })` o `isbn:{isbn}`
- **Autenticación**: access JWT (corto) + refresh JWT (hash en `sessions`, rotación al refrescar); `requireAuth` asigna `req.user = { id }` y `optionalAuth` (rutas públicas que enriquecen la respuesta, p. ej. `likedByMe`) asigna `req.user` solo si el Bearer es válido
- **Rate limit** (`middleware/rateLimit.ts`): `authLimiter` en login/register (anti fuerza bruta) y `catalogLimiter` en todo el catálogo (protege el cupo de Open Library)

### 2.3 API publicada (resumen)

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/api/health` | – | health check |
| GET | `/api/books/search?q=&page=&limit=&sort=…` | – | paginado, `SearchResult` |
| GET | `/api/books/category/:category?maxResults=` | – | `novedades` \| `fantasia` \| `terror` |
| GET | `/api/books/isbn/:isbn` | – | detalle por ISBN |
| GET | `/api/books/:olid` | – | detalle por OLID (`/^OL\d+W$/`) |
| GET | `/api/authors/:olid` · `/api/authors/:olid/books` | – | perfil y obras |
| GET | `/api/subjects/:name` | – | libros por tema |
| GET | `/api/trending?scope=daily|weekly|monthly` | – | tendencias |
| POST | `/api/auth/register` `{email,password,name}` | – | → `{user, accessToken, refreshToken}` |
| POST | `/api/auth/login` `{email,password}` | – | ídem; 401 credenciales |
| POST | `/api/auth/refresh` `{refreshToken}` | – | rota y devuelve sesión nueva |
| POST | `/api/auth/logout` `{refreshToken}` | – | revoca la sesión (204) |
| GET | `/api/auth/me` | Bearer | usuario actual (`SafeUser`) |
| GET | `/api/library?status=` | Bearer | lista con filtro opcional |
| POST | `/api/library` `{olid}` **o** `{isbn}`, `status?` | Bearer | 409 duplicado, 400 ambos/ninguno |
| PATCH | `/api/library/:id` `{status?,userRating?,notes?}` | Bearer | 400 si vacío |
| DELETE | `/api/library/:id` | Bearer | 204; repetido → 404 |
| GET | `/api/community/posts?page=&limit=&bookOlid=` | opcional (Bearer) | feed público paginado con conteos y `likedByMe` si hay sesión |
| GET | `/api/community/posts/:id` | opcional (Bearer) | detalle + comentarios + `likedByMe` si hay sesión |
| POST | `/api/community/posts` `{title,content,bookOlid?}` | Bearer | 400 validaciones |
| POST | `/api/community/posts/:id/comments` `{content}` | Bearer | 404 post inexistente |
| POST | `/api/community/posts/:id/like` | Bearer | toggle → `{liked}` |

Formato de error: `{ "error": "mensaje", "details": [...]? }` con el código HTTP correspondiente.

### 2.4 Base de datos (Drizzle + Postgres)

Tablas en `src/models/db/schema.ts`:

- `users` (id uuid pk, email único, passwordHash, name)
- `sessions` (userId FK cascade, refreshTokenHash único, expiresAt, revokedAt)
- `library_books` (userId FK cascade, olid, isbn, título/autor/portada cacheados, `status` enum `por-leer|leyendo|leido`, userRating 1-5, notes; únicos `(userId, olid)` y `(userId, isbn)`)
- `posts` (userId FK cascade, bookOlid opcional, title ≤100, content ≤5000)
- `comments` (postId FK cascade, userId FK cascade, content ≤1000)
- `post_likes` (PK compuesta postId+userId, FK cascade)

Migraciones: `drizzle/0000_….sql` … `0002_….sql` (generadas con `pnpm db:generate`, aplicadas con `pnpm db:migrate`).

### 2.5 Comandos del backend

```bash
pnpm dev        # tsx watch src/server.ts (arranca en :3001)
pnpm build      # tsc → dist/
pnpm start      # node dist/src/server.js (producción local)
pnpm lint       # eslint .
pnpm typecheck  # tsc --noEmit
pnpm db:generate / pnpm db:migrate
```

Postgres dev local (Podman): contenedor `librerio-pg`. Si no está arriba: `podman start librerio-pg`.

### 2.6 Variables de entorno (`backend/.env`, ver `.env.example`)

`PORT`, `CORS_ORIGIN`, `OL_CONTACT_EMAIL` (requisito de Open Library para subir su rate limit), `DATABASE_URL` (Postgres), `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (≥32 chars, `openssl rand -hex 32`), `DEEPSEEK_API_KEY` (opcional, para el Bibliotecario IA). **Nunca comitear `.env`.**

---

## 3. Frontend (`frontend/`)

### 3.1 Convenciones (además de `frontend/AGENTS.md`)

- **Next 16**: `params`/`searchParams` son **async** (`const { olid } = await params`); `middleware` se renombró a `proxy`. Documentación real embebida en `node_modules/next/dist/docs/`
- **4 espacios de indentación**; comentarios en español con separadores `── … ──`; solo iconos de `lucide-react`; las páginas existentes usan la paleta violeta (`#8553d1`, `#4a348c`, gradientes `#3d5bcf→#8553d1→#c765dc`)
- Regla de lint estricta `react-hooks/set-state-in-effect`: no llamar `setState` síncrono dentro de efectos; usar el patrón de **ajuste de estado en render** (comparar `prevKey`) o solo actualizar en callbacks async
- La librería de UI es interna (cards, modales, badges) en `app/ui/Components/`; no hay shadcn ni headless

### 3.2 Librería de cliente (`frontend/lib/`)

- `types.ts` — DTOs espejo del backend (`AuthResponse`, `SafeUser`, `Book`, `BookDetail`, `SearchResult`, `LibraryBook`, `PostView`, `PostDetail`, `CommentView`…)
- `api-client.ts` — **isomórfico (sin `"use client"`)** para poder usarse en server components (p. ej. `/libro/[olid]`). `apiFetch<T>(path, opts)` añade `Authorization: Bearer`; en **401 refresca solo** (single-flight `refreshSession()`) y reintenta una vez; expone `apiGet/apiPost/apiPatch/apiDelete` y guardado/lectura de tokens en `localStorage`
- `auth-context.tsx` — `AuthProvider` (envuelve toda la app en `app/layout.tsx`): hidrata con `GET /me` (y refresh si el access caducó), expone `login/register/logout` y `useAuth()`

### 3.3 Sesión en el cliente

Tokens en `localStorage` (`librerio.access`, `librerio.refresh`) — esquema coherente con el backend (no usa cookies httpOnly). `logout()` revoca en el servidor y limpia local. Páginas privadas redirigen a `/Login` si no hay sesión.

### 3.4 Mapa de páginas y componentes

```
app/
├── layout.tsx                    → AuthProvider global
├── (Auth)/Login, Registro        → formularios reales (errores del API, loading, redirect si sesión)
├── (Inicio)/layout.tsx           → Navbar (con sesión) + NavBottom
├── (Inicio)/page.tsx             → home con BookSections (categorías del catálogo)
├── (Inicio)/busqueda/page.tsx    → resultados de búsqueda paginados (?q=&page=)
├── (Inicio)/libro/[olid]/page.tsx→ detalle SSR (fetch server→backend, notFound() si 404)
├── (Inicio)/Mi-Biblioteca/       → CRUD completo (filtros, modal añadir, edición inline, borrado)
├── (Inicio)/Comunidad/           → feed de posts + modal crear
├── (Inicio)/Comunidad/[id]/      → detalle: comentarios + like + formulario
├── (Inicio)/Bibliotecario/       → UI de chat estática (pendiente de la IA)
└── ui/Components/                → BookCard (clickeable), BookCarrusel, BookSections,
                                     Navbar, Nav-links, NavBottom, TypeWriter,
                                     AddToLibraryButton, LibraryAddModal, PostCard,
                                     PostLikeButton, CreatePostModal, StarRating,
                                     MarkdownContent (sinopsis markdown), BackButton
```

`NEXT_PUBLIC_API_URL` (`.env.local`, no comiteado): apunta al backend (`http://localhost:3001`).

### 3.5 Comandos del frontend

```bash
pnpm dev      # :3000
pnpm build    # next build (valida rutas, SSR y tipos)
pnpm lint     # eslint (regla react-hooks estricta)
```

---

## 4. Cómo ejecutar el proyecto completo (dev)

```bash
podman start librerio-pg              # 1. Postgres
cd backend && pnpm dev                # 2. API en :3001 (requiere backend/.env)
cd frontend && pnpm dev               # 3. SPA en :3000
```

**Cuentas de prueba** en la BD dev: `ana@test.com` / `contraseñaSegura1` y `pedro@test.com` / `contraseñaSegura2`. Para añadir libros desde Mi Biblioteca o crear posts/no comentar sin sesión, el OLID ejemplo es `OL27448W` (El Señor de los Anillos).

**Verificación estándar** tras tocar el backend: `pnpm typecheck && pnpm lint && pnpm build` + recorrido de pruebas con `curl` contra `:3001/api` (auth → biblioteca → comunidad, incluyendo anti-IDOR con un segundo usuario).

---

## 5. Estado del proyecto

### ✔ Implementado (plan original, fases 1-6 + integración del frontend)

1. **Bootstrapping Express/Drizzle** — servidor, env zod, health, logging
2. **Catálogo Open Library** — búsqueda, categorías, detalle, autores, temas, trending; mappers que limpian docs falsos y protegen el cupo con rate limit
3. **Seguridad transversal** — helmet, CORS restringido, rate limits, tokens JWT con rotación, validación zod en todas las entradas
4. **Auth + BD** — register/login/refresh/logout/me, sesiones revocables, migraciones Drizzle
5. **Biblioteca** — CRUD privado por usuario (estado, rating 1-5, notas), metadatos server-side, anti-IDOR, 409 en duplicados
6. **Comunidad** — posts (públicos), comentarios y likes (toggle) con auth; conteos agregados sin N+1
7. **Integración frontend** — sesión global, login/registro reales, explorar (detalle + búsqueda), Mi Biblioteca y Comunidad funcionales (ver sección 3.4)

### ◌ Pendiente / fases futuras

- **Tests automatizados del backend** — la fase "tests" del plan original nunca se materializó: no hay vitest/supertest ni test files. Prioridad para retomar: cubrir auth, catálogo, biblioteca y comunidad con supertest contra la BD dev
- **Bibliotecario IA (Fase 7)** — endpoint de chat con DeepSeek (`DEEPSEEK_API_KEY` ya prevista en env): recomendaciones personalizadas, consultas, dónde comprar/préstamo; conectar la UI de `/Bibliotecario` (input deshabilitado hoy)
- **Login con Google** — botones deshabilitados en Login/Registro ("Próximamente")
- **Deploy** — `vercel.json` + `api/index.ts` ya existen; falta Postgres gestionado (Neon), env vars en Vercel y validación del rate limit in-memory en funciones serverless (no comparte estado entre instancias)
- **README del backend / documentación de API** — no existe

---

## 6. Notas técnicas y gotchas

- Open Library solo indexa el detalle con `q=key:/works/{olid}` (el `key:` desnudo devuelve 0 resultados); `isbn:{isbn}` también resuelve
- El logout no invalida el access JWT en curso (caduca en minutos): es comportamiento JWT estándar, no un bug
- Límites: JSON de entrada 100kb; notas ≤2000, post título ≤100 / contenido ≤5000, comentarios ≤1000 (validados por zod)
- La portada responde `null` si OL no la tiene: los componentes muestran fallback con gradiente
- Al arrancar el backend de nuevo no hace falta re-migrar: `db:migrate` solo aplica migraciones nuevas (drizzle `meta/` guarda el estado)