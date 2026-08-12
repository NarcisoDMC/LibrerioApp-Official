import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getValid } from "../middleware/validate.js";
import { bibliotecarioService, LIMITS } from "../services/bibliotecario.service.js";
import { ApiError } from "../utils/api-error.js";

// El historial llega del cliente con roles acotados; los límites evitan
// inyectar contextos gigantes o cadenas de manipulación muy largas
export const chatBodySchema = z.object({
    messages: z
        .array(
            z.object({
                role: z.enum(["user", "assistant"]),
                content: z
                    .string()
                    .trim()
                    .min(1, "El mensaje no puede estar vacío")
                    .max(LIMITS.MAX_MESSAGE_CHARS, `Máximo ${LIMITS.MAX_MESSAGE_CHARS} caracteres`),
            }),
        )
        .min(1, "Envía al menos un mensaje")
        .max(LIMITS.MAX_HISTORY, `Máximo ${LIMITS.MAX_HISTORY} mensajes por petición`),
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

export const bibliotecarioController = {
    chat(req: Request, res: Response, next: NextFunction): void {
        const body = getValid<z.infer<typeof chatBodySchema>>(res, "validBody");
        const userId = req.user?.id;
        if (!userId) {
            next(new ApiError(401, "No autenticado"));
            return;
        }
        void handle(() => bibliotecarioService.chat({ userId, messages: body.messages }), res, next);
    },
};