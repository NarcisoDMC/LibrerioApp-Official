import { Router } from "express";
import {
    libraryBodySchema,
    libraryController,
    libraryParamsSchema,
    listLibraryQuerySchema,
    patchLibraryBodySchema,
} from "../controllers/library.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";

export const libraryRouter = Router();

// Toda la biblioteca es privada: userId sale del token firmado, nunca del body
libraryRouter.use(requireAuth);

libraryRouter.get(
    "/",
    validateQuery(listLibraryQuerySchema),
    libraryController.list,
);
libraryRouter.post("/", validateBody(libraryBodySchema), libraryController.add);
libraryRouter.patch(
    "/:id",
    validateParams(libraryParamsSchema),
    validateBody(patchLibraryBodySchema),
    libraryController.update,
);
libraryRouter.delete("/:id", validateParams(libraryParamsSchema), libraryController.remove);