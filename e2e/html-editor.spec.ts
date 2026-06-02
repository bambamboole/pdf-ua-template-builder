import { expect, test } from "@playwright/test";
import {
  blockPalette,
  htmlEditor,
  jsonEditor,
  modeTab,
  outputPane,
  pdfObject,
  renderButton,
} from "./helpers";

test.describe("editor mode tabs", () => {
  test("switches between builder, JSON, and HTML editors", async ({ page }) => {
    await page.goto("/");

    await expect(blockPalette(page)).toBeVisible();
    await expect(modeTab(page, "Template builder")).toHaveAttribute("aria-selected", "true");

    await modeTab(page, "Template editor").click();
    await expect(jsonEditor(page)).toBeVisible();

    await modeTab(page, "HTML editor").click();
    await expect(htmlEditor(page)).toBeVisible();
    await expect(outputPane(page)).toBeVisible();
  });
});

test("renders HTML to a PDF through the backend", async ({ page }) => {
  await page.goto("/");
  await modeTab(page, "HTML editor").click();
  await expect(htmlEditor(page)).toBeVisible();

  const convertResponse = page.waitForResponse(
    (res) => res.url().includes("/render/html") && res.request().method() === "POST",
    { timeout: 60_000 },
  );
  await renderButton(page).click();
  const response = await convertResponse;
  expect(response.status()).toBe(200);

  await expect(outputPane(page).getByText("Ready")).toBeVisible({ timeout: 60_000 });
  await expect(pdfObject(page)).toHaveAttribute("data", /^blob:/);

  await outputPane(page).getByRole("tab", { name: "Validation" }).click();
  await expect(outputPane(page).getByText(/checks passed/)).toBeVisible();
});
