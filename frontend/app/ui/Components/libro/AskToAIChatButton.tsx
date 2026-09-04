"use client";

import { BotMessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"; //Importamos useRouter para redirigir al usuario a la página de login si no está autenticado
import { useAuth } from "@/lib/auth-context"; //Importamos useAuth para obtener el estado de autenticación del usuario

export default function AskToAIChatButton({olid, title}: {olid: string, title: string}) {
    const router = useRouter();
    const { user } = useAuth();


    const handleAskToAIChat = () => {
        if (!user) {
            router.push("/Login");
        } else {
            router.push(`/Bibliotecario?bookTitle=${encodeURIComponent(title)}&bookId=${olid}`);
        }
    };

    return (
        <>
            <div className="relative items-center justify-center">
                <h1
                    className="font-semibold text-gray-500"
                >
                    ¿Deseas saber más?
                </h1>
                <button
                    type="button"
                    onClick = {() => void handleAskToAIChat()}
                    
                    className="flex items-center justify-center gap-2 px-6 py-3 mb-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] hover:opacity-90 hover:scale-[1.02] transition-all"
                >
                    <BotMessageSquare size={20}/>
                    Consulta al bibliotecario
                </button>
            </div>
        </>
    );
}