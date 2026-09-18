import { expect, test } from "@playwright/test";

test("an owner updates and deletes a group", async ({ page }) => {
	const uniqueId = crypto.randomUUID();
	const workspaceSlug = `settings-${uniqueId}`;
	const updatedSlug = `updated-${uniqueId}`;

	await page.goto("/login");
	await page.getByRole("button", { name: "Create a new account" }).click();
	await page.getByLabel("Name").fill("Settings Owner");
	await page.getByLabel("Email").fill(`settings-${uniqueId}@example.com`);
	await page.getByLabel("Password").fill("local-test-password");
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/home$/);
	await page.goto("/groups/new");
	await page.getByLabel("Group name").fill("Settings Group");
	await page.getByLabel("Group URL").fill(workspaceSlug);
	await page.getByLabel("City or locality").fill("Portland");
	await page.getByLabel("State, province, or region").fill("Oregon");
	await page.getByLabel("Country code").fill("US");
	await page.getByLabel("Timezone").fill("America/Los_Angeles");
	await page.getByRole("button", { name: "Create group" }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}$`));
	await page.getByLabel("Group name").fill("Updated Settings Group");
	await page.getByLabel("Group URL").fill(updatedSlug);
	await page.getByLabel("City or locality").fill("Seattle");
	await page.getByRole("button", { name: "Save settings" }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${updatedSlug}$`));
	await expect(
		page.getByRole("heading", { name: "Updated Settings Group", level: 1 }),
	).toBeVisible();
	await expect(page.getByText("Group settings saved.")).toBeVisible();

	await page
		.getByLabel("Type Updated Settings Group to confirm")
		.fill("Updated Settings Group");
	await page.getByRole("button", { name: "Delete group" }).click();

	await expect(page).toHaveURL(/\/home$/);
	await expect(
		page.getByRole("link", { name: "Updated Settings Group" }),
	).toHaveCount(0);
});
