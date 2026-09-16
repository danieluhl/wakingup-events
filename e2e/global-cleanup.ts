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
			"DELETE FROM user WHERE email LIKE 'playwright-%@example.com'",
		],
		{ stdio: "ignore" },
	);
}
