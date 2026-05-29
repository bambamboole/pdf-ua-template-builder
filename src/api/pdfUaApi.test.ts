import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Template } from "../types/generated/template";
import { fetchTemplateSchema, renderTemplatePdf } from "./pdfUaApi";

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
    templateVersion: 1,
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
  it("requests /schema joined to the base URL and returns the parsed schema", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(schema), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchTemplateSchema("http://api.test");

    expect(result).toEqual(schema);
    const [url, init] = lastCall();
    expect(url).toBe("http://api.test/schema");
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  it("collapses duplicate slashes between base URL and path", async () => {
    const schemaResponse = () =>
      new Response(JSON.stringify(schema), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    mockFetch.mockResolvedValueOnce(schemaResponse());
    await fetchTemplateSchema("http://api.test/");
    expect(lastCall()[0]).toBe("http://api.test/schema");

    mockFetch.mockResolvedValueOnce(schemaResponse());
    await fetchTemplateSchema("");
    expect(lastCall()[0]).toBe("/schema");
  });

  it("throws the server-provided message from a JSON error body", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "schema not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchTemplateSchema("http://api.test")).rejects.toThrow("schema not found");
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
  const template: Template = { version: 1 };

  it("posts to /render/template with default data/options and returns the blob", async () => {
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
      Accept: "application/pdf",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({ data: {}, options: {}, template });
  });

  it("lets the caller override data and options", async () => {
    mockFetch.mockResolvedValueOnce(new Response("%PDF", { status: 200 }));

    await renderTemplatePdf("http://api.test", {
      template,
      data: { lineItems: [{ name: "A" }] },
      options: { title: "Invoice" },
    });

    expect(JSON.parse(String(lastCall()[1].body))).toEqual({
      template,
      data: { lineItems: [{ name: "A" }] },
      options: { title: "Invoice" },
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
});
