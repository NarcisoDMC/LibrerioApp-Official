"use client";

import AuthSelector from "@/app/ui/Login/AuthSelector"
import Navbar from "@/app/ui/Login/Navbar";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { playfairdisplay } from "@/app/fonts";
import { Star, BookOpen, User, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import TypeWriter from "@/app/ui/Components/TypeWriter";
import { STARS } from "@/app/(Auth)/stars";

export default function RegistroPage() {
    const router = useRouter();

    const handleNavigateToLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        router.push("/Login");
    };

    return (
        <div className="min-h-screen flex flex-col md:overflow-hidden">
            <Navbar />
            {/* ── Selector de tipo de Autenticacion (Solo Movil) ──── */}
            <AuthSelector/>
            <AnimatePresence mode="wait">
            <motion.div
                key="registro-page"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col flex-1"
            >

                {/* ── Contenedor principal ──────────────────────────── */}
                <div className="flex flex-1 justify-center items-start pt-3 pb-10 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
                        className="relative flex items-center justify-between w-full max-w-3xl min-h-[700px] rounded-2xl overflow-hidden px-8 py-10"
                        style={{
                            background: "linear-gradient(135deg, #9333ea 0%, #c026d3 50%, #f0abfc 100%)",
                        }}
                    >
                        {/* ── Estrellas flotantes animadas (lado izquierdo) ── */}
                        {STARS.map((star) => (
                            <motion.div
                                key={star.id}
                                className="absolute pointer-events-none"
                                style={{ left: star.x, top: star.y }}
                                animate={{
                                    y: [0, -10, 0],
                                    opacity: [0.7, 1, 0.7],
                                    rotate: [0, 15, -15, 0],
                                }}
                                transition={{
                                    duration: star.duration,
                                    delay: star.delay,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Star
                                    size={star.size}
                                    className="text-white"
                                    fill={star.filled ? "white" : "none"}
                                    strokeWidth={star.filled ? 0 : 1.5}
                                />
                            </motion.div>
                        ))}

                        {/* ── Título decorativo ─────────────────────────── */}
                        <motion.div
                            className={`${playfairdisplay.className} absolute top-10 left-0 right-0 text-center text-white font-semibold text-3xl tracking-wide`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <TypeWriter
                                options={{
                                strings: ['Comienza con la magia', 'Comienza en tu próxima lectura', 'Comienza tu aventura literaria'],
                                autoStart: true,
                                loop: true,
                                deleteSpeed: 'natural',
                                }}
                            />
                        </motion.div>

                        {/* ── Formulario de Registro ────────────────────── */}
                        <motion.div
                            className="relative z-10 w-full max-w-sm mx-auto mt-6"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                                {/* Cabecera del form */}
                                <div className="px-7 pt-6 pb-4">
                                    <h2 className="text-center text-violet-700 font-semibold text-lg mb-4">
                                        Registrar nueva cuenta
                                    </h2>

                                    {/* Botón Google */}
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 mb-4 shadow-sm"
                                    >
                                        <span>Registrarse con Google</span>
                                        {/* SVG Google colorido */}
                                        <svg width="20" height="20" viewBox="0 0 48 48">
                                            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.5 3.06 29.55 1 24 1 14.82 1 7.01 6.49 3.68 14.24l7.1 5.51C12.43 13.46 17.74 9.5 24 9.5z"/>
                                            <path fill="#4285F4" d="M46.52 24.5c0-1.62-.15-3.18-.42-4.68H24v8.85h12.7c-.55 2.95-2.2 5.44-4.68 7.12l7.18 5.58C43.38 37.32 46.52 31.34 46.52 24.5z"/>
                                            <path fill="#FBBC05" d="M10.78 28.25A14.56 14.56 0 0 1 9.5 24c0-1.48.25-2.91.68-4.25l-7.1-5.51A23.93 23.93 0 0 0 .5 24c0 3.87.93 7.52 2.58 10.73l7.7-6.48z"/>
                                            <path fill="#34A853" d="M24 47c5.55 0 10.21-1.84 13.62-4.99l-7.18-5.58c-1.84 1.23-4.18 1.96-6.44 1.96-6.26 0-11.57-3.97-13.22-9.4l-7.7 6.48C7.01 41.51 14.82 47 24 47z"/>
                                            <path fill="none" d="M0 0h48v48H0z"/>
                                        </svg>
                                    </button>

                                    {/* Separador */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex-1 h-px bg-gray-300" />
                                        <span className="text-gray-400 text-xs">o</span>
                                        <div className="flex-1 h-px bg-gray-300" />
                                    </div>

                                    {/* Campo Nombre de Usuario */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="registro-username"
                                            className="block text-violet-600 text-xs font-medium mb-1 pl-1"
                                        >
                                            Nombre de Usuario
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="registro-username"
                                                className="w-full bg-fuchsia-200/60 rounded-full py-2.5 pl-4 pr-10 text-sm text-gray-700 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all duration-300"
                                            />
                                            <User
                                                size={16}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fuchsia-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Campo Email */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="registro-email"
                                            className="block text-violet-600 text-xs font-medium mb-1 pl-1"
                                        >
                                            Correo Electrónico
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                id="registro-email"
                                                className="w-full bg-fuchsia-200/60 rounded-full py-2.5 pl-4 pr-10 text-sm text-gray-700 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all duration-300"
                                            />
                                            <Mail
                                                size={16}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fuchsia-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Campo Contraseña */}
                                    <div className="mb-4">
                                        <label
                                            htmlFor="registro-password"
                                            className="block text-violet-600 text-xs font-medium mb-1 pl-1"
                                        >
                                            Contraseña
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                id="registro-password"
                                                className="w-full bg-fuchsia-200/60 rounded-full py-2.5 pl-4 pr-10 text-sm text-gray-700 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all duration-300"
                                            />
                                            <Lock
                                                size={16}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fuchsia-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Botón Submit */}
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full py-2.5 rounded-full text-white font-semibold text-sm"
                                        style={{
                                            background: "linear-gradient(90deg, #3157cd 0%, #7c3aed 50%, #af58d8 100%)",
                                        }}
                                    >
                                        Iniciar Sesión
                                    </motion.button>
                                </div>

                                {/* Footer del card */}
                                <div className="bg-gray-50 py-3 text-center border-t border-gray-100">
                                    <p className="text-gray-400 text-xs">Secured by Clerk</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        ¿Ya tienes cuenta?{" "}
                                        <Link
                                            href="/Login"
                                            onClick={handleNavigateToLogin}
                                            className="text-violet-600 font-medium hover:text-violet-800 transition-colors"
                                        >
                                            Inicia sesión
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Libro decorativo (derecha) ────────────────── */}
                        <motion.div
                            className="absolute right-6 bottom-8 pointer-events-none"
                            animate={{
                                y: [0, -8, 0],
                                rotate: [0, 2, -2, 0],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <BookOpen
                                strokeWidth={0.7}
                                size={130}
                                className="text-white/25"
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
            </AnimatePresence>
        </div>
    );
}