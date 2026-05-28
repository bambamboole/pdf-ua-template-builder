import type { Block } from "../../types/generated/template";

export interface BlockChrome {
  chip: string;
  label: string;
}

const CHROME: Record<string, BlockChrome> = {
  heading: { chip: "H", label: "Heading" },
  text: { chip: "¶", label: "Text" },
  html: { chip: "</>", label: "HTML" },
  image: { chip: "◇", label: "Image" },
  table: { chip: "▦", label: "Table" },
  "key-value": { chip: "≡", label: "Key-Value" },
  spacer: { chip: "↕", label: "Spacer" },
  divider: { chip: "─", label: "Divider" },
};

export function getBlockChrome(type: string): BlockChrome {
  return CHROME[type] ?? { chip: "?", label: prettify(type) };
}

export function getBlockSummary(block: Block): string {
  switch (block.type) {
    case "heading":
    case "text":
      return truncate(block.text);
    case "html":
      return truncate(block.html);
    case "image":
      return truncate(block.alt ?? block.src);
    case "key-value": {
      const fields = block.config?.fields ?? [];

      return fields.length > 0 ? `${fields.length} field${fields.length === 1 ? "" : "s"}` : "";
    }
    case "table": {
      const columns = block.config?.columns ?? [];

      return columns.length > 0
        ? `${columns.length} column${columns.length === 1 ? "" : "s"}`
        : "";
    }
    case "spacer": {
      const height = block.config?.height;

      return typeof height === "number" ? `${height}mm` : "";
    }
    case "divider": {
      const style = block.config?.style;

      return typeof style === "string" ? style : "";
    }
    default:
      return "";
  }
}

function truncate(value: string | null | undefined, max = 56): string {
  if (!value) {
    return "";
  }

  const single = value.replace(/\s+/g, " ").trim();

  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}

function prettify(type: string): string {
  return type
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
