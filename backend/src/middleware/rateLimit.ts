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

// Bibliotecario IA: cada llamada consume cupo de DeepSeek (con coste),
// 15 consultas por hora y por IP.
export const chatLimiter = jsonLimiter(
    60 * 60_000,
    15,
    "Has llegado al límite de consultas al Bibliotecario IA, espera una hora",
);