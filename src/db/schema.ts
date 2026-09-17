import { sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type {
	WorkspaceInvitationRole,
	WorkspaceRole,
} from "#/lib/workspace-roles";

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

export const workspaces = sqliteTable(
	"workspace",
	{
		id: text().primaryKey(),
		name: text().notNull(),
		slug: text().notNull(),
		locality: text().notNull(),
		region: text(),
		countryCode: text("country_code").notNull(),
		timezone: text().notNull(),
		status: text().notNull().default("active"),
		createdByUserId: text("created_by_user_id")
			.notNull()
			.references(() => users.id),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => [
		uniqueIndex("workspace_slug_idx").on(table.slug),
		check(
			"workspace_status_check",
			sql`${table.status} IN ('active', 'archived')`,
		),
	],
);

export const workspaceMembers = sqliteTable(
	"workspace_member",
	{
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text().$type<WorkspaceRole>().notNull().default("member"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => [
		primaryKey({ columns: [table.workspaceId, table.userId] }),
		index("workspace_member_user_id_idx").on(table.userId),
		check(
			"workspace_member_role_check",
			sql`${table.role} IN ('owner', 'admin', 'organizer', 'member')`,
		),
	],
);

export const workspaceInvitations = sqliteTable(
	"workspace_invitation",
	{
		id: text().primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		email: text().notNull(),
		role: text().$type<WorkspaceInvitationRole>().notNull().default("member"),
		tokenHash: text("token_hash").notNull(),
		invitedByUserId: text("invited_by_user_id")
			.notNull()
			.references(() => users.id),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		acceptedAt: integer("accepted_at", { mode: "timestamp" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => [
		index("workspace_invitation_workspace_id_idx").on(table.workspaceId),
		index("workspace_invitation_email_idx").on(table.email),
		uniqueIndex("workspace_invitation_token_hash_idx").on(table.tokenHash),
		check(
			"workspace_invitation_role_check",
			sql`${table.role} IN ('admin', 'organizer', 'member')`,
		),
	],
);

export const workspaceSubscriptions = sqliteTable(
	"workspace_subscription",
	{
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		eventUpdates: integer("event_updates", { mode: "boolean" })
			.notNull()
			.default(true),
		subscribedAt: integer("subscribed_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		unsubscribedAt: integer("unsubscribed_at", { mode: "timestamp" }),
	},
	(table) => [
		primaryKey({ columns: [table.workspaceId, table.userId] }),
		index("workspace_subscription_user_id_idx").on(table.userId),
	],
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
