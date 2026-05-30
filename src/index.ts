import "./styles/app.css";

export { TemplateBuilder } from "./builder/TemplateBuilder";
export type { TemplateBuilderProps } from "./builder/TemplateBuilder";

export { useTemplateBuilder } from "./builder/context/BuilderContext";
export type {
  BuilderProviderProps,
  BuilderContextValue,
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

export { fetchTemplateSchema, renderTemplatePdf, resolveDefaultApiUrl } from "./api/pdfUaApi";
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
