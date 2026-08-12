import bcrypt from "bcryptjs";
import { ApiError } from "../utils/api-error.js";
import { sessionRepo } from "../models/db/repositories/session.repo.js";
import { userRepo, type User } from "../models/db/repositories/user.repo.js";
import {
    generateRefreshToken,
    hashToken,
    REFRESH_TTL_MS,
    signAccessToken,
} from "../utils/tokens.js";

const BCRYPT_ROUNDS = 12;

export interface SafeUser {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

export interface AuthResult {
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

// "Vista" de usuario: nunca exponer passwordHash
function toSafeUser(user: User): SafeUser {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
    };
}

async function issueSession(userId: string): Promise<string> {
    const refreshToken = generateRefreshToken();
    await sessionRepo.create({
        userId,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return refreshToken;
}

export const authService = {
    async register(input: RegisterInput): Promise<AuthResult> {
        const existing = await userRepo.findByEmail(input.email);
        if (existing) throw new ApiError(409, "Ya existe una cuenta con este email");

        const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
        const user = await userRepo.create({
            email: input.email,
            passwordHash,
            name: input.name,
        });

        const refreshToken = await issueSession(user.id);
        return {
            user: toSafeUser(user),
            accessToken: signAccessToken(user.id),
            refreshToken,
        };
    },

    async login(input: LoginInput): Promise<AuthResult> {
        const user = await userRepo.findByEmail(input.email);
        // Mismo mensaje para usuario inexistente y contraseña mala:
        // no se revela qué credencial fue la incorrecta
        const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
        if (!user || !valid) throw new ApiError(401, "Credenciales inválidas");

        const refreshToken = await issueSession(user.id);
        return {
            user: toSafeUser(user),
            accessToken: signAccessToken(user.id),
            refreshToken,
        };
    },

    async refresh(refreshToken: string): Promise<AuthResult> {
        const session = await sessionRepo.findByHash(hashToken(refreshToken));
        if (!session) throw new ApiError(401, "Sesión inválida o expirada");

        if (session.revokedAt) {
            // El token ya fue rotado: presentarlo de nuevo = posible robo.
            // Se revoca TODO lo del usuario: atacante y víctima quedan fuera,
            // la víctima se da cuenta al tener que volver a loguearse.
            await sessionRepo.revokeAllForUser(session.userId);
            throw new ApiError(401, "Sesión inválida o expirada");
        }

        if (session.expiresAt.getTime() < Date.now()) {
            await sessionRepo.revoke(session.id);
            throw new ApiError(401, "Sesión expirada");
        }

        const user = await userRepo.findById(session.userId);
        if (!user) throw new ApiError(401, "Sesión inválida");

        // Rotación: se invalida el token actual y se emite uno nuevo
        await sessionRepo.revoke(session.id);
        const newRefreshToken = await issueSession(user.id);
        return {
            user: toSafeUser(user),
            accessToken: signAccessToken(user.id),
            refreshToken: newRefreshToken,
        };
    },

    async logout(refreshToken: string): Promise<void> {
        const session = await sessionRepo.findByHash(hashToken(refreshToken));
        if (session && !session.revokedAt) {
            await sessionRepo.revoke(session.id);
        }
    },

    async me(userId: string): Promise<SafeUser> {
        const user = await userRepo.findById(userId);
        if (!user) throw new ApiError(404, "Usuario no encontrado");
        return toSafeUser(user);
    },
};