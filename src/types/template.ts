export type { Template } from "./generated/template";

export type JsonObject = Record<string, unknown>;
export type TemplateData = Record<string, unknown>;

export interface RenderOptions {
  title?: string;
  baseUrl?: string;
}

export interface TemplatePageFormat {
  name: string;
  widthMm: number;
  heightMm: number;
}

export interface TemplateSchemaMetadata {
  kind: "template";
  templateVersion: number;
  renderEndpoint: string;
  templateFields: string[];
  attachmentFields: string[];
  externalFontFields: string[];
  bundledFonts: string[];
  blockOrder: string[];
  pageFormats: TemplatePageFormat[];
}

export interface TemplateSchemaResponse {
  $schema?: string;
  $id?: string;
  title?: string;
  type?: string;
  properties?: JsonObject;
  $defs?: JsonObject;
  "x-pdfUa": TemplateSchemaMetadata;
}

export function getTemplateSchemaMetadata(schema: TemplateSchemaResponse): TemplateSchemaMetadata {
  return schema["x-pdfUa"];
}
