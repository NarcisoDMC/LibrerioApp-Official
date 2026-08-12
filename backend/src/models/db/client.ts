import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../../config/env.js";
import * as schema from "./schema.js";

// prepare:false es lo recomendado para entornos serverless (Neon):
// las consultas se preparan en cada conexión, no se cachean por proceso.
const client = postgres(env.DATABASE_URL, { max: 10, prepare: false });

export const db = drizzle(client, { schema });