import { and, eq, isNull } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../client.js";
import { sessions } from "../schema.js";

export type Session = InferSelectModel<typeof sessions>;

export const sessionRepo = {
    async create(input: { userId: string; refreshTokenHash: string; expiresAt: Date }): Promise<void> {
        await db.insert(sessions).values(input);
    },

    async findByHash(hash: string): Promise<Session | undefined> {
        const rows = await db
            .select()
            .from(sessions)
            .where(eq(sessions.refreshTokenHash, hash))
            .limit(1);
        return rows[0];
    },

    async revoke(id: string): Promise<void> {
        await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, id));
    },

    async revokeAllForUser(userId: string): Promise<void> {
        await db
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
    },
};