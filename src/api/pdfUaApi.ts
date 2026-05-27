import type {
  RenderOptions,
  Template,
  TemplateData,
  TemplateSchemaResponse,
} from "../types/template";

interface RenderTemplateRequest {
  template: Template;
  data?: TemplateData;
  options?: RenderOptions;
}

export function resolveDefaultApiUrl(configuredApiUrl?: string): string {
  return configuredApiUrl ?? "";
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function parseError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? response.statusText;
  }

  return response.text();
}

export async function fetchTemplateSchema(baseUrl: string): Promise<TemplateSchemaResponse> {
  const response = await fetch(joinUrl(baseUrl, "/schema"), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as TemplateSchemaResponse;
}

export async function renderTemplatePdf(
  baseUrl: string,
  request: RenderTemplateRequest,
): Promise<Blob> {
  const response = await fetch(joinUrl(baseUrl, "/render/template"), {
    method: "POST",
    headers: {
      Accept: "application/pdf",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {},
      options: {},
      ...request,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.blob();
}
