"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, UsersRound, X } from "lucide-react";
import { motion } from "motion/react";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { PostListResult, PostView } from "@/lib/types";
import PostCard from "@/app/ui/Components/PostCard";
import CreatePostModal from "@/app/ui/Components/CreatePostModal";

const PAGE_SIZE = 10;

export default function Comunidad() {
    const { user } = useAuth();
    const [result, setResult] = useState<PostListResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        let cancelled = false;
        apiGet<PostListResult>(`/api/community/posts?page=1&limit=${PAGE_SIZE}`)
            .then((data) => {
                if (!cancelled) setResult(data);
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
    }, []);

    const handleCreated = (post: PostView) => {
        setShowCreate(false);
        // El post nuevo se inserta al principio del feed
        setResult((prev) =>
            prev
                ? { ...prev, total: prev.total + 1, data: [post, ...prev.data.slice(0, PAGE_SIZE - 1)] }
                : { page: 1, limit: PAGE_SIZE, total: 1, data: [post] },
        );
    };

    return (
        <div className="min-h-screen bg-[#fdfdfd] pb-20 font-sans">
            <div className="w-full max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 box-border">
                {/* ── Cabecera ─────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-between gap-4 mb-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#3d5bcf] to-[#c765dc] flex items-center justify-center text-white shadow-md">
                            <UsersRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#4a348c] font-[family-name:var(--font-playfair)]">
                                Comunidad
                            </h1>
                            <p className="text-xs text-gray-500">Recomendaciones y reseñas de lectores</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (!user) {
                                window.location.href = "/Login";
                                return;
                            }
                            setShowCreate(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] hover:opacity-90 hover:scale-[1.02] transition-all"
                    >
                        <Plus size={16} />
                        Nuevo post
                    </button>
                </motion.div>

                {error && (
                    <div className="mb-6 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center justify-between">
                        {error}
                        <button type="button" onClick={() => setError(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* ── Feed ─────────────────────────────────────────── */}
                {loading ? (
                    <div className="flex justify-center py-24 text-[#8553d1]">
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                ) : !result || result.data.length === 0 ? (
                    <div className="py-20 text-center">
                        <UsersRound className="w-14 h-14 mx-auto mb-4 text-purple-300" />
                        <p className="text-gray-400 text-sm mb-2">Todavía no hay publicaciones.</p>
                        <p className="text-gray-300 text-xs">
                            ¡Sé la primera persona en recomendar un libro!
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-5">
                        {result.data.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </ul>
                )}
            </div>

            {showCreate && (
                <CreatePostModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
            )}
        </div>
    );
}