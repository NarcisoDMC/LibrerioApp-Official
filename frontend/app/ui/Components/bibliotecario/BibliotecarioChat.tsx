"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, MessagesSquare, Send, Square } from "lucide-react";
import {
    API_URL,
    ApiError,
    clearTokens,
    getAccessToken,
    getRefreshToken,
    refreshSession,
    apiDelete,
    apiGet,
    apiPatch,
} from "@/lib/api-client";
import type {
    ChatDetail,
    ChatStoredMessage,
    ChatStreamEvent,
    ChatSummary,
} from "@/lib/types";
import ChatConversationList from "./ChatConversationList";
import ChatMessageBubble from "./ChatMessageBubble";
import { useSearchParams, useRouter } from "next/navigation";

// ── Chat del Bibliotecario IA (con historial persistente) ──────────────────
// Las conversaciones viven en el servidor: este componente solo las lista,
// las abre y envía mensajes. Sin almacenamiento local de historial.

const SUGGESTIONS = [
    "Recomiéndame un libro de fantasía",
    "¿Qué leo después de…? Ayúdame a decidir",
    "Los mejores libros de ciencia ficción",
    "Dónde comprar o pedir prestado un libro",
    "Consulta dudas de algun libro que este leyendo",
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

// ── Streaming SSE: fetch crudo (apiPost no puede leer chunks) ───────────────
// Bearer manual desde localStorage; en 401 refresca la sesión una vez y
// reintenta. Resuelve con el evento done/blocked; lanza con el mensaje del
// evento error o con AbortError si el usuario cancela (signal.aborted).
async function streamRequest(
    path: string,
    body: unknown,
    onChunk: (delta: string) => void,
    signal: AbortSignal,
    retried = false,
): Promise<Extract<ChatStreamEvent, { type: "done" | "blocked" }>> {
    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
            },
            body: JSON.stringify(body),
            signal,
        });
    } catch (err) {
        if (signal.aborted) throw err; // cancelación del usuario, no un fallo
        throw new ApiError(502, "No se pudo contactar con el asistente");
    }

    // Access caducado: refrescar una sola vez y reintentar el stream entero
    if (res.status === 401 && !retried && getRefreshToken()) {
        try {
            await refreshSession();
            return streamRequest(path, body, onChunk, signal, true);
        } catch {
            clearTokens();
            throw new ApiError(401, "Sesión expirada, vuelve a iniciar sesión");
        }
    }

    if (!res.ok) {
        let message = `Error ${res.status}`;
        try {
            message = ((await res.json()) as { error?: string }).error ?? message;
        } catch {
            // respuesta sin JSON (p. ej. 502 del proxy)
        }
        throw new ApiError(res.status, message);
    }
    if (!res.body) throw new ApiError(502, "El asistente no respondió");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // GOTCHA UTF-8: sin { stream: true }, palabras con acento partidas
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n"); // separador de eventos SSE
            buffer = events.pop() ?? "";

            for (const rawEvent of events) {
                for (const line of rawEvent.split("\n")) {
                    if (!line.startsWith("data:")) continue;
                    const payload = line.slice(5).trim();
                    if (!payload) continue;

                    let event: ChatStreamEvent;
                    try {
                        event = JSON.parse(payload) as ChatStreamEvent;
                    } catch {
                        continue; // evento corrupto: se ignora
                    }

                    if (event.type === "chunk") {
                        onChunk(event.delta);
                    } else if (event.type === "done" || event.type === "blocked") {
                        return event;
                    } else if (event.type === "error") {
                        throw new ApiError(502, event.message);
                    }
                }
            }
        }
    } finally {
        try {
            await reader.cancel();
        } catch {
            // lector ya cerrado
        }
    }
    throw new ApiError(502, "La respuesta se interrumpió, intenta de nuevo");
}

