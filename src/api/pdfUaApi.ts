import type { FileAttachment } from "../types/generated/template";
import type {
  PdfValidationResponse,
  RenderedPdfPreview,
  Template,
  TemplateData,
  TemplateSchemaResponse,
} from "../types/template";

interface RenderTemplateRequest {
  template: Template;
  data?: TemplateData;
}

interface RenderPdfJsonResponse {
  validation: PdfValidationResponse;
  pdf: string;
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

function postJson(baseUrl: string, path: string, body: unknown, accept: string): Promise<Response> {
  return fetch(joinUrl(baseUrl, path), {
    method: "POST",
    headers: {
      Accept: accept,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
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
  const adapted = rewriteOpenApiRefs(
    repairKnownOpenApiOmissions({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      ...template,
      $defs: templateDefs,
    }),
  );

  return adapted as TemplateSchemaResponse;
}

function repairKnownOpenApiOmissions(schema: Record<string, unknown>): Record<string, unknown> {
  const defs = schema.$defs;

  if (!isRecord(defs) || !isRecord(defs.block) || !isRecord(defs.barcodeBlock)) {
    return schema;
  }

  const oneOf = Array.isArray(defs.block.oneOf) ? defs.block.oneOf : [];
  const hasBarcodeBlock = oneOf.some(
    (entry) => isRecord(entry) && entry.$ref === "#/components/schemas/barcodeBlock",
  );

  if (hasBarcodeBlock) {
    return schema;
  }

  const metadata = schema["x-pdfUa"];
  const metadataRecord = isRecord(metadata) ? metadata : undefined;
  const blockOrder =
    metadataRecord && Array.isArray(metadataRecord.blockOrder)
      ? metadataRecord.blockOrder.filter((entry): entry is string => typeof entry === "string")
      : undefined;

  return {
    ...schema,
    $defs: {
      ...defs,
      block: {
        ...defs.block,
        oneOf: [...oneOf, { $ref: "#/components/schemas/barcodeBlock" }],
      },
    },
    ...(blockOrder
      ? {
          "x-pdfUa": {
            ...metadataRecord,
            blockOrder: insertAfter(blockOrder, "image", "barcode"),
          },
        }
      : {}),
  };
}

function insertAfter(values: readonly string[], after: string, value: string): string[] {
  if (values.includes(value)) {
    return [...values];
  }

  const index = values.indexOf(after);

  if (index === -1) {
    return [...values, value];
  }

  return [...values.slice(0, index + 1), value, ...values.slice(index + 1)];
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
  const response = await postJson(
    baseUrl,
    "/render/template",
    { template: request.template, data: request.data ?? {} },
    "application/pdf, application/json;q=0.1",
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.blob();
}

export async function renderTemplatePreview(
  baseUrl: string,
  request: RenderTemplateRequest,
): Promise<RenderedPdfPreview> {
  const response = await postJson(
    baseUrl,
    "/render/template",
    { template: request.template, data: request.data ?? {} },
    "application/json",
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parsePreviewResponse(response);
}

export async function renderHtmlPdf(
  baseUrl: string,
  request: ConvertHtmlRequest,
): Promise<Blob> {
  const response = await postJson(baseUrl, "/render/html", request, "application/pdf");

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.blob();
}

export async function renderHtmlPreview(
  baseUrl: string,
  request: ConvertHtmlRequest,
): Promise<RenderedPdfPreview> {
  const response = await postJson(baseUrl, "/render/html", request, "application/json");

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parsePreviewResponse(response);
}

async function parsePreviewResponse(response: Response): Promise<RenderedPdfPreview> {
  const payload = (await response.json()) as Partial<RenderPdfJsonResponse>;

  if (!payload.validation || typeof payload.pdf !== "string") {
    throw new Error("Render response did not contain validation and pdf.");
  }

  return {
    pdf: base64ToBlob(payload.pdf, "application/pdf"),
    validation: payload.validation,
  };
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type });
}
