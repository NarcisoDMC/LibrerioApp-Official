'use client'

import React, { useState } from "react";
import { BookOpen, Star } from "lucide-react";

export interface Book {
    id: string | number;
    title: string;
    author: string;
    rating: number | string;
    cover?: string | null;
}

export default function BookCard({ book, loading }: { book: Book | null; loading: boolean }) {
    const [imageError, setImageError] = useState(false);
    const [prevBookId, setPrevBookId] = useState<Book["id"] | null>(book?.id ?? null);

    if (prevBookId !== (book?.id ?? null)) {
        setPrevBookId(book?.id ?? null);
        setImageError(false);
    }

    if (loading || !book) {
        return (
            <div className="flex flex-col h-full w-full rounded-2xl border border-purple-300/40 bg-white p-3.5 shadow-sm overflow-hidden animate-pulse">
                <div className="flex flex-col h-full justify-between gap-3">
                    {/* Placeholder de la portada */}
                    <div className="w-full flex justify-center items-center py-1">
                        <div className="w-28 sm:w-32 aspect-[2/3] max-h-44 rounded-lg bg-purple-200" />
                    </div>
                    <div className="flex flex-col justify-between flex-grow gap-2">
                        <div>
                            {/* Placeholder del título */}
                            <div className="h-4 bg-purple-200 rounded w-3/4" />
                            {/* Placeholder del autor */}
                            <div className="h-3 bg-purple-100 rounded w-1/2 mt-2" />
                        </div>
                        {/* Placeholder de la calificación */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                            <div className="h-4 w-4 bg-amber-200 rounded" />
                            <div className="h-4 bg-purple-200 rounded w-8" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── MODO NORMAL ────────────────────────────────────────── */
    return (
        <div className="group relative flex flex-col h-full w-full rounded-2xl border border-purple-300/40 bg-white p-3.5 sm:p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2.5 hover:shadow-xl hover:shadow-purple-500/15 hover:border-purple-500 cursor-pointer overflow-hidden">
            {/* Overlay de gradiente al hacer hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/50 to-purple-100/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                {/* Portada del libro */}
                <div className="w-full flex justify-center items-center py-1">
                    {book.cover && !imageError ? (
                        <div className="w-28 sm:w-32 aspect-[2/3] max-h-44 max-md:max-h-40 rounded-lg overflow-hidden shadow-md transition-transform duration-300 group-hover:scale-[1.03] bg-purple-100/50 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element -- imágenes remotas de la API con onError/referrerPolicy */}
                            <img
                                src={book.cover}
                                alt={book.title}
                                referrerPolicy="no-referrer"
                                onError={() => setImageError(true)}
                                className="w-full h-full object-cover block"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        /* Fallback: gradiente si no hay portada o falló la carga */
                        <div className="w-28 sm:w-32 aspect-[2/3] max-h-44 rounded-lg bg-gradient-to-br from-[#3d5bcf] via-[#8553d1] to-[#c765dc] shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]">
                            <BookOpen className="w-9 h-9 sm:w-10 sm:h-10 text-white/90" />
                        </div>
                    )}
                </div>

                {/* Información del libro */}
                <div className="flex flex-col justify-between flex-grow gap-2">
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-[#4a348c] transition-colors" title={book.title}>
                            {book.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 truncate" title={book.author}>
                            {book.author}
                        </p>
                    </div>

                    {/* Calificación */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">{book.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}