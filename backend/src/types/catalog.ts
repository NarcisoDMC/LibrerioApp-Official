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

export interface Author {
    id: string;
    name: string;
    bio: string | null;
    birthDate: string | null;
    deathDate: string | null;
    photo: string | null;
}

export interface SearchResult {
    start: number;
    numFound: number;
    page: number;
    limit: number;
    data: Book[];
}

export type CategoryKey = "novedades" | "fantasia" | "terror";

export type TrendingScope = "daily" | "weekly" | "monthly";