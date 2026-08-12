import { ApiError } from "../utils/api-error.js";
import { libraryRepo, type ReadingStatus } from "../models/db/repositories/library.repo.js";
import { searchService } from "./search.service.js";

export interface AddBookInput {
    olid?: string;
    isbn?: string;
    status?: ReadingStatus;
}

export interface UpdateBookInput {
    status?: ReadingStatus;
    userRating?: number | null;
    notes?: string | null;
}

// La metadatos del libro se resuelven SIEMPRE server-side desde el catálogo:
// el cliente nunca aporta título/autor/portada (no puede inventar contenido)
async function resolveBook(olid: string | undefined, isbn: string | undefined) {
    const query = olid ? `key:/works/${olid}` : `isbn:${isbn}`;
    const result = await searchService.search({ q: query, limit: 1 });
    return result.data[0];
}

export const libraryService = {
    async add(userId: string, input: AddBookInput) {
        const book = await resolveBook(input.olid, input.isbn);
        if (!book) {
            throw new ApiError(404, "Libro no encontrado en el catálogo");
        }

        const existing = await libraryRepo.findByOlid(userId, book.id);
        if (existing) {
            throw new ApiError(409, "Ya tienes este libro en tu biblioteca");
        }

        return libraryRepo.create({
            userId,
            olid: book.id,
            isbn: book.isbn ?? null,
            title: book.title,
            author: book.author,
            coverUrl: book.cover,
            firstPublishYear: book.firstPublishYear ?? null,
            status: input.status ?? "por-leer",
        });
    },

    async list(userId: string, status?: ReadingStatus) {
        return libraryRepo.listByUser(userId, status);
    },

    async update(userId: string, id: string, patch: UpdateBookInput) {
        const updated = await libraryRepo.update(userId, id, patch);
        if (!updated) {
            throw new ApiError(404, "Libro no encontrado en tu biblioteca");
        }
        return updated;
    },

    async remove(userId: string, id: string): Promise<void> {
        const removed = await libraryRepo.remove(userId, id);
        if (!removed) {
            throw new ApiError(404, "Libro no encontrado en tu biblioteca");
        }
    },
};