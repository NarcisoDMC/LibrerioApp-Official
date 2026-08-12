import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
        const body: { error: string; details?: unknown } = { error: err.message };
        if (err.details !== undefined) body.details = err.details;
        res.status(err.status).json(body);
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({ error: "Datos inválidos", details: err.issues });
        return;
    }
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
};