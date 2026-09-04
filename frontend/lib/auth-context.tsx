"use client";

// ── Sesión global: AuthProvider + hook useAuth ─────────────────────────────

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    apiFetch,
    clearTokens,
    getAccessToken,
    getRefreshToken,
    refreshSession,
    storeTokens,
} from "./api-client";
import type { AuthResponse, SafeUser } from "./types";

interface AuthContextValue {
    user: SafeUser | null;
    initializing: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (input: { name: string; email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_PROACTIVE_MS = 14 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SafeUser | null>(null);
    const [initializing, setInitializing] = useState(true);
    // Hidratación inicial: me → refresh → anónimo
    useEffect(() => {
        let cancelled = false;

        async function hydrate(): Promise<void> {
            const stored = localStorage.getItem("librerio.lastRefresh");
            const lastRefresh = stored ? Number(stored) : 0;
            const elapsed = Date.now() - lastRefresh;

            if (getAccessToken() && elapsed < 14 * 60 * 1000) {
                try {
                    // Si el access expiró, apiFetch refresca solo y reintenta
                    const me = await apiFetch<SafeUser>("/api/auth/me");
                    if (!cancelled) setUser(me);
                    return;
                } catch {
                    // access y refresh caducados: quedamos como anónimos
                }
            } else if (getRefreshToken()) {
                try {
                    const session = await refreshSession();
                    if (!cancelled) setUser(session.user);
                    return;
                } catch {
                    clearTokens();
                }
            }
        }

        void hydrate().finally(() => {
            if (!cancelled) setInitializing(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const applySession = useCallback((session: AuthResponse) => {
        storeTokens(session.accessToken, session.refreshToken);
        setUser(session.user);
        localStorage.setItem("librerio.lastRefresh", String(Date.now()));
    }, []);

    const login = useCallback(
        async (email: string, password: string) => {
            const session = await apiFetch<AuthResponse>("/api/auth/login", {
                method: "POST",
                body: { email, password },
            });
            applySession(session);
        },
        [applySession],
    );

    useEffect(() => {
        if (!user) return;

        const timer = setTimeout(async () => {
            try {
                const session = await refreshSession();
                storeTokens(session.accessToken, session.refreshToken);
                localStorage.setItem("librerio.lastRefresh", String(Date.now()));
                setUser(session.user);
            } catch (error) {
                console.debug("Refresh proactivo fallo:", error);
            }
        }, REFRESH_PROACTIVE_MS);

        return () => clearTimeout(timer);
    }, [user]);

    const register = useCallback(
        async (input: { name: string; email: string; password: string }) => {
            const session = await apiFetch<AuthResponse>("/api/auth/register", {
                method: "POST",
                body: input,
            });
            applySession(session);
        },
        [applySession],
    );

    const logout = useCallback(async () => {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                await apiFetch("/api/auth/logout", { method: "POST", body: { refreshToken } });
            } catch {
                // aunque falle el servidor, la sesión local se cierra igualmente
            }
        }
        clearTokens();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, initializing, login, register, logout }),
        [user, initializing, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    }
    return ctx;
}
