// ── Caché HTTP en memoria con TTL + dedupe in-flight + invalidación ────────
// Módulo isomórfico (sin "use client"): comparte estado entre el SSR de Next
// (detalle de libros) y los client components. Evita re-consultar el backend
// al cambiar de pestaña y reduce la presión sobre los rate limits.

interface CacheEntry {
    data: unknown;
    expiresAt: number;
    generation: number;
}

const MAX_ENTRIES = 200;

const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

// Generación: cada invalidación la incrementa; las escrituras viejas que
// lleguen tarde (promesas en vuelo) se descartan al leerse.
let generation = 0;

// ── Suscripción a invalidaciones (para hooks con useSyncExternalStore) ─────
let version = 0;
const listeners = new Set<() => void>();

function notify(): void {
    version += 1;
    for (const listener of listeners) {
        listener();
    }
}

// ── TTL por prefijo de ruta (ms) ────────────────────────────────────────────
// Catálogo: público e inmutable para el usuario → 5 min.
// Biblioteca: por usuario y mutable → 30 s.
// Comunidad: feed con `likedByMe` según sesión → 60 s.
const ROUTE_TTL: { prefix: string; ttlMs: number }[] = [
    { prefix: "/api/library", ttlMs: 30_000 },
    { prefix: "/api/community", ttlMs: 60_000 },
    { prefix: "/api/books", ttlMs: 5 * 60_000 },
    { prefix: "/api/authors", ttlMs: 5 * 60_000 },
    { prefix: "/api/subjects", ttlMs: 5 * 60_000 },
    { prefix: "/api/trending", ttlMs: 5 * 60_000 },
];

export function routeTtlMs(path: string): number {
    for (const rule of ROUTE_TTL) {
        if (path.startsWith(rule.prefix)) return rule.ttlMs;
    }
    return 0; // sin caché (auth, bibliotecario, etc.)
}

// Clave: ruta + query + modo sesión (los datos cambian si hay sesión).
export function cacheKey(path: string, authed: boolean): string {
    return authed ? `${path}|sesion` : `${path}|anon`;
}

export function cacheGet<T>(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now() || entry.generation !== generation) {
        store.delete(key);
        return undefined;
    }
    return entry.data as T;
}

export function cacheSet(key: string, data: unknown, ttlMs: number): void {
    if (ttlMs <= 0) return;
    if (store.size >= MAX_ENTRIES) {
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
    }
    store.set(key, { data, expiresAt: Date.now() + ttlMs, generation });
}

// Dedupe in-flight: peticiones simultáneas por la misma clave comparten un
// único fetch (p. ej. 12 BookCards → 1 sola llamada a /api/library).
export function inflightGet<T>(key: string): Promise<T> | undefined {
    return inflight.get(key) as Promise<T> | undefined;
}

export function inflightSet(key: string, promise: Promise<unknown>): void {
    inflight.set(key, promise);
    void promise.finally(() => {
        inflight.delete(key);
    });
}

// ── Invalidación ────────────────────────────────────────────────────────────
export function clearCache(prefix?: string): void {
    if (prefix === undefined || prefix === "") {
        store.clear();
    } else {
        for (const key of store.keys()) {
            if (key.startsWith(prefix)) store.delete(key);
        }
    }
    generation += 1;
    inflight.clear();
    notify();
}

// ── API para useSyncExternalStore (uso: const v = useSyncExternalStore(...)) ─
export function cacheSubscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function cacheGetVersion(): number {
    return version;
}