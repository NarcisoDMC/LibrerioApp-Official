import { Router } from "express";
import { bibliotecarioController, chatBodySchema } from "../controllers/bibliotecario.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validate.js";

export const bibliotecarioRouter = Router();

// Chat privado y con cupo: autenticado (personalización + antiabuso) y
// limitado por IP+usuario para proteger el presupuesto del proveedor IA
bibliotecarioRouter.post(
    "/chat",
    chatLimiter,
    requireAuth,
    validateBody(chatBodySchema),
    bibliotecarioController.chat,
);