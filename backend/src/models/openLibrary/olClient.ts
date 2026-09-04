import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

const USER_AGENT = `LibrerioApp (${env.OL_CONTACT_EMAIL})`;

type OLCacheEntry = { body: unknown; fetchedAt: number };

const cache = new Map<string, OLCacheEntry>();
const inflight = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const TIMEOUT_MS = 15_000;

function olFetchRaw(path: string): Promise<Response> {
    return fetch(`https://openlibrary.org${path}`, {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
}

export async function olFetch<T>(path: string): Promise<T> {
    const key = path;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.body as T;

    // Deduplicar requests en vuelo: si ya hay un fetch para esta key,
    // reutilizar la misma promesa en vez de lanzar otro HTTP
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;

    const promise = fetchAndCache<T>(key);
    inflight.set(key, promise);
    try {
        return await promise;
    } finally {
        inflight.delete(key);
    }
}

async function fetchAndCache<T>(key: string): Promise<T> {
    // OL es intermitente: un reintento único ante timeouts/errores de red
    let res: Response;
    try {
        res = await olFetchRaw(key);
    } catch {
        try {
            res = await olFetchRaw(key);
        } catch {
            throw new ApiError(502, "El catálogo no respondió, intenta de nuevo");
        }
    }

    if (res.status === 404) throw new ApiError(404, "Recurso no encontrado en el catálogo");
    if (!res.ok) throw new ApiError(502, "El catálogo de OpenLibrary falló");

    const body = (await res.json()) as T;
    cache.set(key, { body, fetchedAt: Date.now() });
    return body;
}