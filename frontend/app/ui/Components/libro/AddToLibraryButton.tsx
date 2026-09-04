"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Loader2, Plus } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useLibrary } from "@/lib/use-library-books";
import type { LibraryBook } from "@/lib/types";

export default function AddToLibraryButton({ olid }: { olid: string }) {
    const router = useRouter();
    const { user, initializing } = useAuth();
    const { olids, loading: libraryLoading, refresh } = useLibrary(); // obtenemos los libros que tenga el usuario en su libreria

    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ajuste de estado en render: limpiar al cambiar el libro
    const [prevOlid, setPrevOlid] = useState(olid);
    if (prevOlid !== olid) {
        setPrevOlid(olid);
        setAdded(false);
        setError(null);
    }

    const handleAdd = async () => {
        if (!user) {
            router.push("/Login");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await apiPost<LibraryBook>("/api/library", { olid });
            setAdded(true);
            refresh();
        } catch (err) {
            if (err instanceof Error && err.message.includes("Ya tienes este libro")) {
                setAdded(true);
                refresh();
            } else {
                setError(err instanceof Error ? err.message : "No se pudo añadir el libro");
            }
        } finally {
            setLoading(false);
        }
    };

    const alreadyInLibrary = !libraryLoading && olids.has(olid);

    if (initializing || loading) {
        return (
            <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm opacity-60 bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc]"
            >
                <Loader2 size={16} className="animate-spin" />
                {loading ? "Añadiendo…" : "Cargando…"}
            </button>
        );
    }

    if (added || alreadyInLibrary) {
        return (
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm">
                <Check size={16} />
                En tu biblioteca
            </span>
        );
    }

    return (
        <div className="flex flex-col items-start gap-2">
            <button
                type="button"
                onClick={() => void handleAdd()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] hover:opacity-90 hover:scale-[1.02] transition-all"
            >
                {user ? <Plus size={16} /> : <BookOpen size={16} />}
                {user ? "Añadir a Mi Biblioteca" : "Inicia sesión para añadirlo"}
                
            </button>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
}