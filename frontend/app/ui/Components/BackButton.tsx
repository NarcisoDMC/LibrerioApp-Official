"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// "Volver": si hay historial de navegación vuelve atrás (p. ej. a la búsqueda
// anterior), si no, cae al inicio
export default function BackButton() {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-purple-400 transition-colors hover:bg-white/10 hover:text-purple-200"
        >
            <ArrowLeft size={16} />
            Volver
        </button>
    );
}
