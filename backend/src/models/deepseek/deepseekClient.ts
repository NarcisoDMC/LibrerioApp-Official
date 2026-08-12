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
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
};

export type ToolCall = {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
};

export type DeepSeekResponse = {
    content: string | null;
    toolCalls: ToolCall[];
};

type DeepSeekRawMessage = {
    content?: string | null;
    tool_calls?: ToolCall[];
};

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
