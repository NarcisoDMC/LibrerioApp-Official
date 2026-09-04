"use client";

import { useState } from "react";
import { Loader2, MessageCircle, X } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import type { PostView } from "@/lib/types";

export default function CreatePostModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (post: PostView) => void;
}) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [bookOlid, setBookOlid] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const post = await apiPost<PostView>("/api/community/posts", {
                title,
                content,
                ...(bookOlid.trim() ? { bookOlid: bookOlid.trim() } : {}),
            });
            onCreated(post);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo publicar");
        } finally {
            setLoading(false);
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
                    <h2 className="text-base font-bold text-[#4a348c]">Nuevo post</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:bg-purple-100 hover:text-[#8553d1] transition-colors"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Título */}
                    <div>
                        <label htmlFor="post-title" className="block text-xs font-semibold text-[#8553d1] mb-1.5 pl-1">
                            Título
                        </label>
                        <input
                            id="post-title"
                            type="text"
                            required
                            maxLength={100}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Tu recomendación en una frase"
                            className="w-full bg-[#f1e6f9] rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none border border-transparent focus:bg-white focus:border-[#8553d1] focus:shadow-[0_0_0_2px_rgba(133,83,209,0.2)] transition-all"
                        />
                    </div>

                    {/* Contenido */}
                    <div>
                        <label htmlFor="post-content" className="block text-xs font-semibold text-[#8553d1] mb-1.5 pl-1">
                            Contenido
                        </label>
                        <textarea
                            id="post-content"
                            required
                            maxLength={5000}
                            rows={5}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Cuéntale a la comunidad por qué deberían leerlo…"
                            className="w-full bg-[#f1e6f9] rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none border border-transparent focus:bg-white focus:border-[#8553d1] focus:shadow-[0_0_0_2px_rgba(133,83,209,0.2)] transition-all resize-none"
                        />
                        <p className="text-[10px] text-gray-400 text-right mt-1">{content.length}/5000</p>
                    </div>

                    {/* Libro asociado (opcional) */}
                    <div>
                        <label htmlFor="post-olid" className="block text-xs font-semibold text-[#8553d1] mb-1.5 pl-1">
                            Libro asociado (opcional)
                        </label>
                        <input
                            id="post-olid"
                            type="text"
                            value={bookOlid}
                            onChange={(e) => setBookOlid(e.target.value)}
                            pattern="OL\d+W"
                            placeholder="OLID de la obra, p. ej. OL27448W"
                            className="w-full bg-[#f1e6f9] rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none border border-transparent focus:bg-white focus:border-[#8553d1] focus:shadow-[0_0_0_2px_rgba(133,83,209,0.2)] transition-all"
                        />
                    </div>

                    {error && (
                        <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] hover:opacity-90 disabled:opacity-60 transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Publicando…
                            </>
                        ) : (
                            <>
                                <MessageCircle size={16} />
                                Publicar
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}