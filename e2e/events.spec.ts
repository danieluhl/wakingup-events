import { expect, test } from "@playwright/test";

test("an owner adds an event and sees it listed", async ({ page }) => {
	const uniqueId = crypto.randomUUID();
	const workspaceSlug = `events-${uniqueId}`;

	await page.goto("/login");
	await page.getByRole("button", { name: "Create a new account" }).click();
	await page.getByLabel("Name").fill("Event Organizer");
	await page.getByLabel("Email").fill(`events-${uniqueId}@example.com`);
	await page.getByLabel("Password").fill("local-test-password");
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/home$/);
	await page.goto("/groups/new");
	await page.getByLabel("Group name").fill("Events Group");
	await page.getByLabel("Group URL").fill(workspaceSlug);
	await page.getByLabel("City or locality").fill("Cambridge");
	await page.getByLabel("State, province, or region").fill("Massachusetts");
	await page.getByLabel("Country code").fill("US");
	await page.getByLabel("Timezone").fill("America/New_York");
	await page.getByLabel("Street address").fill("1 Central Square");
	await page.getByLabel("Meeting city").fill("Cambridge");
	await page.getByLabel("Address country").fill("US");
	await page.getByRole("button", { name: "Create group" }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}$`));

	await page.getByRole("link", { name: "Events", exact: true }).click();
	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}/events$`));
	await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();

	await page.getByRole("link", { name: "Add event" }).click();
	await expect(page).toHaveURL(
		new RegExp(`/groups/${workspaceSlug}/events/new$`),
	);
	await page.getByLabel("Event title").fill("Sunday morning sitting");
	await page.getByLabel("Date and time").fill("2026-10-03T18:00");
	await page.getByLabel("Duration in minutes").fill("90");
	await page.getByRole("button", { name: "Create event" }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}/events$`));
	const eventItem = page
		.getByRole("listitem")
		.filter({ hasText: "Sunday morning sitting" });
	await expect(
		eventItem.getByRole("heading", { name: "Sunday morning sitting" }),
	).toBeVisible();
	await expect(
		eventItem.getByText("1 Central Square, Cambridge, US"),
	).toBeVisible();
	await expect(eventItem.getByText("1 hr 30 min")).toBeVisible();
	await expect(eventItem.getByText("Event Organizer")).toBeVisible();
});
