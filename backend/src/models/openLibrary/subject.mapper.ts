import type { Book } from "../../types/catalog.js";
import { bookCoverUrl, olidFromKey, isSuspiciousTitle } from "./helpers.js";
import type { OLSubjectWork } from "./ol-types.js";

export function mapSubjectWork(work: OLSubjectWork): Book | null {
    if (isSuspiciousTitle(work.title)) return null;
    if (
        work.first_publish_year !== undefined &&
        (work.first_publish_year < 1000 || work.first_publish_year > 2026)
    ) {
        return null;
    }

    return {
        id: olidFromKey(work.key),
        title: work.title,
        author: work.authors?.[0]?.name ?? "Autor desconocido",
        rating: "–",
        cover: bookCoverUrl(work.cover_id),
        firstPublishYear: work.first_publish_year ?? null,
        isbn: null,
    };
}