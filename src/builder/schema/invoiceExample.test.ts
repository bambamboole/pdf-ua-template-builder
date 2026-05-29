import { describe, expect, it } from "vitest";
import type { Block } from "../../types/generated/template";
import { createInvoiceExample } from "./invoiceExample";

type ExampleTemplate = ReturnType<typeof createInvoiceExample>["template"];

function collectBlocks(template: ExampleTemplate): Block[] {
  const blocks: Block[] = [];

  for (const row of template.rows ?? []) {
    blocks.push(...row.blocks);
  }

  for (const row of template.config?.page?.footer?.rows ?? []) {
    blocks.push(...(row.blocks as Block[]));
  }

  return blocks;
}

function blockIds(template: ExampleTemplate): string[] {
  return collectBlocks(template)
    .map((block) => block.id)
    .filter((id): id is string => typeof id === "string");
}

describe("createInvoiceExample", () => {
  it("gives every identified block a unique id", () => {
    const ids = blockIds(createInvoiceExample().template);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keys runtime data by table block ids that exist in the template", () => {
    const { template, data } = createInvoiceExample();
    const blocksById = new Map(
      collectBlocks(template)
        .filter((block): block is Block & { id: string } => typeof block.id === "string")
        .map((block) => [block.id, block]),
    );

    const keys = Object.keys(data);
    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      expect(blocksById.get(key)?.type).toBe("table");
    }
  });

  it("provides array row data for every data key", () => {
    const { data } = createInvoiceExample();

    for (const rows of Object.values(data)) {
      expect(Array.isArray(rows)).toBe(true);
    }
  });
});
