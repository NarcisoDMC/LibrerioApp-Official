import { Router } from "express";
import {
    bibliotecarioController,
    chatCreateSchema,
    chatIdParamsSchema,
    chatMessageParamsSchema,
    chatRenameBodySchema,
} from "../controllers/bibliotecario.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { validateBody, validateParams } from "../middleware/validate.js";

export const bibliotecarioRouter = Router();

// Todo el chat es privado: el usuario sale del token, nunca del body
bibliotecarioRouter.use(requireAuth);

// El chatLimiter (cupo de DeepSeek) solo protege lo que consume el modelo:
// listar, renombrar o borrar historial no llama al proveedor
bibliotecarioRouter.post(
    "/chats",
    chatLimiter,
    validateBody(chatCreateSchema),
    bibliotecarioController.startChat,
);
bibliotecarioRouter.get("/chats", bibliotecarioController.listChats);
bibliotecarioRouter.get(
    "/chats/:chatId",
    validateParams(chatIdParamsSchema),
    bibliotecarioController.getChat,
);
bibliotecarioRouter.patch(
    "/chats/:chatId",
    validateParams(chatIdParamsSchema),
    validateBody(chatRenameBodySchema),
    bibliotecarioController.renameChat,
);
bibliotecarioRouter.delete(
    "/chats/:chatId",
    validateParams(chatIdParamsSchema),
    bibliotecarioController.deleteChat,
);
bibliotecarioRouter.post(
    "/chats/:chatId/messages",
    chatLimiter,
    validateParams(chatIdParamsSchema),
    validateBody(chatCreateSchema),
    bibliotecarioController.sendMessage,
);
bibliotecarioRouter.post(
    "/chats/:chatId/messages/:messageId/regenerate",
    chatLimiter,
    validateParams(chatMessageParamsSchema),
    bibliotecarioController.regenerate,
);

// ── Streaming SSE (las respuestas llegan por chunks) ────────────────────────
// Mismos schemas zod y mismo chatLimiter; los endpoints JSON de arriba se
// conservan como fallback mientras migra el frontend
bibliotecarioRouter.post(
    "/chats/stream",
    chatLimiter,
    validateBody(chatCreateSchema),
    bibliotecarioController.startChatStream,
);
bibliotecarioRouter.post(
    "/chats/:chatId/messages/stream",
    chatLimiter,
    validateParams(chatIdParamsSchema),
    validateBody(chatCreateSchema),
    bibliotecarioController.sendMessageStream,
);
bibliotecarioRouter.post(
    "/chats/:chatId/messages/:messageId/regenerate/stream",
    chatLimiter,
    validateParams(chatMessageParamsSchema),
    bibliotecarioController.regenerateStream,
);
bibliotecarioRouter.delete(
    "/chats/:chatId/messages/:messageId",
    validateParams(chatMessageParamsSchema),
    bibliotecarioController.deleteMessage,
);