//Configuramos el manejo de variables de entorno de la aplicacion

import "dotenv/config"; //Carga y maneja automaticamente las variables de entorno declaradas en nuestro .env
import { z } from "zod"; //Es una biblioteca de declaracion y validacion de esquemas 

// declaramos un esquema de entrada para las variables de entornos
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    CORS_ORIGIN: z
        .string()
        .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean))
        .pipe(z.array(z.string().url()))
        .default("http://localhost:3000"),
    OL_CONTACT_EMAIL: z.string().email(),
    // ── Requeridas desde la Fase 4 (Base de datos + Auth) ──
    DATABASE_URL: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    // ── Requerida a partir de la Fase 7 (Bibliotecario IA) ──
    DEEPSEEK_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;