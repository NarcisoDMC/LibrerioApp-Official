"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Copy, ExternalLink, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import type { ChatStoredMessage } from "@/lib/types";
import MarkdownContent from "./MarkdownContent";

// ── Burbuja individual del chat del Bibliotecario IA ────────────────────────
// Texto markdown + chips de ficha (rutas internas de la app) + acciones al
// pasar el ratón: copiar, regenerar (solo asistente) y eliminar.

type Props = {
    message: ChatStoredMessage;
    regenerating: boolean;
    onRegenerate: (messageId: string) => void;
    onDelete: (messageId: string) => void;
};

export default function ChatMessageBubble({ message, regenerating, onRegenerate, onDelete }: Props) {
    const [copied, setCopied] = useState(false);

    const isAssistant = message.role === "assistant";

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            // portapapeles no disponible: se ignora silenciosamente
        }
    };

    return (
        <div className={`flex gap-3 group ${isAssistant ? "justify-start" : "justify-end"}`}>
            {isAssistant && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#8553d1] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4" />
                </div>
            )}

            <div
                className={`max-w-[85%] px-4 py-3 rounded-3xl text-sm leading-relaxed ${
                    isAssistant
                        ? "bg-white border border-purple-100 text-gray-700 rounded-bl-md shadow-sm"
                        : "bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] text-white rounded-br-md"
                }`}
            >
                {isAssistant ? (
                    <>
                        <MarkdownContent content={message.content} />
                        {message.enlaces && message.enlaces.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-purple-100">
                                {message.enlaces.map((link) =>
                                    // Rutas internas de la app (p. ej. /libro/{olid}):
                                    // navegación SPA con Link; las externas (defensivo,
                                    // no deberían llegar del backend) abren en pestaña nueva
                                    link.url.startsWith("/") ? (
                                        <Link
                                            key={link.url}
                                            href={link.url}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f1e6f9] text-[#8553d1] text-xs font-semibold hover:bg-[#edd4ff] transition-colors"
                                        >
                                            <BookOpen size={12} />
                                            {link.titulo}
                                        </Link>
                                    ) : (
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
                                    ),
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="whitespace-pre-line">{message.content}</p>
                )}
            </div>

            {/* Acciones al hover: copiar / regenerar / eliminar */}
            {message.content.trim().length > 0 && (
                <div className="hidden group-hover:flex items-center gap-0.5 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={() => void copy()}
                        aria-label="Copiar mensaje"
                        className="p-1.5 rounded-lg bg-white border border-purple-100 text-gray-400 hover:text-[#8553d1] hover:bg-purple-50 shadow-sm cursor-pointer"
                    >
                        {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                    {isAssistant && (
                        <button
                            type="button"
                            onClick={() => onRegenerate(message.id)}
                            disabled={regenerating}
                            aria-label="Regenerar respuesta"
                            className="p-1.5 rounded-lg bg-white border border-purple-100 text-gray-400 hover:text-[#8553d1] hover:bg-purple-50 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            {regenerating ? (
                                <Loader2 size={13} className="animate-spin text-[#8553d1]" />
                            ) : (
                                <RefreshCw size={13} />
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onDelete(message.id)}
                        aria-label="Eliminar mensaje"
                        className="p-1.5 rounded-lg bg-white border border-purple-100 text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm cursor-pointer"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            )}
        </div>
    );
}