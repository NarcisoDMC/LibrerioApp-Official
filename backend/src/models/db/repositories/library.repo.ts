import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../client.js";
import { libraryBooks, readingStatusEnum } from "../schema.js";

export type LibraryBook = InferSelectModel<typeof libraryBooks>;
export type ReadingStatus = (typeof readingStatusEnum.enumValues)[number];

export type LibraryBookCreate = {
    userId: string;
    olid: string;
    isbn: string | null;
    title: string;
    author: string;
    coverUrl: string | null;
    firstPublishYear: number | null;
    status: ReadingStatus;
};

export type LibraryBookPatch = {
    status?: ReadingStatus;
    userRating?: number | null;
    notes?: string | null;
};

function rowToBook(row: LibraryBook) {
    return {
        id: row.id,
        olid: row.olid,
        isbn: row.isbn,
        title: row.title,
        author: row.author,
        cover: row.coverUrl,
        firstPublishYear: row.firstPublishYear,
        status: row.status,
        userRating: row.userRating,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export const libraryRepo = {
    async create(input: LibraryBookCreate) {
        const rows = await db
            .insert(libraryBooks)
            .values({
                userId: input.userId,
                olid: input.olid,
                isbn: input.isbn,
                title: input.title,
                author: input.author,
                coverUrl: input.coverUrl,
                firstPublishYear: input.firstPublishYear,
                status: input.status,
            })
            .returning();
        const row = rows[0];
        if (!row) throw new Error("No se pudo guardar el libro");
        return rowToBook(row);
    },

    async findByOlid(userId: string, olid: string) {
        const rows = await db
            .select()
            .from(libraryBooks)
            .where(and(eq(libraryBooks.userId, userId), eq(libraryBooks.olid, olid)))
            .limit(1);
        return rows[0] ? rowToBook(rows[0]) : undefined;
    },

    // El scope SIEMPRE incluye userId: un id de otro usuario responde 404,
    // nunca se filtra existencia de datos ajenos (anti-IDOR)
    async listByUser(userId: string, status?: ReadingStatus) {
        const rows = status
            ? await db
                  .select()
                  .from(libraryBooks)
                  .where(and(eq(libraryBooks.userId, userId), eq(libraryBooks.status, status)))
                  .orderBy(libraryBooks.createdAt)
            : await db
                  .select()
                  .from(libraryBooks)
                  .where(eq(libraryBooks.userId, userId))
                  .orderBy(libraryBooks.createdAt);
        return rows.map(rowToBook);
    },

    async findOwnedById(userId: string, id: string) {
        const rows = await db
            .select()
            .from(libraryBooks)
            .where(and(eq(libraryBooks.userId, userId), eq(libraryBooks.id, id)))
            .limit(1);
        return rows[0] ? rowToBook(rows[0]) : undefined;
    },

    async update(userId: string, id: string, patch: LibraryBookPatch) {
        const rows = await db
            .update(libraryBooks)
            .set({ ...patch, updatedAt: new Date() })
            .where(and(eq(libraryBooks.userId, userId), eq(libraryBooks.id, id)))
            .returning();
        return rows[0] ? rowToBook(rows[0]) : undefined;
    },

    async remove(userId: string, id: string): Promise<boolean> {
        const rows = await db
            .delete(libraryBooks)
            .where(and(eq(libraryBooks.userId, userId), eq(libraryBooks.id, id)))
            .returning({ id: libraryBooks.id });
        return rows.length > 0;
    },
};