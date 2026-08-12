import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getValid } from "../middleware/validate.js";
import { communityService } from "../services/community.service.js";
import { ApiError } from "../utils/api-error.js";

export const postBodySchema = z.object({
    title: z.string().trim().min(1, "El título no puede estar vacío").max(100, "Máximo 100 caracteres"),
    content: z.string().trim().min(1, "El contenido no puede estar vacío").max(5000, "Máximo 5000 caracteres"),
    bookOlid: z.string().regex(/^OL\d+W$/, "OLID de obra inválido").optional(),
});

export const commentBodySchema = z.object({
    content: z.string().trim().min(1, "El comentario no puede estar vacío").max(1000, "Máximo 1000 caracteres"),
});

export const communityParamsSchema = z.object({
    id: z.string().uuid("ID inválido"),
});

export const listPostsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    bookOlid: z.string().regex(/^OL\d+W$/, "OLID de obra inválido").optional(),
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

export const communityController = {
    listPosts(req: Request, res: Response, next: NextFunction): void {
        const { page, limit, bookOlid } = getValid<z.infer<typeof listPostsQuerySchema>>(res, "validQuery");
        void handle(() => communityService.listPosts(page, limit, bookOlid, req.user?.id), res, next);
    },

    getPost(req: Request, res: Response, next: NextFunction): void {
        const { id } = getValid<z.infer<typeof communityParamsSchema>>(res, "validParams");
        void handle(() => communityService.getPost(id, req.user?.id), res, next);
    },

    createPost(req: Request, res: Response, next: NextFunction): void {
        const body = getValid<z.infer<typeof postBodySchema>>(res, "validBody");
        void handle(() => communityService.createPost(requireUserId(req), body), res, next);
    },

    addComment(req: Request, res: Response, next: NextFunction): void {
        const { id } = getValid<z.infer<typeof communityParamsSchema>>(res, "validParams");
        const body = getValid<z.infer<typeof commentBodySchema>>(res, "validBody");
        void handle(() => communityService.addComment(id, requireUserId(req), body), res, next);
    },

    toggleLike(req: Request, res: Response, next: NextFunction): void {
        const { id } = getValid<z.infer<typeof communityParamsSchema>>(res, "validParams");
        void handle(() => communityService.toggleLike(id, requireUserId(req)), res, next);
    },
};
