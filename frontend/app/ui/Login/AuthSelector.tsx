import Link from "next/link";
import { AuthNavLinks } from "./Nav-links"
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function AuthSelector() {
    const pathname = usePathname();

    return (
        <>
            {/* ── Selector de tipo de Autenticacion (Solo Movil) ──────────────────────────── */}
                <div className="relative flex justify-center mt-8 md:hidden rounded-xl">
                    {AuthNavLinks.map((tab) => {
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={clsx("border-none rounded-xl cursor-pointer font-medium text-[0.95rem] px-4 py-2 whitespace-nowrap transition-all duration-300 hover:scale-[1.02] active:shadow-[0_2px_0_10px_rgba(129,19,255,0.10)] active:scale-[0.98] max-md:text-sm max-md:px-[0.85rem] max-md:py-[0.45rem]",
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
                </div>
        </>
    )
}