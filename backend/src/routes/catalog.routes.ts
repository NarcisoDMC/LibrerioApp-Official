import { Router } from "express";
import { catalogController } from "../controllers/catalog.controller.js";
import {
    authorOlidParamsSchema,
    categoryParamsSchema,
    categoryQuerySchema,
    isbnParamsSchema,
    olidParamsSchema,
    paginationQuerySchema,
    searchQuerySchema,
    subjectParamsSchema,
    trendingQuerySchema,
} from "../controllers/catalog.controller.js";
import { catalogLimiter } from "../middleware/rateLimit.js";
import { validateParams, validateQuery } from "../middleware/validate.js";

export const catalogRouter = Router();

// Todo el catálogo pasa por el rate limit (protege el cupo de OpenLibrary)
catalogRouter.use(catalogLimiter);

catalogRouter.get(
    "/books/search",
    validateQuery(searchQuerySchema),
    catalogController.searchBooks,
);
catalogRouter.get(
    "/books/category/:category",
    validateParams(categoryParamsSchema),
    validateQuery(categoryQuerySchema),
    catalogController.categoryBooks,
);
catalogRouter.get(
    "/books/isbn/:isbn",
    validateParams(isbnParamsSchema),
    catalogController.isbnLookup,
);
catalogRouter.get(
    "/books/:olid",
    validateParams(olidParamsSchema),
    catalogController.bookDetail,
);
catalogRouter.get(
    "/authors/:olid/books",
    validateParams(authorOlidParamsSchema),
    validateQuery(paginationQuerySchema),
    catalogController.authorWorks,
);
catalogRouter.get(
    "/authors/:olid",
    validateParams(authorOlidParamsSchema),
    catalogController.authorProfile,
);
catalogRouter.get(
    "/subjects/:name",
    validateParams(subjectParamsSchema),
    validateQuery(paginationQuerySchema),
    catalogController.subjectBooks,
);
catalogRouter.get(
    "/trending",
    validateQuery(trendingQuerySchema),
    catalogController.trendingBooks,
);