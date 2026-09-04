"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import type { Book, LibraryBook, SearchResult } from "@/lib/types";

export default function LibraryAddModal({
    onClose,
    onAdded,
}: {
    onClose: () => void;
    onAdded: () => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Book[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const searchKey = query.trim();

    // Ajuste de estado en render: nueva búsqueda → pendiente (solo con ≥3 chars)
    const [prevKey, setPrevKey] = useState("");
    if (prevKey !== searchKey) {
        setPrevKey(searchKey);
        setSearching(searchKey.length >= 3);
        setError(null);
    }

    useEffect(() => {
        if (searchKey.length < 3) return;

        let cancelled = false;
        const timer = setTimeout(() => {
            apiGet<SearchResult>(`/api/books/search?q=${encodeURIComponent(searchKey)}&limit=8`)
                .then((data) => {
                    if (!cancelled) setResults(data.data);
                })
                .catch((err: unknown) => {
                    if (!cancelled) setError(err instanceof Error ? err.message : "Error al buscar");
                })
                .finally(() => {
                    if (!cancelled) setSearching(false);
                });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchKey]);

    const handleAdd = async (book: Book) => {
        setAddingId(book.id);
        setError(null);
        try {
            await apiPost<LibraryBook>("/api/library", { olid: book.id });
            onAdded();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo añadir el libro");
        } finally {
            setAddingId(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Cabecera ─────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                    <h2 className="text-base font-bold text-[#4a348c]">Añadir a Mi Biblioteca</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:bg-purple-100 hover:text-[#8553d1] transition-colors"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Búsqueda ─────────────────────────────────────── */}
                <div className="px-6 pt-5">
                    <div className="relative">
                        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8553d1]" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Busca tu próximo libro…"
                            autoFocus
                            className="w-full bg-[#f1e6f9] rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none focus:bg-white focus:border-[#8553d1] focus:shadow-[0_0_0_2px_rgba(133,83,209,0.2)] border border-transparent transition-all"
                        />
                    </div>

                    {error && <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>}
                </div>

                {/* ── Resultados ───────────────────────────────────── */}
                <div className="px-6 py-4 max-h-80 overflow-y-auto">
                    {searching ? (
                        <div className="flex justify-center py-10 text-[#8553d1]">
                            <Loader2 size={26} className="animate-spin" />
                        </div>
                    ) : !searchKey ? (
                        <p className="text-center text-gray-400 text-xs py-10">
                            Escribe un título o autor para buscar en el catálogo.
                        </p>
                    ) : searchKey.length < 3 ? (
                        <p className="text-center text-gray-400 text-xs py-10">
                            Escribe al menos 3 caracteres para buscar.
                        </p>
                    ) : results.length === 0 ? (
                        <p className="text-center text-gray-400 text-xs py-10">
                            Sin resultados para “{query}”.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {results.map((book) => (
                                <li key={book.id}>
                                    <div className="flex items-center gap-3 bg-white border border-purple-100 rounded-2xl p-2.5 hover:border-purple-300 transition-colors">
                                        {book.cover ? (
                                            <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-purple-100">
                                                {/* eslint-disable-next-line @next/next/no-img-element -- imágenes remotas de la API */}
                                                <img
                                                    src={book.cover}
                                                    alt=""
                                                    referrerPolicy="no-referrer"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-[#3d5bcf] to-[#c765dc] flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {book.title}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {book.author}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={addingId === book.id}
                                            onClick={() => void handleAdd(book)}
                                            className="flex-shrink-0 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                                        >
                                            {addingId === book.id ? "Añadiendo…" : "Añadir"}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}