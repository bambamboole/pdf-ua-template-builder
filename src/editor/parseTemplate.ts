import type { Template } from "../types/generated/template";

export interface ParsedTemplate {
  template: Template | null;
  error: string | null;
}

export function parseTemplate(text: string): ParsedTemplate {
  if (text.trim() === "") {
    return { template: null, error: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    return { template: null, error: cause instanceof Error ? cause.message : String(cause) };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { template: null, error: "Template must be a JSON object." };
  }

  return { template: parsed as Template, error: null };
}
