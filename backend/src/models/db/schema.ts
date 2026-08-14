import { integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const readingStatusEnum = pgEnum("reading_status", ["por-leer", "leyendo", "leido"]);

export const libraryBooks = pgTable(
    "library_books",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        olid: text("olid").notNull(),
        isbn: text("isbn"),
        title: text("title").notNull(),
        author: text("author").notNull(),
        coverUrl: text("cover_url"),
        firstPublishYear: integer("first_publish_year"),
        status: readingStatusEnum("status").notNull().default("por-leer"),
        userRating: integer("user_rating"),
        notes: text("notes"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("library_books_user_olid_unique").on(table.userId, table.olid),
        uniqueIndex("library_books_user_isbn_unique").on(table.userId, table.isbn),
    ],
);

export const posts = pgTable("posts", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    bookOlid: text("book_olid"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const comments = pgTable("comments", {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const postLikes = pgTable(
    "post_likes",
    {
        postId: uuid("post_id")
            .notNull()
            .references(() => posts.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [primaryKey({ columns: [table.postId, table.userId] })],
);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const chatConversations = pgTable("chat_conversations", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// seq serial garantiza orden estable incluso con createdAt coicidentes
// (es la referencia que usa "regenerar" para truncar mensajes posteriores)
export const chatMessages = pgTable(
    "chat_messages",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        conversationId: uuid("conversation_id")
            .notNull()
            .references(() => chatConversations.id, { onDelete: "cascade" }),
        seq: serial("seq").notNull(),
        role: chatRoleEnum("role").notNull(),
        content: text("content").notNull(),
        enlaces: jsonb("enlaces").$type<{ titulo: string; url: string }[] | null>(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("chat_messages_conversation_seq_unique").on(table.conversationId, table.seq),
    ],
);