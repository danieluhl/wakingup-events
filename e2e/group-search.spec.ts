import { expect, test } from "@playwright/test";

test("an owner searches for nearby groups", async ({ page }) => {
	const uniqueId = crypto.randomUUID();

	await page.goto("/login");
	await page.getByRole("button", { name: "Create a new account" }).click();
	await page.getByLabel("Name").fill("Searching Owner");
	await page.getByLabel("Email").fill(`search-${uniqueId}@example.com`);
	await page.getByLabel("Password").fill("local-test-password");
	await page.getByRole("button", { name: "Create account" }).click();
	await expect(page).toHaveURL(/\/home$/);

	await page.getByRole("link", { name: "Find a group", exact: true }).click();
	await expect(page).toHaveURL(/\/groups\/search$/);
	await expect(
		page.getByRole("heading", { name: "Find a group" }),
	).toBeVisible();

	await page.route("**/api/groups/search**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				origin: { latitude: 42.38, longitude: -71.12 },
				locations: [
					{
						id: "address-1",
						workspaceId: "group-1",
						name: "Somerville Sits",
						slug: "somerville-sits",
						label: "Central Square",
						latitude: 42.39,
						longitude: -71.1,
						distanceMiles: 1.2,
						address: "1 Central Square, Cambridge, MA, US",
					},
				],
			}),
		}),
	);

	await page.getByLabel("ZIP code").fill("02143");
	await page.getByRole("button", { name: "Search" }).click();

	await expect(page.getByText("Somerville Sits")).toBeVisible();
	await expect(page.getByText("1.2 miles away")).toBeVisible();
	await expect(
		page.getByTestId("map").or(page.getByText("Map unavailable")),
	).toBeVisible();
	await expect(page.getByText("Something went wrong!")).toHaveCount(0);
});
