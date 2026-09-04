// ── Cliente del API Express: fetch con Bearer, refresh automático y caché ──
// Módulo isomórfico (sin "use client"): sirve en server components
// (catálogo público) y en client components (sesión privada).

import type { ApiErrorBody, AuthResponse } from "./types";
import {
    cacheGet,
    cacheKey,
    cacheSet,
    clearCache,
    inflightGet,
    inflightSet,
    routeTtlMs,
} from "./http-cache";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const ACCESS_KEY = "librerio.access";
const REFRESH_KEY = "librerio.refresh";

export class ApiError extends Error {
    status: number;
    details: unknown;

    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string): void {
    window.localStorage.setItem(ACCESS_KEY, accessToken);
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    // La sesión terminó: los datos por usuario cacheados dejan de ser válidos
    clearCache();
}

// Refresh single-flight: varias peticiones 401 comparten el mismo intento
let refreshPromise: Promise<AuthResponse> | null = null;

export function refreshSession(): Promise<AuthResponse> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return Promise.reject(new ApiError(401, "Sesión expirada"));
    }
    refreshPromise ??= fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
    })
        .then(async (res) => {
            if (!res.ok) throw await toApiError(res);
            const data = (await res.json()) as AuthResponse;
            storeTokens(data.accessToken, data.refreshToken);
            localStorage.setItem("librerio.lastRefresh", String(Date.now()));
            return data;
        })
        .finally(() => {
            refreshPromise = null;
        });
    return refreshPromise;
}

async function toApiError(res: Response): Promise<ApiError> {
    let body: ApiErrorBody | null = null;
    try {
        body = (await res.json()) as ApiErrorBody;
    } catch {
        // respuestas sin JSON (p. ej. 204/502)
    }
    
    return new ApiError(res.status, body?.error ?? `Error ${res.status}`, body?.details);
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
}

// La invalidación es clave por prefijo de ruta afectado; en /api/auth cambia
// la sesión entera y conviene vaciar todo.
function invalidateCaches(path: string): void {
    if (path.startsWith("/api/auth")) {
        clearCache();
    } else {
        clearCache("/api/library");
        clearCache("/api/community");
    }
}

async function doFetch<T>(
    path: string,
    options: ApiFetchOptions = {},
    retried = false,
): Promise<T> {
    const { body, headers, ...rest } = options;

    const res = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...(headers as Record<string, string> | undefined),
            ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    // Token caducado: intentamos refrescar una sola vez y reintentamos
    // && !path.startsWith("/api/auth/") lo eliminamos porque impide refrescar la session cuando el access token expira
    if (res.status === 401 && !retried && getRefreshToken() && path !== "/api/auth/refresh") {

        let refreshed = false;
        for (let attempt = 0; attempt < 2; attempt++){
            try {
                await refreshSession();
                refreshed = true;
                break;
            } catch {
                if (attempt === 0){
                    await new Promise(r => setTimeout(r, 1000)); //agregamos un timeout de 1s antes de hacer el primer intento
                }
            }
        }

        // Solo si el refresh salió, reintentar la petición original
        if (refreshed) {
            return doFetch<T>(path, options, true); 
        }

        clearTokens();
        throw await toApiError(res);
    }

    if (!res.ok) {
        throw await toApiError(res);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return (await res.json()) as T;
}

export async function apiFetch<T>(
    path: string,
    options: ApiFetchOptions = {},
    retried = false,
): Promise<T> {
    const isGet = (options.method ?? "GET") === "GET";
    const ttl = isGet ? routeTtlMs(path) : 0;

    if (ttl > 0) {
        const key = cacheKey(path, !!getAccessToken());
        const cached = cacheGet<T>(key);
        if (cached !== undefined) return cached;
        const pending = inflightGet<T>(key);
        if (pending) return pending;

        const promise = doFetch<T>(path, options, retried).then((data) => {
            cacheSet(key, data, ttl);
            return data;
        });
        inflightSet(key, promise);
        return promise;
    }

    const data = await doFetch<T>(path, options, retried);
    if (!isGet) {
        invalidateCaches(path);
    }
    return data;
}

export function apiGet<T>(path: string): Promise<T> {
    return apiFetch<T>(path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, { method: "POST", body });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, { method: "PATCH", body });
}

export function apiDelete<T = void>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: "DELETE" });
}
