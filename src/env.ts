import { env as workerEnv } from "cloudflare:workers";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * The Cloudflare Worker bindings (`env`) are only available server-side, so
 * the runtime env object is assembled explicitly here. The D1 `DB` binding is
 * a runtime object handled separately (see `src/lib/auth.ts`), not an env var.
 */
const runtimeEnv: Record<string, string | boolean | number | undefined> = {
	BETTER_AUTH_URL: workerEnv.BETTER_AUTH_URL,
	BETTER_AUTH_SECRET: workerEnv.BETTER_AUTH_SECRET,
	BETTER_AUTH_API_KEY: workerEnv.BETTER_AUTH_API_KEY,
	DATABASE_URL: workerEnv.DATABASE_URL,
	GOOGLE_CLIENT_ID: workerEnv.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: workerEnv.GOOGLE_CLIENT_SECRET,
	SERVER_URL: workerEnv.SERVER_URL,
	VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
};

export const env = createEnv({
	server: {
		BETTER_AUTH_URL: z.string().url(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_API_KEY: z.string().min(1).optional(),
		DATABASE_URL: z.string().min(1).optional(),
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		SERVER_URL: z.string().url().optional(),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
	},

	runtimeEnv,

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
