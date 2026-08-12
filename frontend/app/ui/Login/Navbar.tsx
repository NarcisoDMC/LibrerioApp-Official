import Link from "next/link"
import Image from "next/image"
import NavLinks from "./Nav-links"

export default function Navbar() {
    return (
        /* ── Encabezado principal (shell del navbar) ───────── */
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

                {/* ── Botones de autenticación ─────────────────── */}
                <div className="flex-shrink-0 max-[560px]:hidden">
                    <div className="flex items-center gap-3 font-medium text-base">
                        <NavLinks />
                    </div>
                </div>
            </div>
        </header>
    )
}
