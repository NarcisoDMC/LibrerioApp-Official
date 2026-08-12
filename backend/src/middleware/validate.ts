import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/api-error.js";

declare global {
    namespace Express {
        interface Locals {
            validParams?: unknown;
            validQuery?: unknown;
            validBody?: unknown;
        }
    }
}

type ValidKey = "validParams" | "validQuery" | "validBody";

function sourceFor(key: ValidKey, req: Request): unknown {
    if (key === "validParams") return req.params;
    if (key === "validQuery") return req.query;
    return req.body;
}

function makeValidator(key: ValidKey, label: string) {
    return (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(sourceFor(key, req));
        if (!result.success) {
            next(new ApiError(400, `${label} inválidos`, result.error.issues));
            return;
        }
        res.locals[key] = result.data;
        next();
    };
}

export const validateParams = makeValidator("validParams", "Parámetros de ruta");
export const validateQuery = makeValidator("validQuery", "Parámetros de consulta");
export const validateBody = makeValidator("validBody", "Cuerpo de la petición");

export function getValid<T>(res: Response, key: ValidKey): T {
    return res.locals[key] as T;
}