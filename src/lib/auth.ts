import { env as workerEnv } from "cloudflare:workers";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "#/env";

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	basePath: "/api/auth",
	database: workerEnv.DB,
	secret: env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
	},
	account: {
		accountLinking: {
			requireLocalEmailVerified: false,
			trustedProviders: ["google"],
		},
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
	plugins: [dash({ apiKey: env.BETTER_AUTH_API_KEY }), tanstackStartCookies()],
});
