import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_TTL,
        algorithm: "HS256",
    });
}

export function verifyAccessToken(token: string): { sub: string } {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
    if (typeof payload === "string" || typeof payload.sub !== "string") {
        throw new Error("Token inválido");
    }
    return { sub: payload.sub };
}

// Refresh token opaco: alta entropía, se guarda SIEMPRE hasheado en BD
export function generateRefreshToken(): string {
    return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}