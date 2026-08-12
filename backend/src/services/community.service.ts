import { ApiError } from "../utils/api-error.js";
import { communityRepo } from "../models/db/repositories/community.repo.js";
import { userRepo } from "../models/db/repositories/user.repo.js";

export interface CreatePostInput {
    title: string;
    content: string;
    bookOlid?: string;
}

export interface CreateCommentInput {
    content: string;
}

function postView(row: Awaited<ReturnType<typeof communityRepo.listPosts>>[number], likeCount: number, commentCount: number) {
    return {
        id: row.post.id,
        bookOlid: row.post.bookOlid,
        title: row.post.title,
        content: row.post.content,
        author: { id: row.post.userId, name: row.authorName },
        likeCount,
        commentCount,
        createdAt: row.post.createdAt,
        updatedAt: row.post.updatedAt,
    };
}

function commentView(row: Awaited<ReturnType<typeof communityRepo.listComments>>[number]) {
    return {
        id: row.comment.id,
        content: row.comment.content,
        author: { id: row.comment.userId, name: row.authorName },
        createdAt: row.comment.createdAt,
    };
}

export interface PostListResult {
    page: number;
    limit: number;
    total: number;
    data: ReturnType<typeof postView>[];
}

export const communityService = {
    async listPosts(page: number, limit: number, bookOlid?: string): Promise<PostListResult> {
        const [total, base] = await Promise.all([
            communityRepo.countPosts(bookOlid),
            communityRepo.listPosts(bookOlid, limit, (page - 1) * limit),
        ]);

        const [likes, comments] = await Promise.all([
            communityRepo.likeCounts(base.map((r) => r.post.id)),
            communityRepo.commentCounts(base.map((r) => r.post.id)),
        ]);

        return {
            page,
            limit,
            total,
            data: base.map((row) => postView(row, likes.get(row.post.id) ?? 0, comments.get(row.post.id) ?? 0)),
        };
    },

    async getPost(id: string) {
        const row = await communityRepo.findPostById(id);
        if (!row) {
            throw new ApiError(404, "Post no encontrado");
        }

        const [likes, comments] = await Promise.all([
            communityRepo.likeCounts([id]),
            communityRepo.listComments(id),
        ]);

        return {
            ...postView(row, likes.get(id) ?? 0, comments.length),
            comments: comments.map(commentView),
        };
    },

    async createPost(userId: string, input: CreatePostInput) {
        const post = await communityRepo.createPost({
            userId,
            bookOlid: input.bookOlid ?? null,
            title: input.title,
            content: input.content,
        });
        const author = await userRepo.findById(userId);
        return postView({ post, authorName: author?.name ?? "" }, 0, 0);
    },

    async addComment(postId: string, userId: string, input: CreateCommentInput) {
        const post = await communityRepo.findPostById(postId);
        if (!post) {
            throw new ApiError(404, "Post no encontrado");
        }
        const comment = await communityRepo.createComment(postId, userId, input.content);
        const author = await userRepo.findById(userId);
        return commentView({ comment, authorName: author?.name ?? "" });
    },

    // Toggle: devuelve el nuevo estado tras la operación
    async toggleLike(postId: string, userId: string): Promise<{ liked: boolean }> {
        const post = await communityRepo.findPostById(postId);
        if (!post) {
            throw new ApiError(404, "Post no encontrado");
        }

        if (await communityRepo.hasLike(postId, userId)) {
            await communityRepo.removeLike(postId, userId);
            return { liked: false };
        }
        await communityRepo.addLike(postId, userId);
        return { liked: true };
    },
};
