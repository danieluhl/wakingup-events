import { execFileSync } from "node:child_process";

export default function cleanupPlaywrightUsers() {
	execFileSync(
		"pnpm",
		[
			"exec",
			"wrangler",
			"d1",
			"execute",
			"DB",
			"--local",
			"--command",
			"DELETE FROM workspace WHERE created_by_user_id IN (SELECT id FROM user WHERE email LIKE 'playwright-%@example.com'); DELETE FROM user WHERE email LIKE 'playwright-%@example.com'",
		],
		{ stdio: "ignore" },
	);
}
