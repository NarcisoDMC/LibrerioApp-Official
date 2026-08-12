// ── Cliente del API Express: fetch con Bearer y refresh automático ─────────
// Módulo isomórfico (sin "use client"): sirve en server components
// (catálogo público) y en client components (sesión privada).

import type { ApiErrorBody, AuthResponse } from "./types";

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

export async function apiFetch<T>(
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
    if (res.status === 401 && !retried && getRefreshToken() && !path.startsWith("/api/auth/")) {
        try {
            await refreshSession();
            return apiFetch<T>(path, options, true);
        } catch {
            clearTokens();
            throw await toApiError(res);
        }
    }

    if (!res.ok) {
        throw await toApiError(res);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return (await res.json()) as T;
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
