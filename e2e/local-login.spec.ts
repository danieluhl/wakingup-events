import { expect, test } from "@playwright/test";

test("creates a local account, signs out, and signs back in", async ({
	page,
}) => {
	const email = `playwright-${crypto.randomUUID()}@example.com`;
	const name = "Playwright Local User";
	const password = "local-test-password";
	const workspaceSlug = `playwright-${crypto.randomUUID()}`;

	await page.goto("/");
	await page.getByRole("link", { name: "Sign in", exact: true }).click();
	await expect(page).toHaveURL(/\/login$/);

	await page.getByRole("button", { name: "Create a new account" }).click();
	await page.getByLabel("Name").fill(name);
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/home$/);
	await expect(
		page.getByRole("heading", { name: `Welcome, ${name}` }),
	).toBeVisible();
	await expect(
		page.getByRole("main").getByText(email, { exact: true }),
	).toBeVisible();

	await page.reload();
	await expect(
		page.getByRole("heading", { name: `Welcome, ${name}` }),
	).toBeVisible();

	await page
		.getByRole("main")
		.getByRole("link", { name: "Create group" })
		.click();
	await page.getByLabel("Group name").fill("Boston");
	await page.getByLabel("Group URL").fill(workspaceSlug);
	await page.getByLabel("City or locality").fill("Boston");
	await page.getByLabel("State, province, or region").fill("Massachusetts");
	await page.getByLabel("Country code").fill("US");
	await page.getByLabel("Timezone").fill("America/New_York");
	await page.getByRole("button", { name: "Create group" }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}$`));
	await expect(page.getByText("owner", { exact: true })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Boston" })).toBeVisible();

	await page.getByRole("button", { name: "Open user menu" }).click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await page.getByRole("link", { name: "Sign in", exact: true }).click();
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Sign in", exact: true }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}$`));
});
