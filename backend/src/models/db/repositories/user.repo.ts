import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../client.js";
import { users } from "../schema.js";

export type User = InferSelectModel<typeof users>;

export const userRepo = {
    async create(input: { email: string; passwordHash: string; name: string }): Promise<User> {
        const rows = await db.insert(users).values(input).returning();
        const row = rows[0];
        if (!row) throw new Error("No se pudo crear el usuario");
        return row;
    },

    async findByEmail(email: string): Promise<User | undefined> {
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return rows[0];
    },

    async findById(id: string): Promise<User | undefined> {
        const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return rows[0];
    },
};