import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getValid } from "../middleware/validate.js";
import { libraryService } from "../services/library.service.js";
import { ApiError } from "../utils/api-error.js";

export const libraryBodySchema = z
    .object({
        olid: z.string().regex(/^OL\d+W$/, "OLID de obra inválido").optional(),
        isbn: z
            .string()
            .trim()
            .transform((s) => s.replace(/[-\s]/g, ""))
            .pipe(z.string().regex(/^(\d{10}|\d{13})$/i, "ISBN inválido"))
            .optional(),
        status: z.enum(["por-leer", "leyendo", "leido"]).optional(),
    })
    .refine((d) => (d.olid !== undefined) !== (d.isbn !== undefined), {
        message: "Indica exactamente uno: olid o isbn",
    });

export const patchLibraryBodySchema = z
    .object({
        status: z.enum(["por-leer", "leyendo", "leido"]).optional(),
        userRating: z.coerce.number().int().min(1).max(5).nullable().optional(),
        notes: z.string().trim().max(2000).nullable().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, {
        message: "Nada que actualizar: envía status, userRating o notes",
    });

export const libraryParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});

export const listLibraryQuerySchema = z.object({
    status: z.enum(["por-leer", "leyendo", "leido"]).optional(),
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

export const libraryController = {
    list(req: Request, res: Response, next: NextFunction): void {
        const { status } = getValid<z.infer<typeof listLibraryQuerySchema>>(res, "validQuery");
        void handle(() => libraryService.list(requireUserId(req), status), res, next);
    },

    add(req: Request, res: Response, next: NextFunction): void {
        const body = getValid<z.infer<typeof libraryBodySchema>>(res, "validBody");
        void handle(() => libraryService.add(requireUserId(req), body), res, next);
    },

    update(req: Request, res: Response, next: NextFunction): void {
        const { id } = getValid<z.infer<typeof libraryParamsSchema>>(res, "validParams");
        const body = getValid<z.infer<typeof patchLibraryBodySchema>>(res, "validBody");
        void handle(() => libraryService.update(requireUserId(req), id, body), res, next);
    },

    remove(req: Request, res: Response, next: NextFunction): void {
        const { id } = getValid<z.infer<typeof libraryParamsSchema>>(res, "validParams");
        libraryService
            .remove(requireUserId(req), id)
            .then(() => res.status(204).end())
            .catch(next);
    },
};