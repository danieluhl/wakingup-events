import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { accounts, sessions, users } from "#/db/schema";
import { auth } from "#/lib/auth";

const getCurrentUserData = async ({ request }: { request: Request }) => {
	const currentSession = await auth.api.getSession({
		headers: request.headers,
	});

	if (!currentSession) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const db = drizzle(env.DB);
	const userId = currentSession.user.id;
	const [userRows, accountRows, sessionRows] = await Promise.all([
		db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				emailVerified: users.emailVerified,
				image: users.image,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1),
		db
			.select({
				id: accounts.id,
				accountId: accounts.accountId,
				providerId: accounts.providerId,
				createdAt: accounts.createdAt,
				updatedAt: accounts.updatedAt,
			})
			.from(accounts)
			.where(eq(accounts.userId, userId))
			.orderBy(desc(accounts.createdAt)),
		db
			.select({
				id: sessions.id,
				expiresAt: sessions.expiresAt,
				createdAt: sessions.createdAt,
				updatedAt: sessions.updatedAt,
				ipAddress: sessions.ipAddress,
				userAgent: sessions.userAgent,
			})
			.from(sessions)
			.where(eq(sessions.userId, userId))
			.orderBy(desc(sessions.createdAt)),
	]);

	return Response.json({
		user: userRows[0] ?? null,
		accounts: accountRows,
		sessions: sessionRows,
	});
};

export const Route = createFileRoute("/api/me")({
	server: {
		handlers: {
			GET: getCurrentUserData,
		},
	},
});
