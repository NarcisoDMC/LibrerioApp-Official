export interface OLSearchDoc {
    key: string;
    title: string;
    author_name?: string[];
    author_key?: string[];
    cover_i?: number;
    cover_edition_key?: string;
    first_publish_year?: number;
    ratings_average?: number;
    isbn?: string[];
}

export interface OLSearchResponse {
    num_found: number;
    start: number;
    docs: OLSearchDoc[];
}

export interface OLWorkJson {
    key: string;
    title: string;
    authors?: { author: { key: string }; type?: { key: string } }[];
    covers?: number[];
    description?: string | { value: string };
    first_publish_date?: string;
    subjects?: string[];
    isbn?: string[];
}

export interface OLEditionJson {
    key: string;
    title: string;
    authors?: { key: string }[];
    covers?: number[];
    publish_date?: string;
    isbn_13?: string[];
    isbn_10?: string[];
}

export interface OLAuthorJson {
    key: string;
    name: string;
    bio?: string | { value: string };
    birth_date?: string;
    death_date?: string;
    photos?: number[];
}

export interface OLSubjectWork {
    key: string;
    title: string;
    cover_id?: number;
    first_publish_year?: number;
    authors?: { key: string; name: string }[];
}

export interface OLSubjectResponse {
    work_count: number;
    works: OLSubjectWork[];
}

export interface OLTrendingResponse {
    works: OLSearchDoc[];
}