import { test, expect } from "./support/fixtures";

// Real user flows against the built UI with the Tauri backend mocked.
test.describe("home", () => {
  test("renders the drop hero and tool sections", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /drop a pdf here/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /merge pdfs/i })).toBeVisible();
  });

  test("shows the empty recents state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/no recent files/i)).toBeVisible();
  });
});

test.describe("navigation", () => {
  test("opening the Merge tool routes to /merge", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /merge pdfs/i }).click();
    await expect(page).toHaveURL(/\/merge$/);
  });

  test("deep-linking to /settings renders the settings screen", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("#root")).not.toBeEmpty();
    // Back-navigation returns to home.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /drop a pdf here/i })).toBeVisible();
  });
});

test.describe("theme toggle", () => {
  test("cycles the theme label when clicked", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /^Theme:/ });
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute("aria-label");
    await toggle.click();
    await expect
      .poll(async () => toggle.getAttribute("aria-label"))
      .not.toBe(before);
  });
});
