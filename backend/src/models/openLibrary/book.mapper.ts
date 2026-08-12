import type { Book, BookDetail } from "../../types/catalog.js";
import {
    bookCoverUrl,
    olidCoverUrl,
    olidFromKey,
    parseOlText,
    isSuspiciousTitle,
} from "./helpers.js";
import type { OLEditionJson, OLSearchDoc, OLWorkJson } from "./ol-types.js";

function formatRating(value: number | undefined): number | string {
    if (value === undefined) return "–";
    return Math.round(value * 10) / 10;
}

function isSuspiciousDoc(doc: OLSearchDoc): boolean {
    if (isSuspiciousTitle(doc.title)) return true;
    if (
        doc.first_publish_year !== undefined &&
        (doc.first_publish_year < 1000 || doc.first_publish_year > 2026)
    ) {
        return true;
    }
    return false;
}

export function mapSearchDoc(doc: OLSearchDoc): Book | null {
    if (isSuspiciousDoc(doc)) return null;

    return {
        id: olidFromKey(doc.key),
        title: doc.title,
        author: doc.author_name?.[0] ?? "Autor desconocido",
        rating: formatRating(doc.ratings_average),
        cover: bookCoverUrl(doc.cover_i) ?? olidCoverUrl(doc.cover_edition_key),
        firstPublishYear: doc.first_publish_year ?? null,
        isbn: doc.isbn?.[0] ?? null,
    };
}

function mapDetailBase(key: string, title: string, coverId: number | undefined, isbn: string | null): Omit<BookDetail, "author"> {
    return {
        id: olidFromKey(key),
        key,
        title,
        authors: [],
        description: null,
        subjects: [],
        firstPublishDate: null,
        cover: bookCoverUrl(coverId, "L"),
        isbn,
    };
}

export function mapWorkDetail(raw: OLWorkJson): BookDetail {
    const base = mapDetailBase(raw.key, raw.title, raw.covers?.[0], raw.isbn?.[0] ?? null);
    const authors = raw.authors?.map((a) => olidFromKey(a.author.key)) ?? [];
    return {
        ...base,
        authors,
        description: parseOlText(raw.description),
        subjects: raw.subjects?.slice(0, 20) ?? [],
        firstPublishDate: raw.first_publish_date ?? null,
        author: authors[0] ?? "Autor desconocido",
    };
}

export function mapEditionDetail(raw: OLEditionJson): BookDetail {
    const isbn = raw.isbn_13?.[0] ?? raw.isbn_10?.[0] ?? null;
    const base = mapDetailBase(raw.key, raw.title, raw.covers?.[0], isbn);
    const authors = raw.authors?.map((a) => olidFromKey(a.key)) ?? [];
    return {
        ...base,
        authors,
        firstPublishDate: raw.publish_date ?? null,
        author: authors[0] ?? "Autor desconocido",
    };
}