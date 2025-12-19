import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detect if we're in a serverless/edge environment (Vercel)
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

let db: ReturnType<typeof drizzleHttp> | ReturnType<typeof drizzleServerless>;

if (isServerless) {
  // Use HTTP driver for Vercel serverless
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleHttp(sql, { schema });
} else {
  // Use WebSocket driver for local development
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleServerless(pool, { schema });
}

export { db };
