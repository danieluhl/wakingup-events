import { expect, test } from "@playwright/test";

test("an owner creates a group and is assigned the owner role", async ({
	page,
}) => {
	const email = `playwright-${crypto.randomUUID()}@example.com`;
	const name = "Playwright Owner";
	const password = "local-test-password";
	const workspaceName = "Halcyon";
	const workspaceSlug = `halcyon-${crypto.randomUUID()}`;

	await page.goto("/");
	await page.getByRole("link", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/login$/);

	await page.getByRole("button", { name: "Create a new account" }).click();
	await page.getByLabel("Name").fill(name);
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/home$/);
	await page
		.getByRole("main")
		.getByRole("link", { name: "Create group" })
		.click();

	await page.getByLabel("Group name").fill(workspaceName);
	await page.getByLabel("Group URL").fill(workspaceSlug);
	await page.getByLabel("City or locality").fill("Halcyon");
	await page.getByLabel("State, province, or region").fill("California");
	await page.getByLabel("Country code").fill("US");
	await page.getByLabel("Timezone").fill("America/Los_Angeles");
	await page.getByLabel("Street address").fill("123 Cedar Street");
	await page.getByLabel("Meeting city").fill("Somerville");
	await page.getByLabel("Address country").fill("US");
	await page.getByRole("button", { name: "Create group" }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}$`));
	await expect(
		page.getByRole("heading", { name: workspaceName }),
	).toBeVisible();
	await expect(page.getByText("123 Cedar Street")).toBeVisible();
	await expect(
		page.locator('[data-slot="badge"]').filter({ hasText: "owner" }),
	).toBeVisible();
	await expect(
		page.getByText("Your role in this group is owner."),
	).toBeVisible();

	await page.getByRole("link", { name: "Home" }).first().click();
	await expect(page).toHaveURL(/\/home$/);
	await expect(
		page.getByRole("main").getByRole("link", { name: "Create group" }),
	).toHaveCount(0);
});
