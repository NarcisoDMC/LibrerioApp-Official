// ── Tipos espejo del API Express ────────────────────────────────────────────

export interface SafeUser {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export interface AuthResponse {
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
}

export interface ApiErrorBody {
    error: string;
    details?: unknown;
}

// ── Catálogo ────────────────────────────────────────────────────────────────

export interface Book {
    id: string;
    title: string;
    author: string;
    rating: number | string;
    cover: string | null;
    firstPublishYear?: number | null;
    isbn?: string | null;
}

export interface BookDetail {
    id: string;
    key: string;
    title: string;
    authors: string[];
    author: string;
    description: string | null;
    subjects: string[];
    firstPublishDate: string | null;
    cover: string | null;
    isbn: string | null;
}

export interface SearchResult {
    start: number;
    numFound: number;
    page: number;
    limit: number;
    data: Book[];
}

// ── Biblioteca ──────────────────────────────────────────────────────────────

export type ReadingStatus = "por-leer" | "leyendo" | "leido";

export interface LibraryBook {
    id: string;
    olid: string;
    isbn: string | null;
    title: string;
    author: string;
    cover: string | null;
    firstPublishYear: number | null;
    status: ReadingStatus;
    userRating: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

// ── Comunidad ───────────────────────────────────────────────────────────────

export interface CommunityAuthor {
    id: string;
    name: string;
}

export interface PostView {
    id: string;
    bookOlid: string | null;
    title: string;
    content: string;
    author: CommunityAuthor;
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PostListResult {
    page: number;
    limit: number;
    total: number;
    data: PostView[];
}

export interface CommentView {
    id: string;
    content: string;
    author: CommunityAuthor;
    createdAt: string;
}

export interface PostDetail extends PostView {
    comments: CommentView[];
}
