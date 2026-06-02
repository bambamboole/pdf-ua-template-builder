import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Template } from "../types/generated/template";
import {
  fetchTemplateSchema,
  renderHtmlPdf,
  renderHtmlPreview,
  renderTemplatePdf,
  renderTemplatePreview,
} from "./pdfUaApi";

const mockFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function lastCall(): [string, RequestInit] {
  const call = mockFetch.mock.calls.at(-1);
  if (!call) {
    throw new Error("fetch was not called");
  }
  return [String(call[0]), (call[1] ?? {}) as RequestInit];
}

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  "x-pdfUa": {
    kind: "template",
    templateVersion: 2,
    renderEndpoint: "/render/template",
    templateFields: [],
    attachmentFields: [],
    externalFontFields: [],
    bundledFonts: [],
    blockOrder: ["text"],
    pageFormats: [],
  },
};

describe("fetchTemplateSchema", () => {
  it("requests /openapi.json joined to the base URL and returns components.schemas.Template", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ openapi: "3.1.1", components: { schemas: { Template: schema } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchTemplateSchema("http://api.test");

    expect(result).toEqual({ ...schema, $defs: {} });
    const [url, init] = lastCall();
    expect(url).toBe("http://api.test/openapi.json");
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  it("collapses duplicate slashes between base URL and path", async () => {
    const openApiResponse = () =>
      new Response(JSON.stringify({ openapi: "3.1.1", components: { schemas: { Template: schema } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    mockFetch.mockResolvedValueOnce(openApiResponse());
    await fetchTemplateSchema("http://api.test/");
    expect(lastCall()[0]).toBe("http://api.test/openapi.json");

    mockFetch.mockResolvedValueOnce(openApiResponse());
    await fetchTemplateSchema("");
    expect(lastCall()[0]).toBe("/openapi.json");
  });

  it("throws the server-provided message from a JSON error body", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "openapi not found" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchTemplateSchema("http://api.test")).rejects.toThrow("openapi not found");
  });

  it("extracts OpenAPI components.schemas.Template with embedded $defs", async () => {
    const templateSchema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "Template",
      type: "object",
      properties: { version: { const: 2 } },
      $defs: { block: { oneOf: [] } },
      "x-pdfUa": schema["x-pdfUa"],
    };
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          openapi: "3.1.1",
          components: { schemas: { Template: templateSchema } },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(fetchTemplateSchema("http://api.test")).resolves.toEqual(templateSchema);

    expect(mockFetch.mock.calls.map(([url]) => String(url))).toEqual(["http://api.test/openapi.json"]);
  });

  it("rewrites OpenAPI component refs into template $defs refs", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          openapi: "3.1.1",
          components: {
            schemas: {
              Template: {
                title: "Template",
                type: "object",
                properties: {
                  rows: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Row" },
                  },
                },
                "x-pdfUa": schema["x-pdfUa"],
              },
              Row: {
                type: "object",
                properties: {
                  blocks: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Block" },
                  },
                },
              },
              Block: { oneOf: [] },
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(fetchTemplateSchema("http://api.test")).resolves.toEqual(
      expect.objectContaining({
        properties: {
          rows: {
            type: "array",
            items: { $ref: "#/$defs/Row" },
          },
        },
        $defs: {
          Row: {
            type: "object",
            properties: {
              blocks: {
                type: "array",
                items: { $ref: "#/$defs/Block" },
              },
            },
          },
          Block: { oneOf: [] },
        },
      }),
    );
  });

  it("throws when OpenAPI does not contain components.schemas.Template", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ openapi: "3.1.1", components: { schemas: {} } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchTemplateSchema("http://api.test")).rejects.toThrow(
      "OpenAPI document does not contain components.schemas.Template",
    );
  });

  it("throws a plain-text error body", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("upstream exploded", {
        status: 500,
        headers: { "content-type": "text/plain" },
      }),
    );

    await expect(fetchTemplateSchema("http://api.test")).rejects.toThrow("upstream exploded");
  });

  it("falls back to status text when the error body is empty", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("", { status: 503, statusText: "Service Unavailable" }),
    );

    await expect(fetchTemplateSchema("http://api.test")).rejects.toThrow("503 Service Unavailable");
  });
});

