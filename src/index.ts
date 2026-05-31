import "./styles/app.css";

export { TemplateBuilder } from "./builder/TemplateBuilder";
export type { TemplateBuilderProps } from "./builder/TemplateBuilder";

export { Builder } from "./builder/Builder";
export type { BuilderProps } from "./builder/Builder";
export { Preview } from "./render/Preview";
export type { PreviewProps } from "./render/Preview";

export { TemplateBuilderProvider, useTemplateBuilder } from "./builder/context/BuilderContext";
export type {
  TemplateBuilderProviderProps,
  BuilderContextValue,
  TemplateExample,
} from "./builder/context/BuilderContext";

export { createInvoiceExample } from "./builder/schema/invoiceExample";
export type { InvoiceExample, InvoiceData, TableRow } from "./builder/schema/invoiceExample";

export { PAGE_SIZES_MM, pageSizeForFormat } from "./builder/lib/pageSizes";
export { mmToPx } from "./builder/lib/displayScale";

export {
  createEditorModel,
  serializeTemplate,
  getPageSize,
  setPageSize,
  getFooterRepeat,
  setFooterRepeat,
  getPageNumbers,
  setPageNumbers,
} from "./builder/state/editorModel";
export type {
  EditorArea,
  EditorBlock,
  EditorModel,
  EditorRow,
  PageNumbersValue,
  ResolvedPageSize,
} from "./builder/state/editorModel";

export { TemplateEditor } from "./editor/TemplateEditor";
export type { TemplateEditorProps } from "./editor/TemplateEditor";
export { CodeEditor } from "./editor/CodeEditor";
export type { CodeEditorProps } from "./editor/CodeEditor";
export {
  TemplateEditorProvider,
  useTemplateEditor,
} from "./editor/TemplateEditorContext";
export type {
  TemplateEditorProviderProps,
  TemplateEditorContextValue,
} from "./editor/TemplateEditorContext";

export { HtmlEditor } from "./html-editor/HtmlEditor";
export type { HtmlEditorProps } from "./html-editor/HtmlEditor";
export { HtmlCodeEditor } from "./html-editor/HtmlCodeEditor";
export type { HtmlCodeEditorProps } from "./html-editor/HtmlCodeEditor";
export { HtmlPreview } from "./html-editor/HtmlPreview";
export type { HtmlPreviewProps } from "./html-editor/HtmlPreview";
export { HtmlEditorProvider, useHtmlEditor } from "./html-editor/HtmlEditorContext";
export type {
  HtmlEditorProviderProps,
  HtmlEditorContextValue,
} from "./html-editor/HtmlEditorContext";

export {
  fetchTemplateSchema,
  renderTemplatePdf,
  renderHtmlPdf,
  resolveDefaultApiUrl,
} from "./api/pdfUaApi";
export type { ConvertHtmlRequest } from "./api/pdfUaApi";
export type { TemplateData, TemplateSchemaResponse } from "./types/template";
export type {
  Align,
  Block,
  HeadingBlock,
  ImageBlock,
  KeyValueBlock,
  Orientation,
  PageConfig,
  PageFormat,
  PageSize,
  Row,
  SpacerBlock,
  TableBlock,
  Template,
  TextBlock,
} from "./types/generated/template";
