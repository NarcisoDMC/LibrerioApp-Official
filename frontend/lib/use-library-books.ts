"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { apiGet } from "./api-client";
import { useAuth } from "./auth-context";
import { cacheGetVersion, cacheSubscribe, clearCache } from "./http-cache";
import type { LibraryBook } from "./types";

export function useLibrary() {
    const { user } = useAuth();

    const [olids, setOlids] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    // Versión de la caché: cualquier invalidación (mutation, refresh de otra
    // instancia) incrementa el contador y obliga a re-consultar aquí.
    const cacheVersion = useSyncExternalStore(
        cacheSubscribe,
        cacheGetVersion,
        cacheGetVersion, // snapshot del servidor: el contador es estable en SSR
    );

    const sessionKey = `${user?.id ?? ""}#${reloadKey}`;
    const [prevKey, setPrevKey] = useState(sessionKey);
    if (prevKey !== sessionKey) {
        setPrevKey(sessionKey);
        if (user) {
            setLoading(true);
        } else {
            setLoading(false);
            setOlids(new Set());
        }
    }

    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        apiGet<LibraryBook[]>("/api/library")
            .then((data) => {
                if (!cancelled) setOlids(new Set(data.map((book) => book.olid)));
            })
            .catch(() => {
                if (!cancelled) setOlids(new Set());
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [user, reloadKey, cacheVersion]);

    // Invalida la caché y re-dispara la carga: como es compartida, todas las
    // instancias montadas se enteran vía cacheVersion.
    const refresh = useCallback(() => {
        clearCache("/api/library");
        setReloadKey((k) => k + 1);
    }, []);

    return { olids, loading, refresh };
}