describe("renderTemplatePdf", () => {
  const template: Template = { version: 2 };

  it("posts to /render/template with default data and returns the blob", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("%PDF-1.7", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );

    const blob = await renderTemplatePdf("http://api.test", { template });

    expect(await blob.text()).toBe("%PDF-1.7");
    const [url, init] = lastCall();
    expect(url).toBe("http://api.test/render/template");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Accept: "application/pdf, application/json;q=0.1",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({ data: {}, template });
  });

  it("lets the caller override data", async () => {
    mockFetch.mockResolvedValueOnce(new Response("%PDF", { status: 200 }));

    await renderTemplatePdf("http://api.test", {
      template,
      data: { lineItems: [{ name: "A" }] },
    });

    expect(JSON.parse(String(lastCall()[1].body))).toEqual({
      template,
      data: { lineItems: [{ name: "A" }] },
    });
  });

  it("throws the parsed error on a failed render", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "invalid template" }), {
        status: 422,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(renderTemplatePdf("http://api.test", { template })).rejects.toThrow(
      "invalid template",
    );
  });

  it("requests JSON preview output and decodes the returned PDF", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdf: "JVBERi0xLjc=", validation: validValidation }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await renderTemplatePreview("http://api.test", { template });

    expect(await result.pdf.text()).toBe("%PDF-1.7");
    expect(result.validation).toEqual(validValidation);
    expect(lastCall()[1].headers).toMatchObject({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({ data: {}, template });
  });
});

describe("renderHtmlPdf", () => {
  it("posts the HTML to /render/html and returns the blob", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("%PDF-1.7", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );

    const blob = await renderHtmlPdf("http://api.test", { html: "<h1>Hi</h1>" });

    expect(await blob.text()).toBe("%PDF-1.7");
    const [url, init] = lastCall();
    expect(url).toBe("http://api.test/render/html");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Accept: "application/pdf",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({ html: "<h1>Hi</h1>" });
  });

  it("includes baseUrl when provided and omits unset fields", async () => {
    mockFetch.mockResolvedValueOnce(new Response("%PDF", { status: 200 }));

    await renderHtmlPdf("http://api.test", {
      html: "<p>x</p>",
      baseUrl: "https://assets.test",
    });

    expect(JSON.parse(String(lastCall()[1].body))).toEqual({
      html: "<p>x</p>",
      baseUrl: "https://assets.test",
    });
  });

  it("throws the parsed error on a failed conversion", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "HTML content cannot be empty" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(renderHtmlPdf("http://api.test", { html: "" })).rejects.toThrow(
      "HTML content cannot be empty",
    );
  });

  it("requests JSON preview output and decodes the returned PDF", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ pdf: "JVBERi0xLjc=", validation: validValidation }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await renderHtmlPreview("http://api.test", { html: "<h1>Hi</h1>" });

    expect(await result.pdf.text()).toBe("%PDF-1.7");
    expect(result.validation).toEqual(validValidation);
    const [url, init] = lastCall();
    expect(url).toBe("http://api.test/render/html");
    expect(init.headers).toMatchObject({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({ html: "<h1>Hi</h1>" });
  });
});

const validValidation = {
  isCompliant: true,
  profiles: [
    {
      profile: "PDF/UA-1",
      specification: "ISO 14289-1",
      isCompliant: true,
      totalChecks: 2,
      passedChecks: 2,
      failedChecks: 0,
    },
  ],
  summary: {
    totalChecks: 2,
    passedChecks: 2,
    failedChecks: 0,
    categories: [],
  },
  failures: [],
};
