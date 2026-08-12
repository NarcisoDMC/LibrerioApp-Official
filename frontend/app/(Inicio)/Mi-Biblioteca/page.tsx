"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { LibraryBook, ReadingStatus } from "@/lib/types";
import LibraryAddModal from "@/app/ui/Components/LibraryAddModal";
import StarRating from "@/app/ui/Components/StarRating";

const STATUSES: { key: ReadingStatus; label: string }[] = [
    { key: "por-leer", label: "Por leer" },
    { key: "leyendo", label: "Leyendo" },
    { key: "leido", label: "Leído" },
];

const STATUS_BADGE: Record<ReadingStatus, string> = {
    "por-leer": "bg-sky-50 text-sky-600 border-sky-200",
    leyendo: "bg-amber-50 text-amber-600 border-amber-200",
    leido: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

function statusLabel(status: ReadingStatus): string {
    return STATUSES.find((s) => s.key === status)?.label ?? status;
}

export default function MiBiblioteca() {
    const router = useRouter();
    const { user, initializing } = useAuth();

    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<ReadingStatus | "todos">("todos");
    const [showAdd, setShowAdd] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // ── Redirect si no hay sesión ─────────────────────────────
    useEffect(() => {
        if (!initializing && !user) router.replace("/Login");
    }, [initializing, user, router]);

    // ── Carga de la biblioteca ────────────────────────────────
    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        const url = filter === "todos" ? "/api/library" : `/api/library?status=${filter}`;
        apiGet<LibraryBook[]>(url)
            .then((data) => {
                if (!cancelled) setBooks(data);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [user, filter, reloadKey]);

    const handlePatch = async (bookId: string, patch: Partial<Pick<LibraryBook, "status" | "userRating" | "notes">>) => {
        try {
            const updated = await apiPatch<LibraryBook>(`/api/library/${bookId}`, patch);
            setBooks((prev) => prev.map((b) => (b.id === bookId ? updated : b)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar");
        }
    };

    const handleDelete = async (bookId: string) => {
        if (!window.confirm("¿Quitar este libro de tu biblioteca?")) return;
        try {
            await apiDelete(`/api/library/${bookId}`);
            setBooks((prev) => prev.filter((b) => b.id !== bookId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar");
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen bg-[#fdfdfd] flex items-center justify-center text-[#8553d1]">
                <Loader2 size={30} className="animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#fdfdfd] pb-20 font-sans">
            <div className="w-full max-w-6xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 box-border">
                {/* ── Cabecera ─────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#4a348c] font-[family-name:var(--font-playfair)]">
                            Mi Biblioteca
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {books.length} libro{books.length === 1 ? "" : "s"} guardado
                            {books.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAdd(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] hover:opacity-90 hover:scale-[1.02] transition-all"
                    >
                        <Plus size={16} />
                        Añadir libro
                    </button>
                </motion.div>

                {/* ── Filtros ──────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        type="button"
                        onClick={() => setFilter("todos")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            filter === "todos"
                                ? "bg-violet-700 text-white"
                                : "bg-[#f1e6f9] text-[#8553d1] hover:bg-[#edd4ff]"
                        }`}
                    >
                        Todos
                    </button>
                    {STATUSES.map((status) => (
                        <button
                            key={status.key}
                            type="button"
                            onClick={() => setFilter(status.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                filter === status.key
                                    ? "bg-violet-700 text-white"
                                    : "bg-[#f1e6f9] text-[#8553d1] hover:bg-[#edd4ff]"
                            }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center justify-between">
                        {error}
                        <button type="button" onClick={() => setError(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* ── Lista de libros ─────────────────────────────── */}
                {loading ? (
                    <div className="flex justify-center py-24 text-[#8553d1]">
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                ) : books.length === 0 ? (
                    <div className="py-20 text-center">
                        <BookOpen className="w-14 h-14 mx-auto mb-4 text-purple-300" />
                        <p className="text-gray-400 text-sm mb-2">
                            {filter === "todos"
                                ? "Tu biblioteca está vacía todavía."
                                : "Sin libros en este estado."}
                        </p>
                        <p className="text-gray-300 text-xs">
                            Pulsa &quot;Añadir libro&quot; para guardar tu primera lectura.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {books.map((book) => (
                            <LibraryCard
                                key={book.id}
                                book={book}
                                onPatch={handlePatch}
                                onDelete={() => void handleDelete(book.id)}
                            />
                        ))}
                    </ul>
                )}
            </div>

            {showAdd && (
                <LibraryAddModal
                    onClose={() => setShowAdd(false)}
                    onAdded={() => {
                        setShowAdd(false);
                        setReloadKey((k) => k + 1);
                    }}
                />
            )}
        </div>
    );
}

// ── Tarjeta de libro con edición inline ─────────────────────────────────────

function LibraryCard({
    book,
    onPatch,
    onDelete,
}: {
    book: LibraryBook;
    onPatch: (id: string, patch: Partial<Pick<LibraryBook, "status" | "userRating" | "notes">>) => void;
    onDelete: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [status, setStatus] = useState<ReadingStatus>(book.status);
    const [rating, setRating] = useState<number>(book.userRating ?? 0);
    const [notes, setNotes] = useState(book.notes ?? "");

    const save = () => {
        setEditing(false);
        void onPatch(book.id, { status, userRating: rating || null, notes: notes.trim() || null });
    };

    return (
        <li className="bg-white border border-purple-100 rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-4">
                {/* Portada */}
                {book.cover ? (
                    <Link
                        href={`/libro/${book.olid}`}
                        className="w-16 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-purple-100 block cursor-pointer"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element -- imágenes remotas de la API */}
                        <img
                            src={book.cover}
                            alt={book.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                        />
                    </Link>
                ) : (
                    <div className="w-16 h-24 rounded-xl bg-gradient-to-br from-[#3d5bcf] to-[#c765dc] flex-shrink-0 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white/90" />
                    </div>
                )}

                {/* Información */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 truncate">
                                {book.title}
                            </h3>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{book.author}</p>
                        </div>
                        <span
                            className={`flex-shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${STATUS_BADGE[book.status]}`}
                        >
                            {statusLabel(book.status)}
                        </span>
                    </div>

                    {editing ? (
                        <div className="mt-3 space-y-3">
                            {/* Estado */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium w-14 shrink-0">Estado</span>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as ReadingStatus)}
                                    className="flex-1 bg-[#f1e6f9] rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none border border-transparent focus:border-[#8553d1]"
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s.key} value={s.key}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Calificación */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium w-14 shrink-0">Puntuación</span>
                                <StarRating value={rating} onChange={setRating} size={18} />
                                {rating > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setRating(0)}
                                        className="text-[10px] text-gray-400 hover:text-gray-600"
                                    >
                                        quitar
                                    </button>
                                )}
                            </div>

                            {/* Notas */}
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-gray-500 font-medium w-14 shrink-0 pt-1.5">Notas</span>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    maxLength={2000}
                                    rows={3}
                                    placeholder="Tus impresiones…"
                                    className="flex-1 bg-[#f1e6f9] rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none border border-transparent focus:border-[#8553d1] resize-none"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={save}
                                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#3d5bcf] to-[#8553d1] text-white text-xs font-semibold hover:opacity-90 transition-all"
                                >
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 flex items-center gap-3">
                            {book.userRating ? (
                                <StarRating value={book.userRating} onChange={() => {}} size={14} />
                            ) : (
                                <span className="text-[11px] text-gray-400">Sin puntuar</span>
                            )}
                            {book.notes && (
                                <p className="text-xs text-gray-500 truncate italic">“{book.notes}”</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Acciones */}
                {!editing && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="p-2 rounded-full text-[#8553d1] hover:bg-[#f1e6f9] transition-colors"
                            title="Editar"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="p-2 rounded-full text-red-400 hover:bg-red-50 transition-colors"
                            title="Quitar"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
        </li>
    );
}