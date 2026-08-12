'use client'

import { motion } from "motion/react";
import { Bot, Sparkles, BookOpen, Compass, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import BibliotecarioChat from "@/app/ui/Components/BibliotecarioChat";

export default function Bibliotecario() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#fdfdfd] pb-16 font-sans">
            {/* ── Banner Hero ──────────────────────────────────── */}
            <div className="w-full max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 box-border">
                <motion.div
                    initial={{ opacity: 0, y: 25, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="
                        relative w-full py-8 md:py-10 px-6 md:px-12
                        rounded-[2.5rem]
                        bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc]
                        flex flex-col md:flex-row items-center justify-between gap-6
                        overflow-hidden shadow-[0_20px_45px_-10px_rgba(133,83,209,0.3)]
                        box-border text-white
                    "
                >
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent,_transparent)]" />
                    <div className="absolute -right-8 -bottom-8 text-white/10 pointer-events-none">
                        <BookOpen strokeWidth={0.5} className="w-64 h-64" />
                    </div>

                    <div className="z-10 flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs md:text-sm font-medium mb-3 border border-white/30">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <span>Asistente Inteligente Librerio</span>
                        </div>

                        <h1 className="
                            text-3xl md:text-5xl font-bold tracking-wide leading-tight m-0
                            font-[family-name:var(--font-playfair)]
                            [text-shadow:0_4px_8px_rgba(0,0,0,0.2)]
                        ">
                            Bibliotecario Virtual
                        </h1>

                        <p className="mt-2 text-white/90 text-sm md:text-base max-w-xl leading-relaxed">
                            Consulta resúmenes, encuentra recomendaciones personalizadas y descubre tu próxima gran lectura charlando con nuestra IA especializada.
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="z-10 flex flex-col items-center justify-center flex-shrink-0"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-white/30 rounded-full blur-xl transition-all group-hover:blur-2xl" />

                            <div className="
                                w-24 h-24 md:w-28 md:h-28 rounded-full
                                bg-gradient-to-tr from-purple-200 via-white to-pink-200
                                p-1 shadow-xl flex items-center justify-center relative z-10
                            ">
                                <div className="w-full h-full bg-[#4a348c] rounded-full flex items-center justify-center text-white relative overflow-hidden">
                                    <Bot className="w-12 h-12 md:w-14 md:h-14 text-purple-200" />
                                    <motion.div
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="absolute bottom-0 right-0 z-20 bg-emerald-500 border-2 border-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">En línea</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* ── Contenedor Principal ──────────────────────────── */}
            <div className="w-full max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 box-border">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* ── Sidebar Informativo ────────────────────────── */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-[#f8f5ff] to-[#eedfff] rounded-3xl p-5 border border-purple-200/60 text-[#4a348c]">
                            <div className="flex items-center gap-2 font-bold text-sm mb-2">
                                <Compass className="w-4 h-4 text-[#8553d1]" />
                                <span>¿Cómo funciona?</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed m-0">
                                Puedes preguntar por títulos específicos, pedir sugerencias basadas en tus autores preferidos o consultar temas para tus estudios.
                            </p>
                        </div>
                    </div>

                    {/* ── Área de Chat ───────────────────────────────── */}
                    <div className="lg:col-span-3 flex flex-col h-[650px] bg-white rounded-3xl border border-purple-100 shadow-xl overflow-hidden">

                        {/* Header del Chat */}
                        <div className="px-6 py-4 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 border-b border-purple-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#8553d1] flex items-center justify-center text-white shadow-md">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-800 m-0">Bibliotecario IA</h2>
                                    <p className="text-xs text-gray-500 m-0">Responde al instante con recomendaciones del catálogo</p>
                                </div>
                            </div>
                        </div>

                        {user ? (
                            <BibliotecarioChat />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3d5bcf] to-[#c765dc] flex items-center justify-center text-white shadow-md">
                                    <LogIn className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">
                                        Inicia sesión para chatear con el bibliotecario
                                    </p>
                                    <p className="text-xs text-gray-400 max-w-sm">
                                        El asistente conoce tu biblioteca para recomendarte según lo que ya has leído.
                                    </p>
                                </div>
                                <a
                                    href="/Login"
                                    className="px-6 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] hover:opacity-90 transition-all"
                                >
                                    Iniciar sesión
                                </a>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
