export { TemplateBuilder } from "./TemplateBuilder";
export type { TemplateBuilderProps } from "./TemplateBuilder";

export { Builder } from "./Builder";
export type { BuilderProps } from "./Builder";

export { TemplateBuilderProvider, useTemplateBuilder } from "./context/BuilderContext";
export type {
  TemplateBuilderProviderProps,
  BuilderContextValue,
  TemplateExample,
} from "./context/BuilderContext";

export { createInvoiceExample } from "./schema/invoiceExample";
export type { InvoiceExample, InvoiceData, TableRow } from "./schema/invoiceExample";

export { PAGE_SIZES_MM, pageSizeForFormat } from "./lib/pageSizes";
export { mmToPx } from "./lib/displayScale";

export {
  createEditorModel,
  serializeTemplate,
  getPageSize,
  setPageSize,
  getFooterRepeat,
  setFooterRepeat,
  getPageNumbers,
  setPageNumbers,
} from "./state/editorModel";
export type {
  EditorArea,
  EditorBlock,
  EditorModel,
  EditorRow,
  PageNumbersValue,
  ResolvedPageSize,
} from "./state/editorModel";
