import { expect, test } from "@playwright/test";

test("starts Google login with the localhost callback", async ({
	baseURL,
	page,
}) => {
	test.skip(!baseURL, "Playwright baseURL is required");

	let googleAuthorizationURL: URL | undefined;
	await page.route("https://accounts.google.com/**", async (route) => {
		googleAuthorizationURL = new URL(route.request().url());
		await route.fulfill({
			contentType: "text/html",
			body: "<h1>Google authorization requested</h1>",
		});
	});

	await page.goto("/login");
	const signInResponsePromise = page.waitForResponse(
		(response) =>
			response.url().endsWith("/api/auth/sign-in/social") &&
			response.request().method() === "POST",
	);
	await page.getByRole("button", { name: "Continue with Google" }).click();

	const signInResponse = await signInResponsePromise;
	expect(signInResponse.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Google authorization requested" }),
	).toBeVisible();

	expect(googleAuthorizationURL?.origin).toBe("https://accounts.google.com");
	expect(googleAuthorizationURL?.pathname).toBe("/o/oauth2/v2/auth");
	expect(googleAuthorizationURL?.searchParams.get("redirect_uri")).toBe(
		`${baseURL}/api/auth/callback/google`,
	);
	expect(googleAuthorizationURL?.searchParams.get("response_type")).toBe(
		"code",
	);
	expect(googleAuthorizationURL?.searchParams.get("state")).toBeTruthy();
	expect(googleAuthorizationURL?.searchParams.get("scope")).toContain("openid");
});
