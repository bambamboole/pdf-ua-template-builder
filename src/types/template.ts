export type { Template } from "./generated/template";

export type JsonObject = Record<string, unknown>;
export type TemplateData = Record<string, unknown>;

export type JsonSchemaValue =
  | string
  | number
  | boolean
  | null
  | JsonSchemaObject
  | JsonSchemaValue[];

export interface JsonSchemaObject {
  [key: string]: unknown;
}

export interface PdfValidationProfile {
  profile: string;
  specification: string;
  isCompliant: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
}

export interface PdfValidationCategory {
  category: string;
  passedChecks: number;
  failedChecks: number;
}

export interface PdfValidationSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  categories?: PdfValidationCategory[];
}

export interface PdfValidationFailure {
  profile: string;
  clause: string;
  testNumber: number;
  category: string;
  message: string;
  location?: string | null;
  errorDetails?: string | null;
}

export interface PdfDocumentInfo {
  pages: number;
  tagged: boolean;
  language?: string | null;
  structureElements: number;
  fonts: Array<{
    name: string;
    embedded: boolean;
    type: string;
  }>;
  images: number;
}

export interface PdfMetadata {
  title?: string | null;
  subject?: string | null;
  author?: string | null;
  creator?: string | null;
  producer?: string | null;
  creationDate?: string | null;
}

export interface PdfValidationResponse {
  isCompliant: boolean;
  profiles: PdfValidationProfile[];
  summary: PdfValidationSummary;
  documentInfo?: PdfDocumentInfo | null;
  failures?: PdfValidationFailure[];
  metadata?: PdfMetadata | null;
}

export interface RenderedPdfPreview {
  pdf: Blob;
  validation: PdfValidationResponse;
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

export type TemplateSchemaPropertyGroup = "content" | "layout" | "style" | "data";

export interface TemplateSchemaResponse extends JsonSchemaObject {
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
