import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/tokens.js";

export interface AuthUser {
    id: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        next(new ApiError(401, "No autenticado"));
        return;
    }
    try {
        const payload = verifyAccessToken(header.slice("Bearer ".length));
        req.user = { id: payload.sub };
        next();
    } catch {
        next(new ApiError(401, "Sesión inválida o expirada"));
    }
}