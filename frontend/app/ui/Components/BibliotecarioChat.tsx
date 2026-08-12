"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ExternalLink, Loader2, Send, Sparkles } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import type { ChatLink, ChatMessage, ChatResponse } from "@/lib/types";
import MarkdownContent from "@/app/ui/Components/MarkdownContent";

const SESSION_KEY = "librerio.bibliotecario.session";
const MAX_HISTORY = 12; // el backend rechaza historiales más largos

const SUGGESTIONS = [
    "Recomiéndame un libro de fantasía",
    "¿Qué leo después de…? Ayúdame a decidir",
    "Los mejores libros de ciencia ficción",
    "Dónde comprar o pedir prestado un libro",
];

// Mensaje local: rol + texto (+ enlaces opcionales de la respuesta del bot)
type LocalMessage = ChatMessage & { enlaces?: ChatLink[] };

function loadSession(): LocalMessage[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.sessionStorage.getItem(SESSION_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as LocalMessage[];
        return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
    } catch {
        return [];
    }
}

// El historial que viaja al backend solo lleva role/content (zod del servidor)
function toApiMessages(messages: LocalMessage[]): ChatMessage[] {
    return messages.map(({ role, content }) => ({ role, content }));
}

export default function BibliotecarioChat() {
    const [messages, setMessages] = useState<LocalMessage[]>(loadSession);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        try {
            window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
        } catch {
            // almacenamiento lleno/inaccesible: la sesión simplemente no persiste
        }
    }, [messages]);

    const send = async (text: string) => {
        const content = text.trim();
        if (!content || loading) return;
        setError(null);

        const history: LocalMessage[] = [...messages, { role: "user", content }];
        setMessages(history);
        setInput("");
        setLoading(true);

        try {
            const response = await apiPost<ChatResponse>("/api/bibliotecario/chat", {
                messages: toApiMessages(history).slice(-MAX_HISTORY),
            });
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: response.respuesta, enlaces: response.enlaces },
            ]);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "No se pudo contactar con el asistente";
            const status = err instanceof Error && "status" in err ? (err as { status: number }).status : undefined;
            setError(status === 429 ? "Has llegado al límite de consultas, espera un rato." : msg);
            // el mensaje del usuario se descarta: el backend no lo procesó
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#faf8fc]/50 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-5 text-center">
                        <div className="text-gray-400">
                            <Bot className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                            <p className="text-sm font-medium">Pregúntale cualquier cosa sobre libros</p>
                            <p className="text-xs mt-1">
                                Recomendaciones, autores, sagas, dónde conseguir tus lecturas.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 max-w-md">
                            {SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => void send(suggestion)}
                                    className="px-4 py-2 rounded-full bg-white border border-purple-200 text-xs font-medium text-[#8553d1] hover:bg-[#f6efff] hover:border-[#8553d1] transition-all cursor-pointer"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {message.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#8553d1] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                            )}
                            <div
                                className={`max-w-[85%] px-4 py-3 rounded-3xl text-sm leading-relaxed ${
                                    message.role === "user"
                                        ? "bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] text-white rounded-br-md"
                                        : "bg-white border border-purple-100 text-gray-700 rounded-bl-md shadow-sm"
                                }`}
                            >
                                {message.role === "user" ? (
                                    <p className="whitespace-pre-line">{message.content}</p>
                                ) : (
                                    <>
                                        <MarkdownContent content={message.content} />
                                        {message.enlaces && message.enlaces.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-purple-100">
                                                {message.enlaces.map((link) => (
                                                    <a
                                                        key={link.url}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f1e6f9] text-[#8553d1] text-xs font-semibold hover:bg-[#edd4ff] transition-colors"
                                                    >
                                                        <ExternalLink size={12} />
                                                        {link.titulo}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#8553d1] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-purple-100 rounded-3xl rounded-bl-md px-5 py-4 shadow-sm flex items-center gap-1.5">
                            <Loader2 size={16} className="animate-spin text-[#8553d1]" />
                            <span className="text-xs font-medium text-gray-400">Consultando el catálogo…</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Errores */}
            {error && (
                <div className="px-5 pb-1">
                    <p className="px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                        {error}
                    </p>
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-purple-100">
                <div className="flex items-center gap-2 bg-purple-50/60 p-1.5 rounded-full border border-purple-200/80">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void send(input);
                            }
                        }}
                        maxLength={2000}
                        placeholder="Escribe tu duda o consulta de libros..."
                        disabled={loading}
                        className="flex-1 bg-transparent px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none border-none font-sans disabled:opacity-60"
                    />
                    <button
                        type="button"
                        onClick={() => void send(input)}
                        disabled={loading || !input.trim()}
                        aria-label="Enviar mensaje"
                        className="
                            w-10 h-10 rounded-full
                            bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc]
                            text-white flex items-center justify-center
                            shadow-md disabled:opacity-40 transition-all hover:opacity-90 cursor-pointer
                        "
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </div>
        </>
    );
}