import { expect, test } from "@playwright/test";

test("an owner defines a meeting type and uses it for an event", async ({
	page,
}) => {
	const uniqueId = crypto.randomUUID();
	const workspaceSlug = `meeting-types-${uniqueId}`;

	await page.goto("/login");
	await page.getByRole("button", { name: "Create a new account" }).click();
	await page.getByLabel("Name").fill("Meeting Type Owner");
	await page.getByLabel("Email").fill(`meeting-types-${uniqueId}@example.com`);
	await page.getByLabel("Password").fill("local-test-password");
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/home$/);
	await page.goto("/groups/new");
	await page.getByLabel("Group name").fill("Meeting Types Group");
	await page.getByLabel("Group URL").fill(workspaceSlug);
	await page.getByLabel("Timezone").fill("America/New_York");
	await page.getByLabel("Street address").fill("1 Central Square");
	await page.getByLabel("Meeting city").fill("Cambridge");
	await page.getByLabel("Address country").fill("US");
	await page.getByRole("button", { name: "Create group" }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}$`));

	await page.getByRole("button", { name: "Add a meeting type" }).click();
	await page.getByLabel("Type name").fill("Weekday morning sitting");
	await page
		.getByLabel("Description")
		.fill("A quiet seated practice before the day begins.");
	await page.getByLabel("Alert").fill("Doors lock at 8:00 sharp.");
	await page
		.getByLabel("Setup instructions")
		.fill(
			"Arrive ten minutes early.\nSit in a circle.\nClose with a short reading.",
		);
	await page.getByRole("button", { name: "Add meeting type" }).click();

	const meetingTypeItem = page
		.getByRole("listitem")
		.filter({ hasText: "Weekday morning sitting" });
	await expect(meetingTypeItem).toBeVisible();
	await expect(
		meetingTypeItem.getByText("A quiet seated practice before the day begins."),
	).toBeVisible();
	await expect(
		meetingTypeItem.getByText("Doors lock at 8:00 sharp."),
	).toBeVisible();
	await expect(
		meetingTypeItem.getByText("Arrive ten minutes early."),
	).toBeVisible();

	await page.getByRole("link", { name: "Events", exact: true }).click();
	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}/events$`));
	await page.getByRole("link", { name: "Add event" }).click();
	await expect(page).toHaveURL(
		new RegExp(`/groups/${workspaceSlug}/events/new$`),
	);

	await page.getByLabel("Event title").fill("Monday morning sitting");
	await page.getByLabel("Date and time").fill("2026-10-05T07:30");
	await page.getByLabel("Hours", { exact: true }).fill("0");
	await page.getByLabel("Minutes", { exact: true }).fill("45");

	await page.getByLabel("What type of event is this?").click();
	await page.getByRole("option", { name: "Weekday morning sitting" }).click();

	await expect(page.getByText("Doors lock at 8:00 sharp.")).toBeVisible();
	await expect(page.getByText("Arrive ten minutes early.")).toBeVisible();

	await page.getByRole("button", { name: "Create event" }).click();

	await expect(page).toHaveURL(new RegExp(`/groups/${workspaceSlug}/events$`));
	const eventItem = page
		.getByRole("listitem")
		.filter({ hasText: "Monday morning sitting" });
	await expect(
		eventItem.getByRole("heading", { name: "Monday morning sitting" }),
	).toBeVisible();
	await expect(eventItem.getByText("Weekday morning sitting")).toBeVisible();
});
