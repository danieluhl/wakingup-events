import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	canChangeWorkspaceRole,
	getAssignableWorkspaceRoles,
	type WorkspaceRole,
} from "./workspace-roles";

describe("workspace roles", () => {
	it("gives members view-only access", () => {
		assert.deepEqual(getAssignableWorkspaceRoles("member"), []);
		assert.equal(canChangeWorkspaceRole("member", "member", "member"), false);
	});

	it("lets organizers manage member and organizer roles only", () => {
		assert.deepEqual(getAssignableWorkspaceRoles("organizer"), [
			"member",
			"organizer",
		]);
		assert.equal(
			canChangeWorkspaceRole("organizer", "member", "organizer"),
			true,
		);
		assert.equal(
			canChangeWorkspaceRole("organizer", "organizer", "member"),
			true,
		);
		assert.equal(
			canChangeWorkspaceRole("organizer", "admin", "organizer"),
			false,
		);
		assert.equal(canChangeWorkspaceRole("organizer", "member", "admin"), false);
	});

	it("lets admins manage every role except owners", () => {
		assert.deepEqual(getAssignableWorkspaceRoles("admin"), [
			"member",
			"organizer",
			"admin",
		]);
		assert.equal(canChangeWorkspaceRole("admin", "member", "admin"), true);
		assert.equal(canChangeWorkspaceRole("admin", "admin", "member"), true);
		assert.equal(canChangeWorkspaceRole("admin", "owner", "admin"), false);
		assert.equal(canChangeWorkspaceRole("admin", "admin", "owner"), false);
	});

	it("lets owners manage every workspace role", () => {
		assert.deepEqual(getAssignableWorkspaceRoles("owner"), [
			"member",
			"organizer",
			"admin",
			"owner",
		]);

		const roles: WorkspaceRole[] = ["member", "organizer", "admin", "owner"];
		for (const targetRole of roles) {
			for (const nextRole of roles) {
				assert.equal(
					canChangeWorkspaceRole("owner", targetRole, nextRole),
					true,
				);
			}
		}
	});
});
