"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, MessageCircle, Send, BookOpen } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { PostDetail } from "@/lib/types";
import { formatDate } from "@/app/ui/Components/PostCard";
import PostLikeButton from "@/app/ui/Components/PostLikeButton";

export default function PostDetailPage() {
    const params = useParams<{ id: string }>();
    const postId = params.id;

    const { user } = useAuth();

    const [post, setPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comment, setComment] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let cancelled = false;
        apiGet<PostDetail>(`/api/community/posts/${postId}`)
            .then((data) => {
                if (!cancelled) setPost(data);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "No se encontró el post");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [postId]);

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !post) return;
        if (!user) {
            window.location.href = "/Login";
            return;
        }
        setSending(true);
        try {
            const created = await apiPost<PostDetail["comments"][number]>(
                `/api/community/posts/${postId}/comments`,
                { content: comment.trim() },
            );
            setPost({ ...post, commentCount: post.commentCount + 1, comments: [...post.comments, created] });
            setComment("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo comentar");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdfdfd] flex items-center justify-center text-[#8553d1]">
                <Loader2 size={30} className="animate-spin" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-[#fdfdfd] flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500 text-sm">{error ?? "Post no encontrado"}</p>
                <Link
                    href="/Comunidad"
                    className="inline-flex items-center gap-2 text-[#8553d1] text-sm font-medium hover:text-[#4a348c] transition-colors"
                >
                    <ArrowLeft size={16} />
                    Volver a la comunidad
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfdfd] pb-20 font-sans">
            <div className="w-full max-w-3xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 box-border">
                {/* ── Volver ─────────────────────────────────────── */}
                <Link
                    href="/Comunidad"
                    className="inline-flex items-center gap-2 text-[#8553d1] text-sm font-medium hover:text-[#4a348c] transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Volver a la comunidad
                </Link>

                {/* ── Post ────────────────────────────────────────── */}
                <article className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#c765dc] flex items-center justify-center text-white text-sm font-bold">
                            {post.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">{post.author.name}</p>
                            <p className="text-[11px] text-gray-400">{formatDate(post.createdAt)}</p>
                        </div>
                    </div>

                    <h1 className="text-xl md:text-2xl font-bold text-[#4a348c] mb-3 font-[family-name:var(--font-playfair)]">
                        {post.title}
                    </h1>

                    {post.bookOlid && (
                        <Link
                            href={`/libro/${post.bookOlid}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f1e6f9] text-[#8553d1] text-xs font-semibold hover:bg-[#edd4ff] transition-colors mb-4"
                        >
                            <BookOpen size={13} />
                            Ver libro asociado
                        </Link>
                    )}

                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line mb-5">
                        {post.content}
                    </p>

                    <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                        <PostLikeButton postId={post.id} initialCount={post.likeCount} />
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <MessageCircle size={14} />
                            {post.commentCount} comentario{post.commentCount === 1 ? "" : "s"}
                        </span>
                    </div>
                </article>

                {/* ── Comentarios ─────────────────────────────────── */}
                <h2 className="text-sm font-bold text-[#4a348c] uppercase tracking-wide mb-4">
                    Comentarios
                </h2>

                <ul className="space-y-3 mb-6">
                    {post.comments.length === 0 ? (
                        <li className="text-center text-gray-400 text-xs py-6">
                            Sin comentarios todavía. ¡Anímate a comentar!
                        </li>
                    ) : (
                        post.comments.map((c) => (
                            <li key={c.id} className="bg-white border border-purple-100 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#c765dc] flex items-center justify-center text-white text-[10px] font-bold">
                                        {c.author.name.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-xs font-semibold text-gray-700">{c.author.name}</p>
                                    <span className="text-[10px] text-gray-400">{formatDate(c.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{c.content}</p>
                            </li>
                        ))
                    )}
                </ul>

                {/* ── Formulario de comentario ────────────────────── */}
                <form onSubmit={handleComment} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                        placeholder={user ? "Escribe un comentario…" : "Inicia sesión para comentar"}
                        className="flex-1 bg-white border border-purple-100 rounded-full px-5 py-3 text-sm text-gray-700 outline-none focus:border-[#8553d1] focus:shadow-[0_0_0_2px_rgba(133,83,209,0.2)] transition-all"
                    />
                    <button
                        type="submit"
                        disabled={sending || !comment.trim()}
                        className="w-11 h-11 rounded-full bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] text-white flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-40 transition-all"
                        aria-label="Enviar comentario"
                    >
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </form>
            </div>
        </div>
    );
}