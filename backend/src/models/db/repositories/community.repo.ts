import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../client.js";
import { comments, posts, postLikes, users } from "../schema.js";

export type Post = InferSelectModel<typeof posts>;
export type Comment = InferSelectModel<typeof comments>;

export type PostCreate = {
    userId: string;
    bookOlid: string | null;
    title: string;
    content: string;
};

export type PostListRow = {
    post: Post;
    authorName: string;
    likeCount: number;
    commentCount: number;
};

export type CommentRow = {
    comment: Comment;
    authorName: string;
};

function rowToPostList(row: { post: Post; authorName: string }): Omit<PostListRow, "likeCount" | "commentCount"> {
    return {
        post: row.post,
        authorName: row.authorName,
    };
}

function rowToComment(row: { comment: Comment; authorName: string }): CommentRow {
    return { comment: row.comment, authorName: row.authorName };
}

export const communityRepo = {
    async listPosts(bookOlid: string | undefined, limit: number, offset: number) {
        const rows = await db
            .select({ post: posts, authorName: users.name })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(bookOlid ? eq(posts.bookOlid, bookOlid) : undefined)
            .orderBy(desc(posts.createdAt))
            .limit(limit)
            .offset(offset);
        return rows.map(rowToPostList);
    },

    async countPosts(bookOlid: string | undefined): Promise<number> {
        const rows = await db
            .select({ n: count() })
            .from(posts)
            .where(bookOlid ? eq(posts.bookOlid, bookOlid) : undefined);
        return rows[0]?.n ?? 0;
    },

    // Conteos agregados para un conjunto de posts (2 GROUP BY, sin N+1)
    async likeCounts(postIds: string[]): Promise<Map<string, number>> {
        if (postIds.length === 0) return new Map();
        const rows = await db
            .select({ postId: postLikes.postId, n: count() })
            .from(postLikes)
            .where(inArray(postLikes.postId, postIds))
            .groupBy(postLikes.postId);
        return new Map(rows.map((r) => [r.postId, r.n]));
    },

    async commentCounts(postIds: string[]): Promise<Map<string, number>> {
        if (postIds.length === 0) return new Map();
        const rows = await db
            .select({ postId: comments.postId, n: count() })
            .from(comments)
            .where(inArray(comments.postId, postIds))
            .groupBy(comments.postId);
        return new Map(rows.map((r) => [r.postId, r.n]));
    },

    // Posts a los que un usuario concreto les dio like (para likedByMe)
    async likedPostIds(postIds: string[], userId: string): Promise<Set<string>> {
        if (postIds.length === 0) return new Set();
        const rows = await db
            .select({ postId: postLikes.postId })
            .from(postLikes)
            .where(and(inArray(postLikes.postId, postIds), eq(postLikes.userId, userId)));
        return new Set(rows.map((r) => r.postId));
    },

    async findPostById(id: string) {
        const rows = await db
            .select({ post: posts, authorName: users.name })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(eq(posts.id, id))
            .limit(1);
        return rows[0] ? rowToPostList(rows[0]) : undefined;
    },

    async createPost(input: PostCreate) {
        const rows = await db
            .insert(posts)
            .values(input)
            .returning();
        const row = rows[0];
        if (!row) throw new Error("No se pudo crear el post");
        return row;
    },

    async listComments(postId: string) {
        const rows = await db
            .select({ comment: comments, authorName: users.name })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .where(eq(comments.postId, postId))
            .orderBy(comments.createdAt);
        return rows.map(rowToComment);
    },

    async createComment(postId: string, userId: string, content: string) {
        const rows = await db
            .insert(comments)
            .values({ postId, userId, content })
            .returning();
        const row = rows[0];
        if (!row) throw new Error("No se pudo crear el comentario");
        return row;
    },

    async hasLike(postId: string, userId: string): Promise<boolean> {
        const rows = await db
            .select({ postId: postLikes.postId })
            .from(postLikes)
            .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
            .limit(1);
        return rows.length > 0;
    },

    async addLike(postId: string, userId: string): Promise<void> {
        await db.insert(postLikes).values({ postId, userId }).onConflictDoNothing();
    },

    async removeLike(postId: string, userId: string): Promise<void> {
        await db
            .delete(postLikes)
            .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    },
};
