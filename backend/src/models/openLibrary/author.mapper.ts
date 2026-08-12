import type { Author } from "../../types/catalog.js";
import { authorPhotoUrl, olidFromKey, parseOlText } from "./helpers.js";
import type { OLAuthorJson } from "./ol-types.js";

export function mapAuthorProfile(raw: OLAuthorJson): Author {
    const photoId = raw.photos?.find((p) => p > 0);
    return {
        id: olidFromKey(raw.key),
        name: raw.name,
        bio: parseOlText(raw.bio),
        birthDate: raw.birth_date ?? null,
        deathDate: raw.death_date ?? null,
        photo: authorPhotoUrl(photoId),
    };
}