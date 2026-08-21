'use client'

import { motion } from "motion/react";
import { BookOpen, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import BibliotecarioChat from "@/app/ui/Components/BibliotecarioChat";

// ── Página del Bibliotecario IA ────────────────────────────────────────────
// Hero compacto + área de chat que ocupa toda la altura disponible
// (crece con la pantalla; el scroll vive dentro del chat, no en la página).
// correccion: La altura del chat no debe de incrementar, aplicar overflow-y

export default function Bibliotecario() {
    const { user } = useAuth();

    return (
        <div className="min-h-dvh bg-[#fdfdfd] flex flex-col font-sans">
            {/* ── Hero compacto ─────────────────────────────────── */}
            <div className="w-full max-w-7xl mx-auto mt-4 sm:mt-6 px-4 sm:px-6 lg:px-8 box-border">
                <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="
                        relative overflow-hidden rounded-[1.75rem]
                        bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc]
                        px-5 sm:px-8 py-4 sm:py-5 text-white
                        shadow-[0_14px_35px_-12px_rgba(133,83,209,0.35)]
                    "
                >
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent,_transparent)]" />
                    <div className="absolute -right-6 -bottom-6 text-white/10 pointer-events-none">
                        <BookOpen strokeWidth={0.5} className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="inline-flex items-center gap-1.5 self-start bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium border border-white/30">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            Asistente Inteligente
                        </div>
                        <div className="sm:flex-1 sm:min-w-0">
                            <h1 className="
                                font-[family-name:var(--font-playfair)]
                                text-2xl sm:text-3xl font-bold leading-tight m-0
                                [text-shadow:0_2px_6px_rgba(0,0,0,0.2)]
                            ">
                                Bibliotecario Virtual
                            </h1>
                            <p className="mt-0.5 text-white/85 text-xs sm:text-sm leading-relaxed m-0">
                                Recomendaciones, autores, sagas y dónde conseguir tus lecturas, con el conocimiento de tu biblioteca.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Área principal: chat a altura completa ─────────── */}
            <main className="flex-1 min-h-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 box-border">
                <div className="h-[calc(100dvh-225px)] min-h-[430px]">
                    {user ? (
                        <BibliotecarioChat />
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 18, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full flex items-center justify-center"
                        >
                            <div className="bg-gradient-to-br from-[#f8f5ff] to-[#eedfff] rounded-3xl p-8 border border-purple-200/60 max-w-md text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3d5bcf] to-[#c765dc] flex items-center justify-center text-white shadow-md mx-auto">
                                    <LogIn className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mb-1 mt-4">
                                    Inicia sesión para chatear con el bibliotecario
                                </p>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    El asistente conoce tu biblioteca para recomendarte según lo que ya has leído.
                                </p>
                                <a
                                    href="/Login"
                                    className="inline-block px-6 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] hover:opacity-90 transition-all mt-5"
                                >
                                    Iniciar sesión
                                </a>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
