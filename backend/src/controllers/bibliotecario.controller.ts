import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getValid } from "../middleware/validate.js";
import { bibliotecarioService, LIMITS } from "../services/bibliotecario.service.js";
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