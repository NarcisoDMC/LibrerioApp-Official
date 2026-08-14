import { pathToFileURL } from "node:url";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { healthRouter } from "./routes/health.routes.js";
import { catalogRouter } from "./routes/catalog.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { communityRouter } from "./routes/community.routes.js";
import { libraryRouter } from "./routes/library.routes.js";
import { bibliotecarioRouter } from "./routes/bibliotecario.routes.js";
import { requestLogger } from "./middleware/requestLogger.js";

export function createApp(): Express {
    const app = express();

    // ── Seguridad transversal ─────────────────────────────────────
    app.use(helmet()); // cabeceras de seguridad
    app.use(cors({ origin: env.CORS_ORIGIN })); //Quien puede hacer peticiones al backend (front)
    app.use(express.json({ limit: "100kb" })); //Parsea el body a JSON
    app.use(requestLogger); //registra cada peticion recibida

    // ── Rutas ─────────────────────────────────────────────────────
    // Trazamos los controladores de rutas principales de la aplicacion
    app.use("/api", healthRouter); //
    app.use("/api", catalogRouter);
    app.use("/api/auth", authRouter);
    app.use("/api/library", libraryRouter);
    app.use("/api/community", communityRouter);
    app.use("/api/bibliotecario", bibliotecarioRouter);

    // ── Manejo de errores (SIEMPRE al final) ──────────────────────
    app.use(notFound);
    app.use(errorHandler);

    return app;
}

const isDirectRun =
    process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
    const app = createApp();
    app.listen(env.PORT, () => {
        console.log(`Librerio Backend escuchando en http://localhost:${env.PORT}`);
    });
}