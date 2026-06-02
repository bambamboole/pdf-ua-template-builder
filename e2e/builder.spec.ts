import { expect, test } from "@playwright/test";
import {
  addBlockButton,
  blockInspector,
  blockPalette,
  canvasBlocks,
  firstColumnResizer,
  loadExampleButton,
  outputPane,
  pageSettings,
  pdfObject,
  renderButton,
} from "./helpers";

test.describe("builder shell", () => {
  test("loads the builder shell and schema without error", async ({ page }) => {
    await page.goto("/");

    await expect(pageSettings(page)).toBeVisible();
    await expect(loadExampleButton(page)).toBeEnabled();
    await expect(blockPalette(page)).toBeVisible();
    await expect(outputPane(page)).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("adds a block from the palette and selects it", async ({ page }) => {
    await page.goto("/");

    // The builder seeds with the invoice example; wait for it to render and the
    // schema-backed palette to be ready before counting blocks.
    await expect(canvasBlocks(page).first()).toBeVisible();
    await expect(loadExampleButton(page)).toBeEnabled();
    const initialCount = await canvasBlocks(page).count();

    await addBlockButton(page, "Text").click();
    await expect(canvasBlocks(page)).toHaveCount(initialCount + 1);

    // A new block is appended to the body, which is the first page sheet
    // (the footer sheet and preview follow it in the DOM).
    const bodySheet = page.locator('[data-theme="light"]').first();
    await bodySheet.getByRole("article").last().click();
    await expect(blockInspector(page)).toBeVisible();
    await expect(blockInspector(page).getByText("Content")).toBeVisible();
    await expect(blockInspector(page).getByLabel("Text", { exact: true })).toBeVisible();
  });
});

test("resizing a column changes the adjacent block width", async ({ page }) => {
  await page.goto("/");
  await loadExampleButton(page).click();

  const resizer = firstColumnResizer(page);
  await expect(resizer).toBeVisible();

  const leftBlock = resizer.locator("xpath=preceding-sibling::*[1]");
  const before = await leftBlock.boundingBox();
  expect(before, "left block should have a bounding box").not.toBeNull();

  const handle = await resizer.boundingBox();
  expect(handle, "resizer should have a bounding box").not.toBeNull();
  const startX = handle!.x + handle!.width / 2;
  const y = handle!.y + handle!.height / 2;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX + 120, y, { steps: 10 });
  await page.mouse.up();

  await expect(async () => {
    const after = await leftBlock.boundingBox();
    expect(after).not.toBeNull();
    expect(Math.abs(after!.width - before!.width)).toBeGreaterThan(20);
  }).toPass();
});

test("renders a PDF through the backend", async ({ page }) => {
  await page.goto("/");
  await loadExampleButton(page).click();

  const renderResponse = page.waitForResponse(
    (res) => res.url().includes("/render/template") && res.request().method() === "POST",
    { timeout: 60_000 },
  );
  await renderButton(page).click();
  const response = await renderResponse;
  expect(response.status()).toBe(200);

  await expect(outputPane(page).getByText("Ready")).toBeVisible({ timeout: 60_000 });
  await expect(pdfObject(page)).toHaveAttribute("data", /^blob:/);

  await outputPane(page).getByRole("tab", { name: "Validation" }).click();
  await expect(outputPane(page).getByText(/checks passed/)).toBeVisible();
});
