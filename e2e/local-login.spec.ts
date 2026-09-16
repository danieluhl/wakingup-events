import { expect, test } from "@playwright/test";

test("creates a local account, signs out, and signs back in", async ({
	page,
}) => {
	const email = `playwright-${crypto.randomUUID()}@example.com`;
	const name = "Playwright Local User";
	const password = "local-test-password";

	await page.goto("/");
	await page.getByRole("link", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/login$/);

	await page
		.getByRole("button", { name: "Create a local account first" })
		.click();
	await page.getByLabel("Name").fill(name);
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole("heading", { name: `Hello, ${name}` }),
	).toBeVisible();
	await expect(page.getByText(email, { exact: true })).toBeVisible();
	await expect(page.locator("pre")).toContainText(email);
	await expect(page.locator("pre")).toContainText('"providerId": "credential"');

	await page.reload();
	await expect(
		page.getByRole("heading", { name: `Hello, ${name}` }),
	).toBeVisible();

	await page.getByRole("button", { name: "Sign out" }).click();
	await page.getByRole("link", { name: "Sign in" }).click();
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Sign in", exact: true }).click();

	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole("heading", { name: `Hello, ${name}` }),
	).toBeVisible();
	await expect(page.locator("pre")).toContainText(email);
});
