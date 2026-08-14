'use client'

import Link from "next/link"
import Image from "next/image"
import NavLinks from "./Nav-links"
import { Search, User, LogOut, Loader2 } from "lucide-react"
import NavBottom from "@/app/ui/Components/NavBottom"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Navbar() {
    const { user, initializing, logout } = useAuth();
    const router = useRouter();
    const [query, setQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        router.push(`/busqueda?q=${encodeURIComponent(q)}`);
    };

    return (

        <>
            {/* ── Encabezado principal (shell del navbar) ───────── */}
            <header className="w-full font-sans relative z-50">

                {/* ── Fila superior: Logo + Buscador + Auth ──────── */}
                <div className="
                w-full bg-white px-8 py-3
                flex items-center justify-between gap-4
                border-b-[3px] border-violet-700
                rounded-bl-[20px] rounded-br-[20px]
                relative z-10
                max-sm:px-4 max-sm:py-2 max-sm:gap-3
            ">

                    {/* ── Logo clickeable ──────────────────────────── */}
                    <Link href="/" className="flex-shrink-0 cursor-pointer">
                        <Image
                            src="/Librerio/Librerio-Logo.png"
                            alt="Librerio Logo"
                            width={207}
                            height={126}
                            priority
                            className="h-12 w-auto object-contain max-md:h-9 max-[380px]:h-8"
                        />
                    </Link>

                    {/* ── Barra de búsqueda con icono */}
                    <div className="
                        flex flex-1 max-w-[42rem] mx-4
                        relative items-center gap-4
                        max-md:mx-0 max-md:max-w-none max-md:gap-3
                        max-[560px]:mx-0 max-[560px]:gap-0
                    ">
                        {/* Icono de búsqueda (decorativo) */}
                        <div className="
                            absolute left-4 text-[#8553d1]
                            flex items-center pointer-events-none
                            max-[560px]:absolute max-[560px]:
                        ">
                            <Search size={20} />
                        </div>

                        {/* Input de texto */}
                        <form onSubmit={handleSearch} className="w-full flex items-center">
                        <input
                            type="search"
                            placeholder="Buscar libros, autores, temas…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            enterKeyHint="search"
                            className="
                            w-full bg-[#f1e6f9] text-gray-700
                            rounded-full py-[0.6rem] pr-4 pl-12
                            border border-transparent outline-none
                            text-base transition-all duration-300
                            focus:bg-white focus:border-[rgba(133,83,209,0.5)]
                            focus:shadow-[0_0_0_2px_rgba(133,83,209,0.2)]
                            max-md:text-sm
                            "
                        />
                        </form>
                    </div>

                    {/* ── Botones de autenticación ─────────────────── */}
                    <div className="flex-shrink-0 max-md:hidden">
                        {initializing ? (
                            <div className="flex items-center gap-2 text-[#8553d1]">
                                <Loader2 size={20} className="animate-spin" />
                            </div>
                        ) : user ? (
                            <div className="flex items-center gap-3 font-medium text-base">
                                <span className="max-w-40 truncate text-sm text-[#8553d1]">
                                    {user.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => void logout()}
                                    className="
                                        flex items-center gap-2 text-[#8553d1] bg-[#f1e6f9] border-none
                                        rounded-[30px] cursor-pointer font-medium
                                        text-[0.95rem] px-4 py-2 whitespace-nowrap
                                        transition-all duration-300
                                        hover:bg-[#edd4ff] hover:scale-[1.02]
                                        active:scale-[0.98]
                                    "
                                >
                                    <LogOut size={16} />
                                    Cerrar Sesión
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 font-medium text-base">
                                {/* Botón Iniciar Sesión */}
                                <Link href="/Login" className="
                            text-white bg-violet-700 border-none
                            rounded-[30px] cursor-pointer font-medium
                            text-[0.95rem] px-4 py-2 whitespace-nowrap
                            transition-all duration-300
                            hover:bg-violet-600 hover:scale-[1.02]
                            active:shadow-[0_2px_0_10px_rgba(129,19,255,0.10)] active:scale-[0.98]
                            max-md:text-sm max-md:px-[0.85rem] max-md:py-[0.45rem]
                            ">
                                    Iniciar Sesión
                                </Link>

                                {/* Botón Registrarse (oculto en tablet) */}
                                <Link href="/Registro" className="
                            text-[#8553d1] bg-[#f1e6f9] border-none
                            rounded-[30px] cursor-pointer font-medium
                            text-[0.95rem] px-4 py-2 whitespace-nowrap
                            transition-all duration-300
                            hover:bg-[#edd4ff] hover:scale-[1.02]
                            active:shadow-[0_2px_0_10px_rgba(202,155,255,0.1)] active:scale-[0.98]
                            max-md:hidden
                            ">
                                    Registrarse
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ── Boton desplegable (Toggle-Menu Button) ─────────────────── */}
                    <div className="flex-shrink-0 max-md:block hidden">
                        {user ? (
                            <button
                                type="button"
                                onClick={() => void logout()}
                                title={`Cerrar sesión (${user.name})`}
                                className="
                                text-[#8553d1] border-none
                                rounded-[30px] cursor-pointer font-medium
                                text-[0.95rem] px-4 py-2 whitespace-nowrap
                                transition-all duration-300
                                hover:bg-[#f1e6f9] hover:scale-[1.02]
                                active:bg-[#f1e6f9] active:scale-[0.98]
                                "
                            >
                                <LogOut size={25} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="
                                text-[#8553d1] border-none
                                rounded-[30px] cursor-pointer font-medium
                                text-[0.95rem] px-4 py-2 whitespace-nowrap
                                transition-all duration-300
                                hover:bg-[#f1e6f9] hover:scale-[1.02]
                                active:bg-[#f1e6f9]
                                active:shadow-[0_2px_0_10px_rgba(202,155,255,0.1)] active:scale-[0.98]
                                max-md:text-sm max-md:px-[0.85rem] max-md:py-[0.45rem]
                            "
                            >

                                <Link href="/Login">
                                    <User size={25} />
                                </Link>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Fila inferior: Pestañas de navegación ──────── */}
                <div className="
                    w-full px-8 pb-4 max-md:hidden
                ">
                    <div className="
                    w-full h-12 flex items-center px-8
                    bg-gradient-to-r from-[#9b99b5] via-[#a2a3bf] to-[#a09cbb]
                    rounded-bl-[2rem] rounded-br-[2rem]
                    shadow-sm box-border
                    ">
                        {/* Nav con pestañas */}
                        <nav
                            className="
                        flex items-center justify-center
                        w-full h-full relative z-20
                        "
                            aria-label="Navegación secundaria"
                        >
                            <NavLinks />
                        </nav>
                    </div>
                </div>


            </header>

            <NavBottom />
        </>
    )
}
