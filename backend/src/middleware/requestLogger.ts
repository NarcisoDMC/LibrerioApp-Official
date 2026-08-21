import type { NextFunction, Request, Response } from "express";

// Log de peticiones SIN cuerpos, cabeceras ni queries (nada sensible).
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = performance.now();
    res.on("finish", () => {
        const ms = Math.round(performance.now() - start);
        console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms) [ip: ${req.ip}]`);
    });
    next();
}