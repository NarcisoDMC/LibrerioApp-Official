'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { motion } from "motion/react"
import { Book, BotMessageSquare, Library, UsersRound } from "lucide-react"

/* Links de navegación */
const NavLinks = [
    { name: "Explorar", href: "/", icon: Book },
    { name: "Bibliotecario", href: "/Bibliotecario", icon: BotMessageSquare },
    { name: "Mi Biblioteca", href: "/Mi-Biblioteca", icon: Library },
    { name: "Comunidad", href: "/Comunidad", icon: UsersRound },
];

export default function NavLinksComponent() {
    const pathname = usePathname();

    return (
        <>
            {NavLinks.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={clsx(
                            "relative flex items-center justify-center rounded-b-3xl h-full px-4 border-none cursor-pointer transition-colors duration-300 max-[900px]:px-4 max-[900px]:text-[0.9rem] max-md:flex-1 max-md:min-w-0 max-md:px-1 max-md:text-[0.82rem] max-[560px]:text-[0.78rem] max-[380px]:text-[0.72rem]",
                            {
                                "text-[#5939b8]": isActive,
                                "text-white": !isActive,
                            },
                        )}
                    >

                        <span className="z-10 gap-2 flex max-md:flex-col items-center tracking-wide max-[560px]:tracking-normal max-[560px]:gap-1 max-md:max-w-full max-md:min-w-0 max-md:overflow-hidden">
                            <Icon className="w-6 h-6 shrink-0 max-md:w-5 max-md:h-5" />
                            <span className="max-md:truncate max-md:max-w-full">{tab.name}</span>
                        </span>
                        
                        {isActive && (
                            <motion.div
                                className="absolute px-18 max-[900px]:px-16 max-md:px-[42px] py-6 max-md:pt-9 max-md:pb-10 bg-gradient-to-r from-slate-200/50 to-white/80 rounded-b-3xl max-md:rounded-t-3xl max-md:rounded-b-none z-0 shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-[#e8dbfc]"
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </Link>
                )
            })}
        </>
    )
}
