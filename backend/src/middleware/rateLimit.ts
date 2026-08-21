import { rateLimit } from "express-rate-limit";

function jsonLimiter(windowMs: number, limit: number, message: string) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        handler: (req, res) => {
            // Diagnóstico: registrar quién se bloquea (IP) y contra qué ruta
            console.warn(
                `[rate-limit] 429 → ${req.method} ${req.originalUrl} (ip: ${req.ip})`,
            );
            res.status(429).json({ error: message });
        },
    });
}

// En desarrollo los límites son holgados (x4): el SSR de Next (detalle de
// libros) sale desde la IP de la máquina y comparte bucket con el navegador
// del PC, así que 30/min se agotan navegando normal. En producción se
// mantienen los valores estrictos de protección.
const devMultiplier = process.env.NODE_ENV === "production" ? 1 : 4;

// Catálogo (proxya a OpenLibrary: cupo real de 1-3 req/s):
// 30 peticiones por minuto y por IP (120 en dev).
export const catalogLimiter = jsonLimiter(
    60_000,
    30 * devMultiplier,
    "Demasiadas peticiones, espera un momento",
);

// Auth: fuerza bruta de contraseñas se combate con límites estrictos.
export const authLimiter = jsonLimiter(
    15 * 60_000,
    10 * devMultiplier,
    "Demasiados intentos, espera 15 minutos",
);

// Bibliotecario IA: cada llamada consume cupo de DeepSeek (con coste),
// 15 consultas por hora y por IP (60 en dev).
export const chatLimiter = jsonLimiter(
    60 * 60_000,
    15 * devMultiplier,
    "Has llegado al límite de consultas al Bibliotecario IA, espera una hora",
);
