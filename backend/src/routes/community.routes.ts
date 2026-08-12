import { Router } from "express";
import {
    commentBodySchema,
    communityController,
    communityParamsSchema,
    listPostsQuerySchema,
    postBodySchema,
} from "../controllers/community.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";

export const communityRouter = Router();

// La lectura es pública; las escrituras exigen sesión
communityRouter.get("/posts", validateQuery(listPostsQuerySchema), communityController.listPosts);
communityRouter.get("/posts/:id", validateParams(communityParamsSchema), communityController.getPost);
communityRouter.post("/posts", requireAuth, validateBody(postBodySchema), communityController.createPost);
communityRouter.post(
    "/posts/:id/comments",
    requireAuth,
    validateParams(communityParamsSchema),
    validateBody(commentBodySchema),
    communityController.addComment,
);
communityRouter.post(
    "/posts/:id/like",
    requireAuth,
    validateParams(communityParamsSchema),
    communityController.toggleLike,
);
