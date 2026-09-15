import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.ts";

const dbUrl = process.env.DATABASE_URL as string;
export const db = drizzle(dbUrl, { schema });
