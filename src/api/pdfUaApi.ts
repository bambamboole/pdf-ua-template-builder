import type { FileAttachment } from "../types/generated/template";
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

export interface ConvertHtmlRequest {
  /** Raw HTML document to convert to a PDF/UA document. */
  html: string;
  /** Base URL used to resolve relative asset references in the HTML. */
  baseUrl?: string;
  /** Files to embed in the produced PDF/A-3 document. */
  attachments?: FileAttachment[];
}

export function resolveDefaultApiUrl(configuredApiUrl?: string): string {
  return configuredApiUrl ?? "";
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function parseError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  const fallback = `${response.status} ${response.statusText || "Request failed"}`;

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  }

  const body = (await response.text()).trim();
  return body || fallback;
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

export async function renderHtmlPdf(
  baseUrl: string,
  request: ConvertHtmlRequest,
): Promise<Blob> {
  const response = await fetch(joinUrl(baseUrl, "/convert"), {
    method: "POST",
    headers: {
      Accept: "application/pdf",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.blob();
}
