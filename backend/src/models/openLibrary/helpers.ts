export type CoverSize = "S" | "M" | "L";

export function bookCoverUrl(coverId: number | undefined | null, size: CoverSize = "M"): string | null {
    if (!coverId || coverId < 0) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export function olidCoverUrl(olid: string | undefined | null, size: CoverSize = "M"): string | null {
    if (!olid) return null;
    return `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg`;
}

export function authorPhotoUrl(photoId: number | undefined | null, size: CoverSize = "M"): string | null {
    if (!photoId || photoId < 0) return null;
    return `https://covers.openlibrary.org/a/id/${photoId}-${size}.jpg`;
}

export function olidFromKey(key: string): string {
    return key.replace("/works/", "").replace("/authors/", "").replace("/books/", "");
}

export function parseOlText(value: string | { value: string } | undefined): string | null {
    if (typeof value === "string") return value;
    return value?.value ?? null;
}

export function isSuspiciousTitle(title: string): boolean {
    return title.match(/<[a-z][\s\S]*>/i) !== null;
}