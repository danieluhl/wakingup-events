CREATE TABLE "workspace" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"name" TEXT NOT NULL,
	"slug" TEXT NOT NULL,
	"locality" TEXT NOT NULL,
	"region" TEXT,
	"country_code" TEXT NOT NULL,
	"timezone" TEXT NOT NULL,
	"status" TEXT NOT NULL DEFAULT 'active',
	"created_by_user_id" TEXT NOT NULL REFERENCES "user" ("id"),
	"created_at" INTEGER NOT NULL DEFAULT (unixepoch()),
	"updated_at" INTEGER NOT NULL DEFAULT (unixepoch()),
	CONSTRAINT "workspace_status_check" CHECK ("status" IN ('active', 'archived'))
);

CREATE UNIQUE INDEX "workspace_slug_idx" ON "workspace" ("slug");

CREATE TABLE "workspace_member" (
	"workspace_id" TEXT NOT NULL REFERENCES "workspace" ("id") ON DELETE CASCADE,
	"user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
	"role" TEXT NOT NULL DEFAULT 'member',
	"created_at" INTEGER NOT NULL DEFAULT (unixepoch()),
	PRIMARY KEY ("workspace_id", "user_id"),
	CONSTRAINT "workspace_member_role_check" CHECK ("role" IN ('owner', 'admin', 'organizer', 'member'))
);

CREATE INDEX "workspace_member_user_id_idx" ON "workspace_member" ("user_id");

CREATE TABLE "workspace_invitation" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"workspace_id" TEXT NOT NULL REFERENCES "workspace" ("id") ON DELETE CASCADE,
	"email" TEXT NOT NULL,
	"role" TEXT NOT NULL DEFAULT 'member',
	"token_hash" TEXT NOT NULL,
	"invited_by_user_id" TEXT NOT NULL REFERENCES "user" ("id"),
	"expires_at" INTEGER NOT NULL,
	"accepted_at" INTEGER,
	"created_at" INTEGER NOT NULL DEFAULT (unixepoch()),
	CONSTRAINT "workspace_invitation_role_check" CHECK ("role" IN ('admin', 'organizer', 'member'))
);

CREATE INDEX "workspace_invitation_workspace_id_idx" ON "workspace_invitation" ("workspace_id");
CREATE INDEX "workspace_invitation_email_idx" ON "workspace_invitation" ("email");
CREATE UNIQUE INDEX "workspace_invitation_token_hash_idx" ON "workspace_invitation" ("token_hash");

CREATE TABLE "workspace_subscription" (
	"workspace_id" TEXT NOT NULL REFERENCES "workspace" ("id") ON DELETE CASCADE,
	"user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
	"event_updates" INTEGER NOT NULL DEFAULT 1,
	"subscribed_at" INTEGER NOT NULL DEFAULT (unixepoch()),
	"unsubscribed_at" INTEGER,
	PRIMARY KEY ("workspace_id", "user_id")
);

CREATE INDEX "workspace_subscription_user_id_idx" ON "workspace_subscription" ("user_id");
