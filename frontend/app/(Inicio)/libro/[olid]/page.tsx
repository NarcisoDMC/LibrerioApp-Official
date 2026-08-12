import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, Star } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { BookDetail } from "@/lib/types";
import AddToLibraryButton from "@/app/ui/Components/AddToLibraryButton";
import BackButton from "@/app/ui/Components/BackButton";
import MarkdownContent from "@/app/ui/Components/MarkdownContent";

export const dynamic = "force-dynamic";

export default async function LibroPage({
    params,
}: {
    params: Promise<{ olid: string }>;
}) {
    const { olid } = await params;

    let book: BookDetail;
    try {
        book = await apiGet<BookDetail>(`/api/books/${olid}`);
    } catch {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#fdfdfd] pb-20 font-sans">
            <div className="w-full max-w-6xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 box-border">
                {/* ── Volver ─────────────────────────────────────── */}
                <div className="mb-6">
                    <BackButton />
                </div>

                {/* ── Ficha del libro ────────────────────────────── */}
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Portada */}
                    <div className="flex-shrink-0 flex justify-center">
                        {book.cover ? (
                            <div className="w-72 sm:w-80 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-purple-100 bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element -- imágenes remotas de la API */}
                                <img
                                    src={book.cover}
                                    alt={book.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover block"
                                />
                            </div>
                        ) : (
                            <div className="w-72 sm:w-80 aspect-[2/3] rounded-2xl bg-gradient-to-br from-[#3d5bcf] via-[#8553d1] to-[#c765dc] shadow-2xl flex items-center justify-center">
                                <BookOpen className="w-20 h-20 text-white/90" />
                            </div>
                        )}
                    </div>

                    {/* Datos */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl md:text-4xl font-bold text-[#4a348c] leading-tight mb-3 font-[family-name:var(--font-playfair)]">
                            {book.title}
                        </h1>

                        <p className="text-gray-600 text-base md:text-lg mb-2">
                            <span className="font-semibold">Autor:</span> {book.author}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
                            {book.firstPublishDate && (
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays size={15} />
                                    {book.firstPublishDate}
                                </span>
                            )}
                            {book.isbn && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Star size={15} className="text-amber-400 fill-amber-400" />
                                    ISBN {book.isbn}
                                </span>
                            )}
                        </div>

                        {book.description && (
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-[#4a348c] uppercase tracking-wide mb-2">
                                    Sinopsis
                                </h2>
                                <MarkdownContent content={book.description} />
                            </div>
                        )}

                        {book.subjects.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-sm font-bold text-[#4a348c] uppercase tracking-wide mb-2">
                                    Temas
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {book.subjects.map((subject) => (
                                        <Link
                                            key={subject}
                                            href={`/busqueda?q=${encodeURIComponent(subject)}`}
                                            className="px-3 py-1 rounded-full bg-[#f1e6f9] text-[#8553d1] text-xs font-medium hover:bg-[#edd4ff] transition-colors"
                                        >
                                            {subject}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <AddToLibraryButton olid={book.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
