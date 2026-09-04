"use client";

import { useState } from "react";
import { AlertTriangle, Check, Loader2, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import type { ChatSummary } from "@/lib/types";

// ── Sidebar de conversaciones del Bibliotecario IA ──────────────────────────
// Lista de chats (más reciente primero), crear, renombrar en línea y borrar
// con modal de confirmación responsivo (evita borrados accidentales).

type Props = {
    chats: ChatSummary[];
    activeChatId: string | null;
    loading: boolean;
    onSelect: (chatId: string) => void;
    onNewChat: () => void;
    onRename: (chatId: string, title: string) => Promise<void>;
    onDelete: (chatId: string) => Promise<void>;
    // clases extra del contenedor (el mismo componente se usa en la card de
    // desktop y dentro del drawer móvil, con estilos distintos)
    className?: string;
};

function timeLabel(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "ahora";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays} d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function ChatConversationList({
    chats,
    activeChatId,
    loading,
    onSelect,
    onNewChat,
    onRename,
    onDelete,
    className = "",
}: Props) {
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [deletingChat, setDeletingChat] = useState<ChatSummary | null>(null);
    const [deleting, setDeleting] = useState(false);

    const startRename = (chat: ChatSummary) => {
        setRenamingId(chat.id);
        setRenameValue(chat.title);
    };

    const commitRename = async (chatId: string) => {
        const title = renameValue.trim();
        setRenamingId(null);
        if (!title) return;
        try {
            await onRename(chatId, title);
        } catch {
            // el error se muestra en el contenedor; aquí solo se cierra el editor
        }
    };

    const confirmDelete = async () => {
        if (!deletingChat) return;
        setDeleting(true);
        try {
            await onDelete(deletingChat.id);
        } catch {
            // el error se muestra en el contenedor
        } finally {
            setDeleting(false);
            setDeletingChat(null);
        }
    };

    return (
        <aside className={`flex flex-col h-full overflow-hidden ${className}`}>
            <div className="p-3 border-b border-purple-100">
                <button
                    type="button"
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc] text-white text-xs font-semibold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                    <MessageSquarePlus size={14} />
                    Nueva conversación
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading && chats.length === 0 && (
                    <div className="flex justify-center py-6">
                        <Loader2 size={18} className="animate-spin text-[#8553d1]" />
                    </div>
                )}

                {!loading && chats.length === 0 && (
                    <p className="px-3 py-6 text-center text-xs text-gray-400">
                        Aún no tienes conversaciones.
                    </p>
                )}

                {chats.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    const isRenaming = renamingId === chat.id;

                    if (isRenaming) {
                        return (
                            <div
                                key={chat.id}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white border border-purple-200"
                            >
                                <input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void commitRename(chat.id);
                                        if (e.key === "Escape") setRenamingId(null);
                                    }}
                                    maxLength={80}
                                    autoFocus
                                    className="flex-1 min-w-0 bg-transparent text-xs text-gray-700 outline-none border-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => void commitRename(chat.id)}
                                    aria-label="Guardar título"
                                    className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRenamingId(null)}
                                    aria-label="Cancelar"
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={chat.id}
                            className={`group flex items-center gap-1 px-2 py-1.5 rounded-xl cursor-pointer transition-colors ${
                                isActive
                                    ? "bg-[#f1e6f9] text-[#4a348c]"
                                    : "text-gray-600 hover:bg-purple-50"
                            }`}
                            onClick={() => onSelect(chat.id)}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-medium leading-tight">
                                    {chat.title}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    {timeLabel(chat.updatedAt)}
                                </p>
                            </div>

                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startRename(chat);
                                    }}
                                    aria-label="Renombrar"
                                    className="p-1 rounded-md text-gray-400 hover:text-[#8553d1] hover:bg-purple-100 cursor-pointer"
                                >
                                    <Pencil size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingChat(chat);
                                    }}
                                    aria-label="Eliminar conversación"
                                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Modal de confirmación de borrado ──────────────────── */}
            {deletingChat && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => !deleting && setDeletingChat(null)}
                >
                    <div
                        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icono de advertencia */}
                        <div className="flex justify-center pt-6 pb-2">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertTriangle size={28} className="text-red-500" />
                            </div>
                        </div>

                        {/* Contenido */}
                        <div className="px-6 pb-2 text-center">
                            <h3 className="text-base font-bold text-gray-800">
                                Eliminar conversación
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                                ¿Seguro que quieres eliminar{" "}
                                <span className="font-semibold text-gray-700">
                                    &ldquo;{deletingChat.title}&rdquo;
                                </span>
                                ? Esta acción no se puede deshacer y se perderán todos los mensajes.
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 px-6 py-5">
                            <button
                                type="button"
                                onClick={() => setDeletingChat(null)}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmDelete()}
                                disabled={deleting}
                                className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Eliminando…
                                    </>
                                ) : (
                                    "Eliminar"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
