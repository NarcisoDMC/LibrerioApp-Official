"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function PostLikeButton({
    postId,
    initialCount,
}: {
    postId: string;
    initialCount: number;
}) {
    const router = useRouter();
    const { user } = useAuth();

    const [liked, setLiked] = useState(false);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (!user) {
            router.push("/Login");
            return;
        }
        setLoading(true);
        try {
            const { liked: nowLiked } = await apiPost<{ liked: boolean }>(
                `/api/community/posts/${postId}/like`,
            );
            setLiked(nowLiked);
            setCount((prev) => (nowLiked ? prev + 1 : prev - 1));
        } catch {
            // si el post ya no existe, el feed se encarga del estado
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={() => void handleClick()}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                liked
                    ? "border-pink-200 bg-pink-50 text-pink-600"
                    : "border-gray-200 bg-white text-gray-500 hover:border-pink-200 hover:text-pink-500"
            } disabled:opacity-50`}
        >
            {loading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <Heart size={14} className={liked ? "fill-pink-500 text-pink-500" : ""} />
            )}
            {count}
        </button>
    );
}
