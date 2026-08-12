"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { PostView } from "@/lib/types";
import PostLikeButton from "./PostLikeButton";

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function PostCard({ post }: { post: PostView }) {
    return (
        <li className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* ── Cabecera: autor + fecha ────────────────────────── */}
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#c765dc] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {post.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            {post.author.name}
                        </p>
                        <p className="text-[11px] text-gray-400">{formatDate(post.createdAt)}</p>
                    </div>
                </div>
                {post.bookOlid && (
                    <Link
                        href={`/libro/${post.bookOlid}`}
                        className="flex-shrink-0 px-3 py-1 rounded-full bg-[#f1e6f9] text-[#8553d1] text-[11px] font-semibold hover:bg-[#edd4ff] transition-colors"
                    >
                        Ver libro
                    </Link>
                )}
            </div>

            {/* ── Contenido ──────────────────────────────────────── */}
            <Link href={`/Comunidad/${post.id}`} className="block">
                <h3 className="text-base font-bold text-[#4a348c] mb-1.5 hover:text-[#8553d1] transition-colors">
                    {post.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                    {post.content}
                </p>
            </Link>

            {/* ── Acciones ───────────────────────────────────────── */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <PostLikeButton postId={post.id} initialCount={post.likeCount} />
                <Link
                    href={`/Comunidad/${post.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 hover:border-purple-200 hover:text-[#8553d1] transition-all"
                >
                    <MessageCircle size={14} />
                    {post.commentCount}
                </Link>
            </div>
        </li>
    );
}