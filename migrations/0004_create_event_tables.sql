CREATE TABLE "event" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"workspace_id" TEXT NOT NULL REFERENCES "workspace" ("id") ON DELETE CASCADE,
	"title" TEXT NOT NULL,
	"starts_at" INTEGER NOT NULL,
	"duration_minutes" INTEGER NOT NULL,
	"location" TEXT NOT NULL,
	"organizer_user_id" TEXT NOT NULL REFERENCES "user" ("id"),
	"created_by_user_id" TEXT NOT NULL REFERENCES "user" ("id"),
	"created_at" INTEGER NOT NULL DEFAULT (unixepoch()),
	"updated_at" INTEGER NOT NULL DEFAULT (unixepoch()),
	CONSTRAINT "event_duration_minutes_check" CHECK ("duration_minutes" > 0)
);

CREATE INDEX "event_workspace_id_idx" ON "event" ("workspace_id");
CREATE INDEX "event_starts_at_idx" ON "event" ("workspace_id", "starts_at");
