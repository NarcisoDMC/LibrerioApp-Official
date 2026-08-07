'use client';

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

export const AuthNavLinks = [
    { name: "Iniciar Sesión", href: "/Login" },
    { name: "Registrarse", href: "/Registro" },
];

export default function NavLinksComponent() {
    const pathname = usePathname();

    return (
        <>
            {AuthNavLinks.map((tab) => {
                const isActive = pathname === tab.href;

                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={clsx("border-none rounded-[30px] cursor-pointer font-medium text-[0.95rem] px-4 py-2 whitespace-nowrap transition-all duration-300 hover:scale-[1.02] active:shadow-[0_2px_0_10px_rgba(129,19,255,0.10)] active:scale-[0.98] max-md:text-sm max-md:px-[0.85rem] max-md:py-[0.45rem]",
                            {
                                "bg-violet-700 text-white": isActive,
                                "bg-[#f1e6f9] text-[#8553d1]": !isActive,
                            }
                        )}
                    >
                        {tab.name}
                    </Link>
                )
            })}
        </>
    )
}