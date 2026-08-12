import { rateLimit } from "express-rate-limit";

function jsonLimiter(windowMs: number, limit: number, message: string) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        handler: (_req, res) => {
            res.status(429).json({ error: message });
        },
    });
}

// Catálogo (proxya a OpenLibrary: cupo real de 1-3 req/s):
// 30 peticiones por minuto y por IP.
export const catalogLimiter = jsonLimiter(
    60_000,
    30,
    "Demasiadas peticiones, espera un momento",
);

// Auth: fuerza bruta de contraseñas se combate con límites estrictos.
export const authLimiter = jsonLimiter(
    15 * 60_000,
    10,
    "Demasiados intentos, espera 15 minutos",
);