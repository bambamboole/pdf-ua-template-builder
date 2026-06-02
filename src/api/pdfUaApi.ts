import type { FileAttachment } from "../types/generated/template";
import type { Template, TemplateData, TemplateSchemaResponse } from "../types/template";

interface RenderTemplateRequest {
  template: Template;
  data?: TemplateData;
}

export interface ConvertHtmlRequest {
  /** Raw HTML document to convert to a PDF/UA document. */
  html: string;
  /** Base URL used to resolve relative asset references in the HTML. */
  baseUrl?: string;
  /** Files to embed in the produced PDF/A-3 document. */
  attachments?: FileAttachment[];
}

interface OpenApiDocument {
  components?: {
    schemas?: Record<string, unknown>;
  };
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
  const response = await fetch(joinUrl(baseUrl, "/openapi.json"), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return extractTemplateSchemaFromOpenApi((await response.json()) as OpenApiDocument);
}

function extractTemplateSchemaFromOpenApi(openApi: OpenApiDocument): TemplateSchemaResponse {
  const schemas = openApi.components?.schemas;
  const template = schemas?.Template;

  if (!isRecord(schemas) || !isRecord(template)) {
    throw new Error("OpenAPI document does not contain components.schemas.Template");
  }

  const templateDefs = isRecord(template.$defs)
    ? template.$defs
    : Object.fromEntries(Object.entries(schemas).filter(([name]) => name !== "Template"));
  const adapted = rewriteOpenApiRefs({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...template,
    $defs: templateDefs,
  });

  return adapted as TemplateSchemaResponse;
}

function rewriteOpenApiRefs(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(rewriteOpenApiRefs);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      key === "$ref" && typeof nested === "string"
        ? nested.replace(/^#\/components\/schemas\//, "#/$defs/")
        : rewriteOpenApiRefs(nested),
    ]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function renderTemplatePdf(
  baseUrl: string,
  request: RenderTemplateRequest,
): Promise<Blob> {
  const response = await fetch(joinUrl(baseUrl, "/render/template"), {
    method: "POST",
    headers: {
      Accept: "application/pdf, application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template: request.template,
      data: request.data ?? {},
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
  const response = await fetch(joinUrl(baseUrl, "/render/html"), {
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
