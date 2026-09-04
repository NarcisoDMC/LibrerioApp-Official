"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import BookCard, { type Book } from "@/app/ui/Components/home/BookCard";
import { apiGet } from "@/lib/api-client";
import type { SearchResult } from "@/lib/types";

const PAGE_SIZE = 12;

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

    const [input, setInput] = useState(query);
    const [prevQuery, setPrevQuery] = useState(query);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sincronizar el input cuando cambia la URL (ajuste de estado en render)
    if (prevQuery !== query) {
        setPrevQuery(query);
        setInput(query);
    }

    // Estado derivado: la clave de búsqueda cambió → nueva carga pendiente
    const searchKey = `${query}#${page}`;
    const [prevKey, setPrevKey] = useState(searchKey);
    if (prevKey !== searchKey) {
        setPrevKey(searchKey);
        if (!query.trim()) {
            setResult(null);
            setLoading(false);
        } else {
            setLoading(true);
            setError(null);
        }
    }

    useEffect(() => {
        if (!query.trim()) return;

        let cancelled = false;

        apiGet<SearchResult>(
            `/api/books/search?q=${encodeURIComponent(query)}&page=${page}&limit=${PAGE_SIZE}`,
        )
            .then((data) => {
                if (!cancelled) setResult(data);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "Error al buscar");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [query, page]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = input.trim();
        if (q.length < 3) {
            setError("La búsqueda debe tener al menos 3 caracteres.");
            return;
        }
        router.push(`/busqueda?q=${encodeURIComponent(q)}`);
    };

    return (
        <div className="min-h-screen bg-[#fdfdfd] pb-20 font-sans">
            <div className="w-full max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 box-border">
                {/* ── Buscador ──────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl md:text-3xl font-bold text-[#4a348c] mb-4 font-[family-name:var(--font-playfair)]">
                        Buscar libros
                    </h1>
                    <form onSubmit={handleSubmit} className="relative max-w-2xl">
                        <Search
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8553d1]"
                        />
                        <input
                            type="search"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Título, autor, tema…"
                            enterKeyHint="search"
                            className="w-full bg-white border border-purple-200 rounded-full py-3 pl-12 pr-6 text-gray-700 outline-none focus:border-[#8553d1] focus:shadow-[0_0_0_2px_rgba(133,83,209,0.2)] transition-all"
                        />
                    </form>
                </motion.div>

                {/* ── Contenido ─────────────────────────────────── */}
                {loading ? (
                    <div className="flex items-center justify-center py-24 text-[#8553d1]">
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                ) : error ? (
                    <div className="py-16 text-center text-red-500 text-sm font-medium">
                        {error}
                    </div>
                ) : !query ? (
                    <div className="py-16 text-center text-gray-400 text-sm">
                        Escribe un término para buscar en el catálogo.
                    </div>
                ) : !result || result.data.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 text-sm">
                        Sin resultados para “{query}”.
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-6">
                            {result.numFound} resultado{result.numFound === 1 ? "" : "s"} para{" "}
                            <span className="font-semibold text-[#4a348c]">“{query}”</span>
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                            {result.data.map((book: Book) => (
                                <BookCard key={book.id} book={book} loading={false} />
                            ))}
                        </div>

                        {/* ── Paginación ─────────────────────────── */}
                        {(result.page > 1 || result.page * PAGE_SIZE < result.numFound) && (
                            <div className="flex items-center justify-center gap-4 mt-10">
                                <button
                                    type="button"
                                    disabled={result.page <= 1}
                                    onClick={() =>
                                        router.push(
                                            `/busqueda?q=${encodeURIComponent(query)}&page=${result.page - 1}`,
                                        )
                                    }
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 text-[#8553d1] text-sm font-medium hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Anterior
                                </button>
                                <span className="text-sm text-gray-500">Página {result.page}</span>
                                <button
                                    type="button"
                                    disabled={result.page * PAGE_SIZE >= result.numFound}
                                    onClick={() =>
                                        router.push(
                                            `/busqueda?q=${encodeURIComponent(query)}&page=${result.page + 1}`,
                                        )
                                    }
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 text-[#8553d1] text-sm font-medium hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Siguiente
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function BusquedaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fdfdfd]" />}>
            <SearchPageContent />
        </Suspense>
    );
}