import type { Author, Book, BookDetail, CategoryKey, SearchResult, TrendingScope } from "../types/catalog.js";
import { mapAuthorProfile } from "../models/openLibrary/author.mapper.js";
import { mapEditionDetail, mapSearchDoc, mapWorkDetail } from "../models/openLibrary/book.mapper.js";
import { mapSubjectWork } from "../models/openLibrary/subject.mapper.js";
import { olFetch } from "../models/openLibrary/olClient.js";
import type {
    OLAuthorJson,
    OLEditionJson,
    OLSearchResponse,
    OLSubjectResponse,
    OLTrendingResponse,
    OLWorkJson,
} from "../models/openLibrary/ol-types.js";

const SEARCH_FIELDS =
    "key,title,author_name,cover_i,cover_edition_key,first_publish_year,ratings_average,isbn";

export interface SearchParams {
    q?: string;
    author?: string;
    title?: string;
    subject?: string;
    year?: number;
    sort?: "new" | "old" | "relevance" | "rating";
    page?: number;
    limit?: number;
}

export const CATEGORIES: Record<CategoryKey, { query?: string; subject?: string; sort?: string }> = {
    // OL ordena por relevancia de "actualización"; sort=new con *:* está lleno de spam.
    // Filtramos por publicaciones recientes: libros reales y ordenados por fecha.
    novedades: { query: "publish_year:[2024 TO 2026]", sort: "new" },
    fantasia: { subject: "fantasy" },
    terror: { subject: "horror" },
};

const SORT_MAP: Record<NonNullable<SearchParams["sort"]>, string | undefined> = {
    new: "new",
    old: "old",
    relevance: undefined, // sin el parámetro, OL ordena por relevancia
    rating: "rating desc",
};

function cleanBooks(docs: OLSearchResponse["docs"]): Book[] {
    return docs.map(mapSearchDoc).filter((b): b is Book => b !== null);
}

// Los trabajos y ediciones de OL solo traen CLAVES de autor (OL26320A);
// resolvemos los nombres reales consultando cada perfil (paralelo, con
// fallback a la clave para no perder información si alguno falla)
async function resolveAuthorNames(keys: string[]): Promise<string[]> {
    const results = await Promise.allSettled(keys.map((key) => olFetch<OLAuthorJson>(`/authors/${key}.json`)));
    return results.map((r, i) => {
        const fallback = keys[i] ?? "Autor desconocido";
        return r.status === "fulfilled" ? (r.value.name ?? fallback) : fallback;
    });
}

export const searchService = {
    async search(params: SearchParams): Promise<SearchResult> {
        const qs = new URLSearchParams();
        if (params.q) qs.set("q", params.q);
        if (params.author) qs.set("author", params.author);
        if (params.title) qs.set("title", params.title);
        if (params.subject) qs.set("subject", params.subject);
        if (params.year) qs.set("publish_year", String(params.year));
        const sort = SORT_MAP[params.sort ?? "relevance"];
        if (sort !== undefined) qs.set("sort", sort);
        qs.set("fields", SEARCH_FIELDS);
        qs.set("limit", String(params.limit ?? 10));
        qs.set("page", String(params.page ?? 1));

        const raw = await olFetch<OLSearchResponse>(`/search.json?${qs}`);
        return {
            start: raw.start,
            numFound: raw.num_found,
            page: params.page ?? 1,
            limit: params.limit ?? 10,
            data: cleanBooks(raw.docs),
        };
    },

    async byCategory(category: CategoryKey, limit: number): Promise<Book[]> {
        const spec = CATEGORIES[category];
        const qs = new URLSearchParams();
        if (spec.subject) {
            qs.set("q", `subject:${spec.subject} AND language:spa`);
        } else if (spec.query) {
            qs.set("q", spec.query);
            if (spec.sort) qs.set("sort", spec.sort);
        }
        qs.set("fields", SEARCH_FIELDS);
        qs.set("limit", String(limit));

        const raw = await olFetch<OLSearchResponse>(`/search.json?${qs}`);
        return cleanBooks(raw.docs);
    },

    async byOlid(olid: string): Promise<BookDetail> {
        const raw = await olFetch<OLWorkJson>(`/works/${olid}.json`);
        const detail = mapWorkDetail(raw);
        const authorNames = await resolveAuthorNames(detail.authors);
        return { ...detail, authors: authorNames, author: authorNames[0] ?? "Autor desconocido" };
    },

    async byIsbn(isbn: string): Promise<BookDetail> {
        const raw = await olFetch<OLEditionJson>(`/isbn/${isbn}.json`);
        const detail = mapEditionDetail(raw);
        const authorNames = await resolveAuthorNames(detail.authors);
        return { ...detail, authors: authorNames, author: authorNames[0] ?? "Autor desconocido" };
    },

    async authorProfile(olid: string): Promise<Author> {
        const raw = await olFetch<OLAuthorJson>(`/authors/${olid}.json`);
        return mapAuthorProfile(raw);
    },

    async authorWorks(authorKey: string, page: number, limit: number): Promise<SearchResult> {
        const qs = new URLSearchParams({
            q: `author_key:${authorKey}`,
            fields: SEARCH_FIELDS,
            limit: String(limit),
            page: String(page),
        });

        const raw = await olFetch<OLSearchResponse>(`/search.json?${qs}`);
        return {
            start: raw.start,
            numFound: raw.num_found,
            page,
            limit,
            data: cleanBooks(raw.docs),
        };
    },

    async bySubject(name: string, page: number, limit: number): Promise<SearchResult> {
        const qs = new URLSearchParams({
            details: "false",
            limit: String(limit),
            offset: String((page - 1) * limit),
        });

        const raw = await olFetch<OLSubjectResponse>(`/subjects/${encodeURIComponent(name)}.json?${qs}`);
        return {
            start: (page - 1) * limit,
            numFound: raw.work_count,
            page,
            limit,
            data: raw.works.map(mapSubjectWork).filter((b): b is Book => b !== null),
        };
    },

    async trending(scope: TrendingScope, limit: number): Promise<Book[]> {
        const raw = await olFetch<OLTrendingResponse>(`/trending/${scope}.json`);
        return cleanBooks(raw.works.slice(0, limit));
    },
};