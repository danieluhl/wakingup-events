CREATE TABLE "meeting_type" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"workspace_id" TEXT NOT NULL REFERENCES "workspace" ("id") ON DELETE CASCADE,
	"title" TEXT NOT NULL,
	"description" TEXT,
	"alert" TEXT,
	"instructions" TEXT,
	"sort_order" INTEGER NOT NULL DEFAULT 0,
	"created_at" INTEGER NOT NULL DEFAULT (unixepoch()),
	"updated_at" INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX "meeting_type_workspace_id_idx" ON "meeting_type" ("workspace_id");

ALTER TABLE "event" ADD COLUMN "meeting_type_id" TEXT REFERENCES "meeting_type" ("id") ON DELETE SET NULL;
