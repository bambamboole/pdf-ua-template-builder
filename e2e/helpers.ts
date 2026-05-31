import type { Locator, Page } from "@playwright/test";

export function pageSettings(page: Page): Locator {
  return page.locator('section[aria-label="Page settings"]');
}

export function blockPalette(page: Page): Locator {
  return page.getByRole("complementary", { name: "Block palette" });
}

export function outputPane(page: Page): Locator {
  return page.locator('aside[aria-label="Output"]');
}

export function blockInspector(page: Page): Locator {
  return page.locator('aside[aria-label="Block inspector"]');
}

export function loadExampleButton(page: Page): Locator {
  return page.getByRole("button", { name: "Load example" });
}

export function renderButton(page: Page): Locator {
  return page.getByRole("button", { name: /Render PDF|Rendering/ });
}

export function addBlockButton(page: Page, label: string): Locator {
  return page.getByRole("button", { name: `Add ${label}` });
}

export function canvasBlocks(page: Page): Locator {
  return page.getByRole("article");
}

export function firstColumnResizer(page: Page): Locator {
  return page.getByRole("button", { name: /^Resize columns/ }).first();
}

export function pdfObject(page: Page): Locator {
  return page.locator('object[type="application/pdf"]');
}
