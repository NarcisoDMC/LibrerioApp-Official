import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getValid } from "../middleware/validate.js";
import { searchService, type SearchParams } from "../services/search.service.js";

export const searchQuerySchema = z.object({
    q: z.string().trim().min(3).max(200).optional(),
    author: z.string().trim().max(100).optional(),
    title: z.string().trim().max(200).optional(),
    subject: z.string().trim().max(100).optional(),
    year: z.coerce.number().int().min(1000).max(2100).optional(),
    sort: z.enum(["new", "old", "relevance", "rating"]).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const categoryParamsSchema = z.object({
    category: z.enum(["novedades", "fantasia", "terror"]),
});

export const categoryQuerySchema = z.object({
    maxResults: z.coerce.number().int().min(1).max(20).default(10),
});

export const olidParamsSchema = z.object({
    olid: z.string().regex(/^OL\d+W$/, "OLID de obra inválido"),
});

export const authorOlidParamsSchema = z.object({
    olid: z.string().regex(/^OL\d+A$/, "OLID de autor inválido"),
});

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const isbnParamsSchema = z.object({
    isbn: z
        .string()
        .trim()
        .transform((s) => s.replace(/[-\s]/g, ""))
        .pipe(z.string().regex(/^(\d{10}|\d{13})$/i, "ISBN inválido")),
});

export const subjectParamsSchema = z.object({
    name: z.string().trim().min(1).max(100),
});

export const trendingQuerySchema = z.object({
    scope: z.enum(["daily", "weekly", "monthly"]).default("daily"),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

async function handle<T>(
    fn: () => Promise<T>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        res.json(await fn());
    } catch (e) {
        next(e);
    }
}

export const catalogController = {
    searchBooks(_req: Request, res: Response, next: NextFunction): void {
        const params = getValid<SearchParams>(res, "validQuery");
        void handle(() => searchService.search(params), res, next);
    },

    categoryBooks(_req: Request, res: Response, next: NextFunction): void {
        const { category } = getValid<z.infer<typeof categoryParamsSchema>>(res, "validParams");
        const { maxResults } = getValid<z.infer<typeof categoryQuerySchema>>(res, "validQuery");
        void handle(() => searchService.byCategory(category, maxResults), res, next);
    },

    bookDetail(_req: Request, res: Response, next: NextFunction): void {
        const { olid } = getValid<z.infer<typeof olidParamsSchema>>(res, "validParams");
        void handle(() => searchService.byOlid(olid), res, next);
    },

    isbnLookup(_req: Request, res: Response, next: NextFunction): void {
        const { isbn } = getValid<z.infer<typeof isbnParamsSchema>>(res, "validParams");
        void handle(() => searchService.byIsbn(isbn), res, next);
    },

    authorProfile(_req: Request, res: Response, next: NextFunction): void {
        const { olid } = getValid<z.infer<typeof authorOlidParamsSchema>>(res, "validParams");
        void handle(() => searchService.authorProfile(olid), res, next);
    },

    authorWorks(_req: Request, res: Response, next: NextFunction): void {
        const { olid } = getValid<z.infer<typeof authorOlidParamsSchema>>(res, "validParams");
        const { page, limit } = getValid<z.infer<typeof paginationQuerySchema>>(res, "validQuery");
        void handle(() => searchService.authorWorks(olid, page, limit), res, next);
    },

    subjectBooks(_req: Request, res: Response, next: NextFunction): void {
        const { name } = getValid<z.infer<typeof subjectParamsSchema>>(res, "validParams");
        const { page, limit } = getValid<z.infer<typeof paginationQuerySchema>>(res, "validQuery");
        void handle(() => searchService.bySubject(name, page, limit), res, next);
    },

    trendingBooks(_req: Request, res: Response, next: NextFunction): void {
        const { scope, limit } = getValid<z.infer<typeof trendingQuerySchema>>(res, "validQuery");
        void handle(() => searchService.trending(scope, limit), res, next);
    },
};