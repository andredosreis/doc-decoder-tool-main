import { test, expect } from "@playwright/test"

test.describe("smoke", () => {
  test("app loads and mounts the React root", async ({ page }) => {
    await page.goto("/")
    // Wait for React to mount; AppLayout or any anchor element confirms boot
    await expect(page.locator("#root")).toBeAttached()
    // The root must have rendered children (not be empty)
    await page.waitForFunction(() => {
      const root = document.querySelector("#root")
      return !!root && root.children.length > 0
    }, { timeout: 10_000 })
  })

  test("page title is set", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/APP XPRO/i)
  })
})
