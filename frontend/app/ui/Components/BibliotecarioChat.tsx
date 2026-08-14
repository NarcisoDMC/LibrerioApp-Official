"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Loader2, MessagesSquare, Send } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { ChatDetail, ChatReply, ChatStoredMessage, ChatSummary } from "@/lib/types";
import ChatConversationList from "./ChatConversationList";
import ChatMessageBubble from "./ChatMessageBubble";

// ── Chat del Bibliotecario IA (con historial persistente) ──────────────────
// Las conversaciones viven en el servidor: este componente solo las lista,
// las abre y envía mensajes. Sin almacenamiento local de historial.

const SUGGESTIONS = [
    "Recomiéndame un libro de fantasía",
    "¿Qué leo después de…? Ayúdame a decidir",
    "Los mejores libros de ciencia ficción",
    "Dónde comprar o pedir prestado un libro",
];

function toErrorMessage(err: unknown): string {
    if (err instanceof Error) {
        const status = "status" in err ? (err as { status: number }).status : undefined;
        return status === 429
            ? "Has llegado al límite de consultas, espera un rato."
            : err.message;
    }
    return "No se pudo contactar con el asistente";
}

export default function BibliotecarioChat() {
    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatStoredMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        void loadInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, loading]);

    // Carga inicial: limpia el almacenamiento local antiguo (la fuente de
    // verdad ahora es el servidor) y abre la conversación más reciente
    async function loadInitial(): Promise<void> {
        try {
            window.sessionStorage.removeItem("librerio.bibliotecario.session");
        } catch {
            // almacenamiento inaccesible: irrelevante, el historial ya no vive ahí
        }
        try {
            const list = await apiGet<ChatSummary[]>("/api/bibliotecario/chats");
            setChats(list);
            if (list.length > 0) {
                await openChat(list[0].id, list);
            }
        } catch (err) {
            setError(toErrorMessage(err));
        } finally {
            setLoadingChats(false);
        }
    }

    async function openChat(chatId: string, currentList?: ChatSummary[]): Promise<void> {
        setActiveChatId(chatId);
        setDrawerOpen(false);
        setError(null);
        try {
            const detail = await apiGet<ChatDetail>(`/api/bibliotecario/chats/${chatId}`);
            setMessages(detail.messages);
            if (currentList) setChats(currentList);
        } catch (err) {
            setError(toErrorMessage(err));
        }
    }

    function startNewChat(): void {
        setActiveChatId(null);
        setMessages([]);
        setError(null);
        setDrawerOpen(false);
    }

    // Primer mensaje de una conversación: crea el chat y muestra la respuesta
    async function createChatAndAsk(content: string): Promise<void> {
        setLoading(true);
        setError(null);
        try {
            const reply = await apiPost<ChatReply>("/api/bibliotecario/chats", { content });
            const list = await apiGet<ChatSummary[]>("/api/bibliotecario/chats");
            setChats(list);
            const detail = await apiGet<ChatDetail>(`/api/bibliotecario/chats/${reply.chatId}`);
            setActiveChatId(reply.chatId);
            setMessages(detail.messages);
        } catch (err) {
            setError(toErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function send(text: string): Promise<void> {
        const content = text.trim();
        if (!content || loading) return;

        if (!activeChatId) {
            await createChatAndAsk(content);
            setInput("");
            return;
        }

        setInput("");
        setError(null);
        setLoading(true);

        // optimista: el mensaje del usuario aparece al instante y se reemplaza
        // por los reales de la BD al responder el modelo
        const optimisticId = `local-${Date.now()}`;
        setMessages((prev) => [
            ...prev,
            {
                id: optimisticId,
                seq: Number.MAX_SAFE_INTEGER,
                role: "user",
                content,
                createdAt: new Date().toISOString(),
            },
        ]);

        try {
            await apiPost<ChatReply>(`/api/bibliotecario/chats/${activeChatId}/messages`, { content });
            const detail = await apiGet<ChatDetail>(`/api/bibliotecario/chats/${activeChatId}`);
            setMessages(detail.messages);
            // el chat activo vuelve arriba en el listado
            const now = new Date().toISOString();
            setChats((prev) =>
                prev
                    .map((c) => (c.id === activeChatId ? { ...c, updatedAt: now } : c))
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
            );
        } catch (err) {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
            setError(toErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function regenerate(messageId: string): Promise<void> {
        if (!activeChatId || regeneratingId) return;
        setRegeneratingId(messageId);
        setError(null);
        try {
            await apiPost<ChatReply>(
                `/api/bibliotecario/chats/${activeChatId}/messages/${messageId}/regenerate`,
            );
            // el backend reemplaza y trunca: se recarga el chat para ser exactos
            const detail = await apiGet<ChatDetail>(`/api/bibliotecario/chats/${activeChatId}`);
            setMessages(detail.messages);
        } catch (err) {
            setError(toErrorMessage(err));
        } finally {
            setRegeneratingId(null);
        }
    }

    async function deleteMessage(messageId: string): Promise<void> {
        if (!activeChatId) return;
        setError(null);
        try {
            await apiDelete(`/api/bibliotecario/chats/${activeChatId}/messages/${messageId}`);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
        } catch (err) {
            setError(toErrorMessage(err));
        }
    }

    async function deleteChat(chatId: string): Promise<void> {
        setError(null);
        try {
            await apiDelete(`/api/bibliotecario/chats/${chatId}`);
            const list = await apiGet<ChatSummary[]>("/api/bibliotecario/chats");
            setChats(list);
            if (activeChatId === chatId) {
                setActiveChatId(null);
                setMessages([]);
                setDrawerOpen(false);
            }
        } catch (err) {
            setError(toErrorMessage(err));
        }
    }

    async function renameChat(chatId: string, title: string): Promise<void> {
        setError(null);
        try {
            const updated = await apiPatch<ChatSummary>(`/api/bibliotecario/chats/${chatId}`, { title });
            setChats((prev) => prev.map((c) => (c.id === chatId ? updated : c)));
        } catch (err) {
            setError(toErrorMessage(err));
        }
    }

    const showWelcome = messages.length === 0 && !activeChatId;
    const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

    return (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 lg:gap-5">
            {/* ── Sidebar de conversaciones (desktop) ─────────────── */}
            <div className="hidden lg:flex w-64 xl:w-72 shrink-0 min-h-0">
                <div className="flex-1 min-h-0 bg-white rounded-3xl border border-purple-100 shadow-xl overflow-hidden">
                    <ChatConversationList
                        chats={chats}
                        activeChatId={activeChatId}
                        loading={loadingChats}
                        onSelect={(id) => void openChat(id)}
                        onNewChat={startNewChat}
                        onRename={renameChat}
                        onDelete={deleteChat}
                    />
                </div>
            </div>

            {/* ── Drawer móvil de conversaciones ──────────────────── */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <motion.div
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ type: "spring", stiffness: 320, damping: 32 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl lg:hidden"
                        >
                            <ChatConversationList
                                chats={chats}
                                activeChatId={activeChatId}
                                loading={loadingChats}
                                onSelect={(id) => void openChat(id)}
                                onNewChat={startNewChat}
                                onRename={renameChat}
                                onDelete={deleteChat}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Panel del chat ───────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col bg-white rounded-3xl border border-purple-100 shadow-xl overflow-hidden">
                {/* Header del chat */}
                <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 border-b border-purple-100 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Ver conversaciones"
                        className="lg:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:text-[#8553d1] hover:bg-purple-50 cursor-pointer"
                    >
                        <MessagesSquare size={18} />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#8553d1] flex items-center justify-center text-white shadow-md shrink-0">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-gray-800 m-0 truncate">
                            {activeChat ? activeChat.title : "Bibliotecario IA"}
                        </h2>
                        <p className="text-xs text-gray-500 m-0">
                            {activeChat
                                ? "Responde al instante con recomendaciones del catálogo"
                                : "Nueva conversación — escribe tu primera pregunta"}
                        </p>
                    </div>
                </div>

                {/* Mensajes */}
                <div ref={scrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#faf8fc]/50 space-y-4">
                    {showWelcome ? (
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
                                        disabled={loading}
                                        className="px-4 py-2 rounded-full bg-white border border-purple-200 text-xs font-medium text-[#8553d1] hover:bg-[#f6efff] hover:border-[#8553d1] transition-all cursor-pointer disabled:opacity-40"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <ChatMessageBubble
                                key={`${message.id}-${message.content.length}`}
                                message={message}
                                regenerating={regeneratingId === message.id}
                                onRegenerate={(id) => void regenerate(id)}
                                onDelete={(id) => void deleteMessage(id)}
                            />
                        ))
                    )}

                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3d5bcf] to-[#8553d1] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-purple-100 rounded-3xl rounded-bl-md px-5 py-4 shadow-sm flex items-center gap-1.5">
                                <Loader2 size={16} className="animate-spin text-[#8553d1]" />
                                <span className="text-xs font-medium text-gray-400">
                                    Consultando el catálogo…
                                </span>
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
                            placeholder={
                                activeChatId
                                    ? "Escribe tu duda o consulta de libros..."
                                    : "Empieza una nueva conversación..."
                            }
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
            </div>
        </div>
    );
}