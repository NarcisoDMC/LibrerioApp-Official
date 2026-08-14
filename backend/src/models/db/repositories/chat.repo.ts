import { and, desc, eq, gte, inArray } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../client.js";
import { chatConversations, chatMessages } from "../schema.js";

// ── Repositorio de conversaciones y mensajes del Bibliotecario IA ──────────
// Todo query con scope de usuario lleva userId (anti-IDOR): los ids ajenos
// nunca se resuelven (404 arriba en el service, igual que library/community).

export type ChatConversation = InferSelectModel<typeof chatConversations>;
export type ChatRole = "user" | "assistant";
export type ChatEnlace = { titulo: string; url: string };

export type ChatSummary = {
    id: string;
    title: string;
    updatedAt: Date;
};

export type ChatMessageView = {
    id: string;
    seq: number;
    role: ChatRole;
    content: string;
    enlaces: ChatEnlace[] | null;
    createdAt: Date;
};

function toSummary(row: ChatConversation): ChatSummary {
    return { id: row.id, title: row.title, updatedAt: row.updatedAt };
}

function toMessage(row: InferSelectModel<typeof chatMessages>): ChatMessageView {
    return {
        id: row.id,
        seq: row.seq,
        role: row.role,
        content: row.content,
        enlaces: row.enlaces,
        createdAt: row.createdAt,
    };
}

export const chatRepo = {
    // ── Conversaciones ─────────────────────────────────────────────────

    async countByUser(userId: string): Promise<number> {
        const rows = await db
            .select({ id: chatConversations.id })
            .from(chatConversations)
            .where(eq(chatConversations.userId, userId));
        return rows.length;
    },

    async createConversation(userId: string, title: string): Promise<ChatSummary> {
        const rows = await db
            .insert(chatConversations)
            .values({ userId, title })
            .returning();
        const row = rows[0];
        if (!row) throw new Error("No se pudo crear la conversación");
        return toSummary(row);
    },

    // Más recientes primero (el sidebar los muestra así)
    async listByUser(userId: string): Promise<ChatSummary[]> {
        const rows = await db
            .select()
            .from(chatConversations)
            .where(eq(chatConversations.userId, userId))
            .orderBy(desc(chatConversations.updatedAt));
        return rows.map(toSummary);
    },

    async findOwnedById(userId: string, chatId: string): Promise<ChatSummary | undefined> {
        const rows = await db
            .select()
            .from(chatConversations)
            .where(and(eq(chatConversations.id, chatId), eq(chatConversations.userId, userId)))
            .limit(1);
        return rows[0] ? toSummary(rows[0]) : undefined;
    },

    async rename(userId: string, chatId: string, title: string): Promise<ChatSummary | undefined> {
        const rows = await db
            .update(chatConversations)
            .set({ title, updatedAt: new Date() })
            .where(and(eq(chatConversations.id, chatId), eq(chatConversations.userId, userId)))
            .returning();
        return rows[0] ? toSummary(rows[0]) : undefined;
    },

    async touch(userId: string, chatId: string): Promise<void> {
        await db
            .update(chatConversations)
            .set({ updatedAt: new Date() })
            .where(and(eq(chatConversations.id, chatId), eq(chatConversations.userId, userId)));
    },

    async remove(userId: string, chatId: string): Promise<boolean> {
        const rows = await db
            .delete(chatConversations)
            .where(and(eq(chatConversations.id, chatId), eq(chatConversations.userId, userId)))
            .returning({ id: chatConversations.id });
        return rows.length > 0;
    },

    // ── Mensajes ──────────────────────────────────────────────────────

    async countMessages(chatId: string): Promise<number> {
        const rows = await db
            .select({ id: chatMessages.id })
            .from(chatMessages)
            .where(eq(chatMessages.conversationId, chatId));
        return rows.length;
    },

    // Historial cronológico estable (seq es el orden definitivo)
    async listMessages(chatId: string): Promise<ChatMessageView[]> {
        const rows = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.conversationId, chatId))
            .orderBy(chatMessages.seq);
        return rows.map(toMessage);
    },

    async createMessage(
        chatId: string,
        role: ChatRole,
        content: string,
        enlaces: ChatEnlace[] | null,
    ): Promise<ChatMessageView> {
        const rows = await db
            .insert(chatMessages)
            .values({ conversationId: chatId, role, content, enlaces })
            .returning();
        const row = rows[0];
        if (!row) throw new Error("No se pudo guardar el mensaje");
        return toMessage(row);
    },

    // Scope completo: mensaje de UNA conversación de UN usuario
    async findMessageById(
        userId: string,
        chatId: string,
        messageId: string,
    ): Promise<(ChatMessageView & { conversationId: string }) | undefined> {
        const rows = await db
            .select()
            .from(chatMessages)
            .innerJoin(chatConversations, eq(chatMessages.conversationId, chatConversations.id))
            .where(
                and(
                    eq(chatMessages.id, messageId),
                    eq(chatMessages.conversationId, chatId),
                    eq(chatConversations.userId, userId),
                ),
            )
            .limit(1);
        if (!rows[0]) return undefined;
        return {
            ...toMessage(rows[0].chat_messages),
            conversationId: rows[0].chat_conversations.id,
        };
    },

    // Truncado para regenerar: borra el mensaje target y todos los posteriores
    async deleteMessagesFromSeq(chatId: string, seq: number): Promise<number> {
        const rows = await db
            .delete(chatMessages)
            .where(and(eq(chatMessages.conversationId, chatId), gte(chatMessages.seq, seq)))
            .returning({ id: chatMessages.id });
        return rows.length;
    },

    async deleteMessageById(userId: string, chatId: string, messageId: string): Promise<boolean> {
        const rows = await db
            .delete(chatMessages)
            .where(
                and(
                    eq(chatMessages.id, messageId),
                    eq(chatMessages.conversationId, chatId),
                    // scope por usuario: solo borra si la conversación es suya
                    inArray(
                        chatMessages.conversationId,
                        db
                            .select({ id: chatConversations.id })
                            .from(chatConversations)
                            .where(eq(chatConversations.userId, userId)),
                    ),
                ),
            )
            .returning({ id: chatMessages.id });
        return rows.length > 0;
    },
};
