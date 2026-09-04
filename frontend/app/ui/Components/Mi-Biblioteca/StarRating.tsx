"use client";

import { Star } from "lucide-react";

export default function StarRating({
    value,
    onChange,
    size = 20,
}: {
    value: number;
    onChange: (rating: number) => void;
    size?: number;
}) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((rating) => (
                <button
                    key={rating}
                    type="button"
                    onClick={() => onChange(rating)}
                    aria-label={`${rating} estrellas`}
                    className="p-0.5 transition-transform hover:scale-125 cursor-pointer"
                >
                    <Star
                        size={size}
                        className={
                            rating <= value
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-300"
                        }
                    />
                </button>
            ))}
        </div>
    );
}
