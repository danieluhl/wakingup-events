CREATE TABLE "workspace_address" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"workspace_id" TEXT NOT NULL REFERENCES "workspace" ("id") ON DELETE CASCADE,
	"label" TEXT,
	"street" TEXT NOT NULL,
	"locality" TEXT NOT NULL,
	"region" TEXT,
	"postal_code" TEXT,
	"country_code" TEXT NOT NULL,
	"sort_order" INTEGER NOT NULL DEFAULT 0,
	"created_at" INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX "workspace_address_workspace_id_idx" ON "workspace_address" ("workspace_id");
