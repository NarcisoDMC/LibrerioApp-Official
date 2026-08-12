import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/models/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        // generate no necesita URL real; migrate sí (debe estar en .env)
        url: process.env.DATABASE_URL ?? "",
    },
});