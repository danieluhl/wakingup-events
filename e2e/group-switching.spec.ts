import { expect, type Page, test } from "@playwright/test";

async function createGroup(page: Page, name: string, slug: string) {
	await page.getByLabel("Group name").fill(name);
	await page.getByLabel("Group URL").fill(slug);
	await page.getByLabel("City or locality").fill("Boston");
	await page.getByLabel("State, province, or region").fill("Massachusetts");
	await page.getByLabel("Country code").fill("US");
	await page.getByLabel("Timezone").fill("America/New_York");
	await page.getByRole("button", { name: "Create group" }).click();
	await expect(page).toHaveURL(new RegExp(`/groups/${slug}$`));
}

test("switches groups and restores the selected group on startup", async ({
	page,
}) => {
	const email = `playwright-${crypto.randomUUID()}@example.com`;
	const firstSlug = `first-group-${crypto.randomUUID()}`;
	const secondSlug = `second-group-${crypto.randomUUID()}`;

	await page.goto("/login");
	await page.getByRole("button", { name: "Create a new account" }).click();
	await page.getByLabel("Name").fill("Playwright Group Switcher");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill("local-test-password");
	await page.getByRole("button", { name: "Create account" }).click();
	await expect(page).toHaveURL(/\/home$/);

	await page
		.getByRole("main")
		.getByRole("link", { name: "Create group" })
		.click();
	await createGroup(page, "First Group", firstSlug);

	await page.getByRole("link", { name: "Create group" }).click();
	await createGroup(page, "Second Group", secondSlug);
	const groupSwitcher = page.getByRole("button", {
		name: /Second Group/,
	});
	await expect(groupSwitcher).toBeVisible();
	await groupSwitcher.click();
	await page.getByRole("menuitem", { name: /First Group/ }).click();
	await expect(page).toHaveURL(new RegExp(`/groups/${firstSlug}$`));

	await page.goto("/home");
	await expect(page).toHaveURL(new RegExp(`/groups/${firstSlug}$`));
	await expect(page.getByRole("button", { name: /First Group/ })).toBeVisible();
});
