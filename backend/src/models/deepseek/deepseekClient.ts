import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

// ── Cliente de la API de DeepSeek (compatible OpenAI) ──────────────────────
// Se usa exclusivamente en el servicio del Bibliotecario IA. La clave vive en
// el .env del backend y NUNCA viaja al cliente.

const API_URL = "https://api.deepseek.com/chat/completions";
const TIMEOUT_MS = 30_000;

// Formato wire de DeepSeek/OpenAI: assistant tool message lleva tool_calls
// (sin content) y tool message lleva tool_call_id
export type ChatMessage = {
    role: "system" | "user" | "assistant" | "tool"; // define los roles 
    content: string;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
};

//Permite al modelo ejecutar funciones propias del backend 
export type ToolCall = {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
};

//Normaliza la respuesta para que las demas funciones reciban content y toolcalls
export type DeepSeekResponse = {
    content: string | null;
    toolCalls: ToolCall[];
};

//Recibe el mensaje en crudo del modelo
type DeepSeekRawMessage = {
    content?: string | null;
    tool_calls?: ToolCall[];
};

//Validamos el funcionamiento de la api de deepseek para poder manejar estados y mensajes de error.
export function isDeepSeekAvailable(): boolean {
    return env.DEEPSEEK_API_KEY !== undefined;
}

// Llama al modelo con mensajes + tools opcionales. Devuelve el contenido y/o
// las tool_calls que el modelo quiera ejecutar (máx. 1 turno por llamada).
export async function deepseekChat(params: {
    messages: ChatMessage[];
    tools?: unknown[];
    maxTokens?: number;
}): Promise<DeepSeekResponse> {
    if (!env.DEEPSEEK_API_KEY) {
        throw new ApiError(503, "El Bibliotecario IA no está disponible");
    }

    const body = {
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: params.maxTokens ?? 1200,
        messages: params.messages,
        tools: params.tools,
        // modo json_object SOLO en llamadas sin tools (las llamadas con tools
        // responden tool_calls y el modo JSON no aplica): el proveedor
        // garantiza salida JSON válida, clave anti-prosa/anti-rotura
        ...(params.tools ? {} : { response_format: { type: "json_object" } }),
    };

    let res: Response;
    try {
        res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch {
        // un reintento ante errores de red/timeout (patrón de olClient)
        try {
            res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(TIMEOUT_MS),
            });
        } catch {
            throw new ApiError(502, "El asistente no respondió, intenta de nuevo");
        }
    }

    if (!res.ok) {
        // 429 del proveedor: el rate limit del cliente debería evitarlo
        if (res.status === 429) {
            throw new ApiError(429, "Demasiadas consultas, espera un momento");
        }
        throw new ApiError(502, "El asistente falló, intenta de nuevo");
    }

    const data = (await res.json()) as {
        choices?: { message?: DeepSeekRawMessage }[];
    };
    const message = data.choices?.[0]?.message;
    if (!message) {
        throw new ApiError(502, "El asistente no respondió, intenta de nuevo");
    }

    return {
        content: message.content ?? null,
        toolCalls: message.tool_calls ?? [],
    };
}


// ── Helpers internos del streaming ─────────────────────────────────────────

// Fetch con reintento único ante errores de red/timeout (patrón de
// deepseekChat), pero nunca si el cliente pidió cancelar (no es fallo del
// proveedor).
async function streamFetch(body: unknown, signal: AbortSignal, attempt = 0): Promise<Response> {
    try {
        return await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify(body),
            signal,
        });
    } catch {
        if (attempt > 0 || signal.aborted) {
            throw new ApiError(502, "El asistente no respondió, intenta de nuevo");
        }
        return streamFetch(body, signal, attempt + 1);
    }
}

// Valida el estado de la respuesta antes de abrir el stream.
function assertStreamOk(res: Response): void {
    if (res.ok) return;
    if (res.status === 429) {
        throw new ApiError(429, "Demasiadas consultas, espera un momento");
    }
    throw new ApiError(502, "El asistente falló, intenta de nuevo");
}

// Lee el cuerpo SSE crudo y emite los payloads JSON de cada evento `data:`.
// `[DONE]` termina el flujo; los eventos corruptos o keep-alive se ignoran.
// `onActivity` se llama ante cada evento válido (reset del idle timeout).
async function* readSsePayloads(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: InstanceType<typeof TextDecoder>,
    onActivity: () => void,
): AsyncGenerator<unknown> {
    let buffer = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) return;

        // GOTCHA UTF-8: sin { stream: true }, palabras partidas entre trozos
        // ("pregúntame" con acento) llegan cortadas con �
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n"); // separador de eventos SSE
        buffer = events.pop() ?? "";         // resto incompleto vuelve al buffer

        for (const rawEvent of events) {
            for (const line of rawEvent.split("\n")) {
                if (!line.startsWith("data:")) continue; // saltar ": keep-alive"
                const payload = line.slice(5).trim();
                if (!payload) continue;
                if (payload === "[DONE]") return; // sentinela de fin de DeepSeek
                try {
                    onActivity();
                    yield JSON.parse(payload);
                } catch {
                    // evento corrupto: se ignora, no se rompe el stream
                }
            }
        }
    }
}

// ── Streaming del turno final de redacción (texto plano, sin tools) ────────
// Emite los deltas de texto del último turno. NO lleva response_format: el
// JSON del modelo no puede sanearse por trozos, así que aquí el modelo
// escribe prosa/markdown directamente (el chat lo renderiza igual).
export async function deepseekChatStream(params: {
    messages: ChatMessage[];
    maxTokens?: number;
    signal?: AbortSignal;
}): Promise<AsyncIterable<string>> {
    if (!env.DEEPSEEK_API_KEY) {
        throw new ApiError(503, "El Bibliotecario IA no está disponible");
    }

    const body = {
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: params.maxTokens ?? 1200,
        messages: params.messages,
        stream: true,
    };

    // Timeout manual: conecta con el proveedor (30 s) pero NO mata streams
    // largos. Un AbortSignal.timeout global cortaría la generación a mitad.
    const ac = new AbortController();
    params.signal?.addEventListener("abort", () => ac.abort(), { once: true });
    const connectTimer = setTimeout(() => ac.abort(), TIMEOUT_MS);

    const res = await streamFetch(body, ac.signal);
    clearTimeout(connectTimer);
    assertStreamOk(res);
    if (!res.body) {
        throw new ApiError(502, "El asistente no respondió, intenta de nuevo");
    }

    const decoder = new TextDecoder("utf-8");

    // Idle timeout: aborta si el modelo deja de emitir 30 s (conexiones colgadas)
    let idleTimer: NodeJS.Timeout | undefined;
    function armIdle(): void {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    }

    return (async function* (): AsyncGenerator<string> {
        const reader = res.body!.getReader();
        try {
            for await (const payload of readSsePayloads(reader, decoder, armIdle)) {
                const json = payload as { choices?: { delta?: { content?: string | null } }[] };
                const delta = json.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta.length > 0) {
                    yield delta;
                }
            }
        } finally {
            clearTimeout(connectTimer);
            clearTimeout(idleTimer);

            // cerrar el lector si el consumidor cortó antes del final
            try {
                await reader.cancel();
            } catch {
                // lector ya cerrado: irrelevante
            }
        }
    })();
}