export default function BibliotecarioChat() {
    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatStoredMessage[]>([]);
    const [input, setInput] = useState("");
    // Estado del stream: texto acumulado + AbortController para cancelar
    const [streaming, setStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const streamingTextRef = useRef(""); // espejo mutable (onChunk → setState)
    const streamingAbortRef = useRef<AbortController | null>(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    const bookTitle = searchParams.get("bookTitle") || "";
    const bookId = searchParams.get("bookId") || "";

    const hasAutoAsked = useRef(false); // evita que se auto-pregunte varias veces al abrir la página
    const sendRef = useRef<(text: string) => Promise<void>>(undefined!);

    useEffect(() => {
        void loadInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Procesa los parámetros de libro (si existen) y envía la pregunta automáticamente despues de cargar el chat.
    useEffect(() => {
        //Validaciones
        if (loadingChats) return; // espera a que termine la carga inicial
        if (hasAutoAsked.current) return; // ya se preguntó automáticamente
        if (!bookTitle || !bookId) return; // no hay parámetros de libro

        hasAutoAsked.current = true; // marca que ya se preguntó automáticamente

        const question = `Hablame más sobre el libro "${bookTitle}" (ID: ${bookId})`;
        router.replace(`/Bibliotecario`, { scroll: false }); // Limpia los parámetros de la URL para evitar reenvíos accidentales

        void sendRef.current(question);
    }, [loadingChats, bookTitle, bookId, router]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, streaming, streamingText]);

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

    // ── Helpers de streaming (burbuja optimista + consumo SSE) ──────────

    // Burbuja del asistente mientras llegan los chunks (id local, sin acciones)
    function appendStreamingBubble(aborted: boolean): void {
        setMessages((prev) => [
            ...prev,
            {
                id: `local-interrupted-${Date.now()}`,
                seq: Number.MAX_SAFE_INTEGER,
                role: "assistant",
                content: streamingTextRef.current || (aborted ? "Respuesta interrumpida" : ""),
                createdAt: new Date().toISOString(),
            },
        ]);
    }

    function startStream(): AbortController {
        streamingTextRef.current = "";
        setStreamingText("");
        setStreaming(true);
        setError(null);
        const ac = new AbortController();
        streamingAbortRef.current = ac;
        return ac;
    }

    function stopStream(): void {
        setStreaming(false);
        setStreamingText("");
        streamingTextRef.current = "";
        streamingAbortRef.current = null;
    }

    // Primer mensaje de una conversación: crea el chat y muestra la respuesta
    async function createChatAndAsk(content: string): Promise<void> {
        const ac = startStream();

        // optimista: el mensaje del usuario aparece al instante
        setMessages([
            {
                id: `local-${Date.now()}`,
                seq: Number.MAX_SAFE_INTEGER,
                role: "user",
                content,
                createdAt: new Date().toISOString(),
            },
        ]);

        try {
            const done = await streamRequest(
                "/api/bibliotecario/chats/stream",
                { content },
                (delta) => {
                    streamingTextRef.current += delta;
                    setStreamingText(streamingTextRef.current);
                },
                ac.signal,
            );

            // el done trae el chatId real: refrescar lista y detalle
            const list = await apiGet<ChatSummary[]>("/api/bibliotecario/chats");
            setChats(list);
            setActiveChatId(done.chatId);
            const detail = await apiGet<ChatDetail>(`/api/bibliotecario/chats/${done.chatId}`);
            setMessages(detail.messages);
        } catch (err) {
            if (ac.signal.aborted) {
                // abort: el texto parcial queda como burbuja efímera sin acciones
                appendStreamingBubble(true);
            } else {
                setMessages([]);
                setActiveChatId(null);
                setError(toErrorMessage(err));
            }
        } finally {
            stopStream();
        }
    }

    async function send(text: string): Promise<void> {
        const content = text.trim();
        if (!content || streaming) return;

        if (!activeChatId) {
            await createChatAndAsk(content);
            setInput("");
            return;
        }

        setInput("");
        const ac = startStream();

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
            await streamRequest(
                `/api/bibliotecario/chats/${activeChatId}/messages/stream`,
                { content },
                (delta) => {
                    streamingTextRef.current += delta;
                    setStreamingText(streamingTextRef.current);
                },
                ac.signal,
            );
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
            if (ac.signal.aborted) {
                // abort: el mensaje user ya está en BD; el texto parcial queda
                // como burbuja efímera sin acciones
                appendStreamingBubble(true);
            } else {
                setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
                setError(toErrorMessage(err));
            }
        } finally {
            stopStream();
        }
    }

    sendRef.current = send;

    async function regenerate(messageId: string): Promise<void> {
        if (!activeChatId || regeneratingId || streaming) return;
        setRegeneratingId(messageId);
        const ac = startStream();

        try {
            await streamRequest(
                `/api/bibliotecario/chats/${activeChatId}/messages/${messageId}/regenerate/stream`,
                {},
                (delta) => {
                    streamingTextRef.current += delta;
                    setStreamingText(streamingTextRef.current);
                },
                ac.signal,
            );
            // el backend reemplaza y trunca: se recarga el chat para ser exactos
            const detail = await apiGet<ChatDetail>(`/api/bibliotecario/chats/${activeChatId}`);
            setMessages(detail.messages);
        } catch (err) {
            if (ac.signal.aborted) {
                appendStreamingBubble(true);
            } else {
                setError(toErrorMessage(err));
                // el mensaje original ya fue truncado por el backend: refrescar
                try {
                    const detail = await apiGet<ChatDetail>(
                        `/api/bibliotecario/chats/${activeChatId}`,
                    );
                    setMessages(detail.messages);
                } catch {
                    // el refresco falló también: se queda el error visible
                }
            }
        } finally {
            setRegeneratingId(null);
            stopStream();
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
        <div className="flex flex-col lg:flex-row flex-1 h-full min-h-0 gap-3 sm:gap-4 lg:gap-5">
            {/* ── Sidebar de conversaciones (desktop) ─────────────── */}
            <div className="hidden lg:flex w-64 xl:w-72 shrink-0 min-h-0">
                <div className="flex-1 min-h-0 bg-white rounded-3xl border border-purple-100 shadow-xl overflow-y-scroll">
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
                            className="fixed left-0 top-0 bottom-0 z-50 w-[min(20rem,calc(100vw-2rem))] bg-white shadow-2xl lg:hidden"
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
            <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-purple-100 shadow-xl overflow-hidden">
                {/* Header del chat */}
                <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 border-b border-purple-100 flex items-center gap-2 sm:gap-3">
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
                        <p className="hidden min-[380px]:block text-xs text-gray-500 m-0">
                            {activeChat
                                ? "Responde al instante con recomendaciones del catálogo"
                                : "Nueva conversación — escribe tu primera pregunta"}
                        </p>
                    </div>
                </div>

                {/* Mensajes */}
                <div ref={scrollRef} className="flex-1 min-h-0 p-3 sm:p-6 overflow-y-auto overscroll-contain bg-[#faf8fc]/50 space-y-3 sm:space-y-4">
                    {showWelcome ? (
                        <div className="h-full flex flex-col items-center justify-center gap-5 text-center">
                            <div className="text-gray-400">
                                <Bot className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                                <p className="text-sm font-medium">Pregúntale cualquier cosa sobre libros</p>
                                <p className="text-xs mt-1">
                                    Recomendaciones, autores, sagas, dónde conseguir tus lecturas.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 max-w-[17rem] sm:max-w-md">
                                {SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => void send(suggestion)}
                                        disabled={streaming}
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

                    {/* Burbuja del asistente mientras streamea (cursor pulsante) */}
                    {streaming && (
                        <ChatMessageBubble
                            message={{
                                id: "local-streaming",
                                seq: Number.MAX_SAFE_INTEGER,
                                role: "assistant",
                                content: streamingText,
                                createdAt: new Date().toISOString(),
                            }}
                            streaming
                            regenerating={false}
                            onRegenerate={() => undefined}
                            onDelete={() => undefined}
                        />
                    )}
                </div>

                {/* Errores */}
                {error && (
                    <div className="shrink-0 px-3 sm:px-5 pb-1">
                        <p className="px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                            {error}
                        </p>
                    </div>
                )}

                {/* Input */}
{/* Anillo con gradiente: invisible en reposo; al enfocar se dibuja de
                    izquierda a derecha y al salir se retira de derecha a
                    izquierda (ver .chat-input-ring en globals.css) */}
                <div className="input-ring shrink-0 mx-2 mb-2 sm:mx-3 sm:mb-3 rounded-full p-[2px]">
                    <div className="relative rounded-full bg-white p-1 flex items-center gap-1.5 sm:gap-2">
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
                            enterKeyHint="send"
                            placeholder={
                                activeChatId
                                    ? "Escribe tu duda o consulta de libros..."
                                    : "Empieza una nueva conversación..."
                            }
                            disabled={streaming}
                            className="flex-1 min-w-0 bg-transparent px-3 sm:px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none border-none font-sans disabled:opacity-60"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                // mientras streamea el botón aborta la respuesta
                                if (streaming) {
                                    streamingAbortRef.current?.abort();
                                } else {
                                    void send(input);
                                }
                            }}
                            disabled={streaming ? false : !input.trim()}
                            aria-label={streaming ? "Detener respuesta" : "Enviar mensaje"}
                            className="
                                w-10 h-10 shrink-0 rounded-full
                                bg-gradient-to-r from-[#3d5bcf] via-[#8553d1] to-[#c765dc]
                                text-white flex items-center justify-center
                                shadow-md disabled:opacity-40 transition-all hover:opacity-90 cursor-pointer
                            "
                        >
                            {streaming ? <Square size={16} /> : <Send size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
