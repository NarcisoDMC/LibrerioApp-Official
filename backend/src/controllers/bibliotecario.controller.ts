import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getValid } from "../middleware/validate.js";
import {
    bibliotecarioService,
    type ChatStreamEvent,
    LIMITS,
} from "../services/bibliotecario.service.js";
import { ApiError } from "../utils/api-error.js";

// ── Schemas zod: toda entrada se valida aquí, nunca se lee req.body directo ─

export const chatCreateSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "El mensaje no puede estar vacío")
        .max(LIMITS.MAX_MESSAGE_CHARS, `Máximo ${LIMITS.MAX_MESSAGE_CHARS} caracteres`),
});

export const chatIdParamsSchema = z.object({
    chatId: z.string().uuid("ID de conversación inválido"),
});

export const chatMessageParamsSchema = z.object({
    chatId: z.string().uuid("ID de conversación inválido"),
    messageId: z.string().uuid("ID de mensaje inválido"),
});

export const chatRenameBodySchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "El título no puede estar vacío")
        .max(LIMITS.MAX_TITLE_CHARS, `Máximo ${LIMITS.MAX_TITLE_CHARS} caracteres`),
});

async function handle<T>(
    fn: () => Promise<T>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        res.json(await fn());
    } catch (e) {
        next(e);
    }
}

function requireUserId(req: Request): string {
    const id = req.user?.id;
    if (!id) throw new ApiError(401, "No autenticado");
    return id;
}

// ── Streaming SSE ───────────────────────────────────────────────────────────

// Serializa un evento como `data: {json}\n\n` y fuerza el flush para que el
// cliente lo reciba al instante (sin esperar al cierre del buffer de Node)
function sendSse(res: Response, event: ChatStreamEvent): void {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    // compression añade flush(); si no existe, Node entrega por trozos igual
    (res as Response & { flush?: () => void }).flush?.();
}

// Monta una respuesta SSE. El setup (validaciones, BD, fase de tools) corre
// ANTES de enviar headers: si falla, next(err) responde el JSON de siempre.
// Solo los fallos a mitad de stream se convierten en un evento `error`.
async function handleStream(
    setup: () => Promise<{ stream: AsyncIterable<ChatStreamEvent> }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    let stream: AsyncIterable<ChatStreamEvent>;
    try {
        ({ stream } = await setup());
    } catch (e) {
        next(e);
        return;
    }

    // headers SSE: stream plano, sin caché ni buffering intermedio
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
        for await (const event of stream) {
            sendSse(res, event);
        }
    } catch {
        // abort del cliente o caída del proveedor a mitad de stream
        try {
            sendSse(res, {
                type: "error",
                message: "La respuesta se interrumpió, intenta de nuevo",
            });
        } catch {
            // cliente ya desconectado: no se puede escribir
        }
    } finally {
        try {
            res.end();
        } catch {
            // socket ya cerrado
        }
    }
}

// AbortController ligado a la desconexión del cliente: aborta la generación
// de DeepSeek en curso (el backend no sigue gastando cupo ni tokens). El
// listener se retira cuando la respuesta termina (evitar fugas).
function abortOnClientClose(req: Request, res: Response): AbortSignal {
    const ac = new AbortController();
    const onClose = () => ac.abort();
    req.on("close", onClose);
    res.on("finish", () => req.off("close", onClose));
    return ac.signal;
}

// ── Streaming: los 3 endpoints SSE + controladores JSON ────────────────────

export const bibliotecarioController = {
    startChat(req: Request, res: Response, next: NextFunction): void {
        const { content } = getValid<z.infer<typeof chatCreateSchema>>(res, "validBody");
        void handle(() => bibliotecarioService.startChat(requireUserId(req), content), res, next);
    },

    sendMessage(req: Request, res: Response, next: NextFunction): void {
        const { chatId } = getValid<z.infer<typeof chatIdParamsSchema>>(res, "validParams");
        const { content } = getValid<z.infer<typeof chatCreateSchema>>(res, "validBody");
        void handle(
            () => bibliotecarioService.sendMessage(requireUserId(req), chatId, content),
            res,
            next,
        );
    },

    regenerate(req: Request, res: Response, next: NextFunction): void {
        const {
            chatId,
            messageId,
        } = getValid<z.infer<typeof chatMessageParamsSchema>>(res, "validParams");
        void handle(
            () => bibliotecarioService.regenerate(requireUserId(req), chatId, messageId),
            res,
            next,
        );
    },

    // ── Versiones streaming (SSE) ───────────────────────────────────────

    startChatStream(req: Request, res: Response, next: NextFunction): void {
        const { content } = getValid<z.infer<typeof chatCreateSchema>>(res, "validBody");
        const signal = abortOnClientClose(req, res);
        void handleStream(
            () => bibliotecarioService.startChatStream(requireUserId(req), content, signal),
            res,
            next,
        );
    },

    sendMessageStream(req: Request, res: Response, next: NextFunction): void {
        const { chatId } = getValid<z.infer<typeof chatIdParamsSchema>>(res, "validParams");
        const { content } = getValid<z.infer<typeof chatCreateSchema>>(res, "validBody");
        const signal = abortOnClientClose(req, res);
        void handleStream(
            () => bibliotecarioService.sendMessageStream(requireUserId(req), chatId, content, signal),
            res,
            next,
        );
    },

    regenerateStream(req: Request, res: Response, next: NextFunction): void {
        const {
            chatId,
            messageId,
        } = getValid<z.infer<typeof chatMessageParamsSchema>>(res, "validParams");
        const signal = abortOnClientClose(req, res);
        void handleStream(
            () =>
                bibliotecarioService.regenerateStream(
                    requireUserId(req),
                    chatId,
                    messageId,
                    signal,
                ),
            res,
            next,
        );
    },

    listChats(req: Request, res: Response, next: NextFunction): void {
        void handle(() => bibliotecarioService.listChats(requireUserId(req)), res, next);
    },

    getChat(req: Request, res: Response, next: NextFunction): void {
        const { chatId } = getValid<z.infer<typeof chatIdParamsSchema>>(res, "validParams");
        void handle(() => bibliotecarioService.getChat(requireUserId(req), chatId), res, next);
    },

    deleteMessage(req: Request, res: Response, next: NextFunction): void {
        const {
            chatId,
            messageId,
        } = getValid<z.infer<typeof chatMessageParamsSchema>>(res, "validParams");
        bibliotecarioService
            .deleteMessage(requireUserId(req), chatId, messageId)
            .then(() => res.status(204).end())
            .catch(next);
    },

    renameChat(req: Request, res: Response, next: NextFunction): void {
        const { chatId } = getValid<z.infer<typeof chatIdParamsSchema>>(res, "validParams");
        const { title } = getValid<z.infer<typeof chatRenameBodySchema>>(res, "validBody");
        void handle(() => bibliotecarioService.renameChat(requireUserId(req), chatId, title), res, next);
    },

    deleteChat(req: Request, res: Response, next: NextFunction): void {
        const { chatId } = getValid<z.infer<typeof chatIdParamsSchema>>(res, "validParams");
        bibliotecarioService
            .deleteChat(requireUserId(req), chatId)
            .then(() => res.status(204).end())
            .catch(next);
    },
};