import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getValid } from "../middleware/validate.js";
import { authService } from "../services/auth.service.js";
import { ApiError } from "../utils/api-error.js";

export const registerBodySchema = z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(72),
    name: z.string().trim().min(2).max(50),
});

export const loginBodySchema = z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(72),
});

export const refreshBodySchema = z.object({
    refreshToken: z.string().min(20).max(256),
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

export const authController = {
    register(_req: Request, res: Response, next: NextFunction): void {
        const body = getValid<z.infer<typeof registerBodySchema>>(res, "validBody");
        void handle(() => authService.register(body), res, next);
    },

    login(_req: Request, res: Response, next: NextFunction): void {
        const body = getValid<z.infer<typeof loginBodySchema>>(res, "validBody");
        void handle(() => authService.login(body), res, next);
    },

    refresh(_req: Request, res: Response, next: NextFunction): void {
        const { refreshToken } = getValid<z.infer<typeof refreshBodySchema>>(res, "validBody");
        void handle(() => authService.refresh(refreshToken), res, next);
    },

    logout(_req: Request, res: Response, next: NextFunction): void {
        const { refreshToken } = getValid<z.infer<typeof refreshBodySchema>>(res, "validBody");
        authService
            .logout(refreshToken)
            .then(() => res.status(204).end())
            .catch(next);
    },

    me(req: Request, res: Response, next: NextFunction): void {
        const userId = req.user?.id;
        if (!userId) {
            next(new ApiError(401, "No autenticado"));
            return;
        }
        void handle(() => authService.me(userId), res, next);
    },
};