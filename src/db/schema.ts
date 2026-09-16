import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: integer({ mode: "boolean" }).notNull(),
	image: text(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const sessions = sqliteTable(
	"session",
	{
		id: text().primaryKey(),
		expiresAt: text().notNull(),
		token: text().notNull().unique(),
		createdAt: text().notNull(),
		updatedAt: text().notNull(),
		ipAddress: text(),
		userAgent: text(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const accounts = sqliteTable(
	"account",
	{
		id: text().primaryKey(),
		accountId: text().notNull(),
		providerId: text().notNull(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text(),
		refreshToken: text(),
		idToken: text(),
		accessTokenExpiresAt: text(),
		refreshTokenExpiresAt: text(),
		scope: text(),
		password: text(),
		createdAt: text().notNull(),
		updatedAt: text().notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verifications = sqliteTable(
	"verification",
	{
		id: text().primaryKey(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: text().notNull(),
		createdAt: text().notNull(),
		updatedAt: text().notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const todos = sqliteTable("todos", {
	id: integer({ mode: "number" }).primaryKey({
		autoIncrement: true,
	}),
	title: text().notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});
