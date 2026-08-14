import { Router } from "express";
import {
    authController,
    loginBodySchema,
    refreshBodySchema,
    registerBodySchema,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validate.js";

export const authRouter = Router(); //Exporta las rutas del controlador

// authLimiter solo en credenciales: combate fuerza bruta sin castigar refresh/logout
authRouter.post(
    "/register",
    authLimiter,
    validateBody(registerBodySchema),
    authController.register,
);

//Permite hacer peticiones post 

authRouter.post("/login", authLimiter, validateBody(loginBodySchema), authController.login);
authRouter.post("/refresh", validateBody(refreshBodySchema), authController.refresh);
authRouter.post("/logout", validateBody(refreshBodySchema), authController.logout);
authRouter.get("/me", requireAuth, authController.me);