import { env } from "cloudflare:workers";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	basePath: "/api/auth",
	database: env.DB,
	secret: env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
	},
	plugins: [dash({ apiKey: env.BETTER_AUTH_API_KEY }), tanstackStartCookies()],
});
