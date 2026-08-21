import type { IncomingMessage, ServerResponse } from "node:http";

type VercelHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

let app: VercelHandler | null = null;

async function getApp(): Promise<VercelHandler> {
    if (app) return app;
    try {
        const { createApp } = await import("../src/server.js");
        const express = createApp() as unknown as VercelHandler;
        app = express;
        return app;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[api/index] createApp failed:", msg, err);
        throw err;
    }
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
        const app = await getApp();
        return app(req, res);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[api/index] handler error:", msg);
        if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
        }
        res.end(JSON.stringify({ error: "Function initialization failed", detail: msg }));
    }
}